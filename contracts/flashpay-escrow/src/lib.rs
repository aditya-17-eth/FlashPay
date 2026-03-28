#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env,
    String, Vec,
    token::Client as TokenClient,
};

mod errors;
mod events;
mod storage;

pub use errors::ContractError;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StorageKey {
    Payment(u64),
    NonceUsed(u64),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentRecord {
    pub payer: Address,
    pub payee: Address,
    pub amount: i128,
    pub nonce: u64,
    pub tool: String,
    pub timestamp: u64,
    pub released: bool,
    pub refunded: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Stats {
    pub total_payments: u64,
    pub total_volume_usdc: i128,
    pub total_users: u64,
    pub image_count: u64,
    pub summarise_count: u64,
    pub pdf_count: u64,
    pub code_count: u64,
}

#[contract]
pub struct FlashPayEscrow;

#[contractimpl]
impl FlashPayEscrow {
    /// Called once on deploy — sets USDC token address and payee
    pub fn initialize(env: Env, usdc_token: Address, payee: Address) -> Result<(), ContractError> {
        if storage::is_initialized(&env) {
            return Err(ContractError::AlreadyInitialized);
        }
        storage::set_usdc_token(&env, &usdc_token);
        storage::set_payee(&env, &payee);
        storage::set_initialized(&env);

        // Initialize empty stats
        storage::set_stats(&env, &Stats {
            total_payments: 0,
            total_volume_usdc: 0,
            total_users: 0,
            image_count: 0,
            summarise_count: 0,
            pdf_count: 0,
            code_count: 0,
        });

        Ok(())
    }

    /// User triggers this when paying for a tool
    /// tool: "image" | "summarise" | "pdf" | "code"
    pub fn lock_payment(
        env: Env,
        payer: Address,
        amount: i128,
        nonce: u64,
        tool: String,
    ) -> Result<PaymentRecord, ContractError> {
        // Require payer authorization
        payer.require_auth();

        // Validate amount
        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        // Check nonce dedup
        if storage::is_nonce_used(&env, nonce) {
            return Err(ContractError::NonceAlreadyUsed);
        }

        // Mark nonce as used (temporary storage ~1 hour)
        storage::mark_nonce_used(&env, nonce);

        // Get payee and USDC token
        let payee = storage::get_payee(&env);
        let usdc_token = storage::get_usdc_token(&env);

        // Transfer USDC from payer to this contract
        let token_client = TokenClient::new(&env, &usdc_token);
        token_client.transfer(&payer, &env.current_contract_address(), &amount);

        // Create payment record
        let timestamp = env.ledger().timestamp();
        let record = PaymentRecord {
            payer: payer.clone(),
            payee: payee.clone(),
            amount,
            nonce,
            tool: tool.clone(),
            timestamp,
            released: false,
            refunded: false,
        };

        // Store payment record
        storage::set_payment(&env, nonce, &record);

        // Update stats
        let mut stats = storage::get_stats(&env);
        stats.total_payments += 1;
        stats.total_volume_usdc += amount;

        // Increment per-tool counter
        Self::increment_tool_count(&env, &mut stats, &tool);

        // Add user if new
        if storage::add_user_if_new(&env, &payer) {
            stats.total_users += 1;
        }

        storage::set_stats(&env, &stats);

        // Emit event
        events::emit_payment_locked(&env, &payer, nonce, amount, &tool);

        Ok(record)
    }

    /// Backend calls this after AI result is delivered
    pub fn release_payment(
        env: Env,
        payee: Address,
        nonce: u64,
    ) -> Result<(), ContractError> {
        payee.require_auth();

        // Verify payee matches stored payee
        let stored_payee = storage::get_payee(&env);
        if payee != stored_payee {
            return Err(ContractError::Unauthorized);
        }

        // Get payment record
        let mut record = storage::get_payment(&env, nonce)
            .ok_or(ContractError::PaymentNotFound)?;

        if record.released {
            return Err(ContractError::AlreadyReleased);
        }
        if record.refunded {
            return Err(ContractError::AlreadyRefunded);
        }

        // Transfer USDC from contract to payee
        let usdc_token = storage::get_usdc_token(&env);
        let token_client = TokenClient::new(&env, &usdc_token);
        token_client.transfer(&env.current_contract_address(), &payee, &record.amount);

        // Update record
        record.released = true;
        storage::set_payment(&env, nonce, &record);

        // Emit event
        events::emit_payment_released(&env, &payee, nonce, record.amount);

        Ok(())
    }

    /// Refund if AI API fails — called by backend on error
    pub fn refund_payment(
        env: Env,
        payee: Address,
        nonce: u64,
    ) -> Result<(), ContractError> {
        payee.require_auth();

        // Verify payee matches stored payee
        let stored_payee = storage::get_payee(&env);
        if payee != stored_payee {
            return Err(ContractError::Unauthorized);
        }

        // Get payment record
        let mut record = storage::get_payment(&env, nonce)
            .ok_or(ContractError::PaymentNotFound)?;

        if record.released {
            return Err(ContractError::AlreadyReleased);
        }
        if record.refunded {
            return Err(ContractError::AlreadyRefunded);
        }

        // Transfer USDC from contract back to payer
        let usdc_token = storage::get_usdc_token(&env);
        let token_client = TokenClient::new(&env, &usdc_token);
        token_client.transfer(&env.current_contract_address(), &record.payer, &record.amount);

        // Update record
        record.refunded = true;
        storage::set_payment(&env, nonce, &record);

        // Emit event
        events::emit_payment_refunded(&env, &record.payer, nonce, record.amount);

        Ok(())
    }

    /// Read a payment record by nonce (no auth required)
    pub fn get_payment(env: Env, nonce: u64) -> Result<PaymentRecord, ContractError> {
        storage::get_payment(&env, nonce)
            .ok_or(ContractError::PaymentNotFound)
    }

    /// Read aggregate stats (no auth required)
    pub fn get_stats(env: Env) -> Stats {
        storage::get_stats(&env)
    }

    /// Read list of unique users (no auth required)
    pub fn get_users(env: Env) -> Vec<Address> {
        storage::get_users(&env)
    }

    // --- Private helpers ---

    fn increment_tool_count(env: &Env, stats: &mut Stats, tool: &String) {
        let image_str = String::from_str(env, "image");
        let summarise_str = String::from_str(env, "summarise");
        let pdf_str = String::from_str(env, "pdf");
        let code_str = String::from_str(env, "code");

        if *tool == image_str {
            stats.image_count += 1;
        } else if *tool == summarise_str {
            stats.summarise_count += 1;
        } else if *tool == pdf_str {
            stats.pdf_count += 1;
        } else if *tool == code_str {
            stats.code_count += 1;
        }
    }
}

#[cfg(test)]
mod test;
