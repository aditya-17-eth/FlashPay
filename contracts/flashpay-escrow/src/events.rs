use soroban_sdk::{Env, Symbol, symbol_short, Address};

pub fn emit_payment_locked(env: &Env, payer: &Address, nonce: u64, amount: i128, tool: &soroban_sdk::String) {
    env.events().publish(
        (symbol_short!("lock"), payer.clone()),
        (nonce, amount, tool.clone()),
    );
}

pub fn emit_payment_released(env: &Env, payee: &Address, nonce: u64, amount: i128) {
    env.events().publish(
        (symbol_short!("release"), payee.clone()),
        (nonce, amount),
    );
}

pub fn emit_payment_refunded(env: &Env, payer: &Address, nonce: u64, amount: i128) {
    env.events().publish(
        (symbol_short!("refund"), payer.clone()),
        (nonce, amount),
    );
}
