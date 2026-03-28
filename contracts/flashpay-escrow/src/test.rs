#![cfg(test)]

use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env, String,
};

use crate::{FlashPayEscrow, FlashPayEscrowClient, ContractError};

/// Helper: create test environment with deployed contract + USDC token
fn setup() -> (Env, Address, Address, Address, FlashPayEscrowClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();

    // Deploy the FlashPay escrow contract
    let contract_id = env.register(FlashPayEscrow, ());
    let client = FlashPayEscrowClient::new(&env, &contract_id);

    // Create USDC token (Stellar Asset Contract)
    let admin = Address::generate(&env);
    let usdc_id = env.register_stellar_asset_contract_v2(admin.clone());
    let usdc_sac = StellarAssetClient::new(&env, &usdc_id.address());
    let usdc_token = TokenClient::new(&env, &usdc_id.address());

    // Payee (service provider)
    let payee = Address::generate(&env);

    // Initialize the contract
    client.initialize(&usdc_id.address(), &payee);

    // Return env, usdc address, payee, admin (for minting), and client
    // We'll leak env to make lifetimes work in tests
    let env_leaked: &'static Env = Box::leak(Box::new(env));

    // Re-create everything with the leaked env
    let contract_id2 = env_leaked.register(FlashPayEscrow, ());
    let client2 = FlashPayEscrowClient::new(env_leaked, &contract_id2);

    let admin2 = Address::generate(env_leaked);
    let usdc_id2 = env_leaked.register_stellar_asset_contract_v2(admin2.clone());
    let usdc_sac2 = StellarAssetClient::new(env_leaked, &usdc_id2.address());

    let payee2 = Address::generate(env_leaked);
    client2.initialize(&usdc_id2.address(), &payee2);

    (env_leaked.clone(), usdc_id2.address(), payee2, admin2, client2)
}

/// Simpler setup that doesn't leak - just uses scoped env
fn setup_env() -> (Env, Address, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(FlashPayEscrow, ());

    let admin = Address::generate(&env);
    let usdc_id = env.register_stellar_asset_contract_v2(admin.clone());

    let payee = Address::generate(&env);

    // Initialize
    let client = FlashPayEscrowClient::new(&env, &contract_id);
    client.initialize(&usdc_id.address(), &payee);

    (env, contract_id, usdc_id.address(), payee, admin)
}

fn mint_usdc(env: &Env, usdc: &Address, admin: &Address, to: &Address, amount: i128) {
    let sac = StellarAssetClient::new(env, usdc);
    sac.mint(to, &amount);
}

// ===== TEST 1: test_initialize =====
#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(FlashPayEscrow, ());
    let client = FlashPayEscrowClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let usdc_id = env.register_stellar_asset_contract_v2(admin.clone());
    let payee = Address::generate(&env);

    // Initialize should succeed
    client.initialize(&usdc_id.address(), &payee);

    // Verify stats are initialized
    let stats = client.get_stats();
    assert_eq!(stats.total_payments, 0);
    assert_eq!(stats.total_volume_usdc, 0);
    assert_eq!(stats.total_users, 0);
    assert_eq!(stats.image_count, 0);
    assert_eq!(stats.summarise_count, 0);
    assert_eq!(stats.pdf_count, 0);
    assert_eq!(stats.code_count, 0);

    // Verify users list is empty
    let users = client.get_users();
    assert_eq!(users.len(), 0);
}

// ===== TEST 2: test_lock_payment_image =====
#[test]
fn test_lock_payment_image() {
    let (env, contract_id, usdc, payee, admin) = setup_env();
    let client = FlashPayEscrowClient::new(&env, &contract_id);

    let payer = Address::generate(&env);
    let amount: i128 = 50_000; // 0.005 USDC (7 decimals)

    // Mint USDC to payer
    mint_usdc(&env, &usdc, &admin, &payer, 1_000_000);

    // Lock payment for image tool
    let tool = String::from_str(&env, "image");
    let record = client.lock_payment(&payer, &amount, &1001_u64, &tool);

    assert_eq!(record.payer, payer);
    assert_eq!(record.payee, payee);
    assert_eq!(record.amount, amount);
    assert_eq!(record.nonce, 1001);
    assert_eq!(record.released, false);
    assert_eq!(record.refunded, false);

    // Verify stats
    let stats = client.get_stats();
    assert_eq!(stats.total_payments, 1);
    assert_eq!(stats.total_volume_usdc, amount);
    assert_eq!(stats.image_count, 1);
    assert_eq!(stats.total_users, 1);
}

// ===== TEST 3: test_lock_payment_code =====
#[test]
fn test_lock_payment_code() {
    let (env, contract_id, usdc, _payee, admin) = setup_env();
    let client = FlashPayEscrowClient::new(&env, &contract_id);

    let payer = Address::generate(&env);
    let amount: i128 = 30_000; // 0.003 USDC

    mint_usdc(&env, &usdc, &admin, &payer, 1_000_000);

    let tool = String::from_str(&env, "code");
    client.lock_payment(&payer, &amount, &2001_u64, &tool);

    let stats = client.get_stats();
    assert_eq!(stats.total_payments, 1);
    assert_eq!(stats.code_count, 1);
    assert_eq!(stats.image_count, 0);
}

// ===== TEST 4: test_release_payment =====
#[test]
fn test_release_payment() {
    let (env, contract_id, usdc, payee, admin) = setup_env();
    let client = FlashPayEscrowClient::new(&env, &contract_id);

    let payer = Address::generate(&env);
    let amount: i128 = 50_000;

    mint_usdc(&env, &usdc, &admin, &payer, 1_000_000);

    let tool = String::from_str(&env, "image");
    client.lock_payment(&payer, &amount, &3001_u64, &tool);

    // Check payee balance before release
    let token = TokenClient::new(&env, &usdc);
    let payee_balance_before = token.balance(&payee);

    // Release payment
    client.release_payment(&payee, &3001_u64);

    // Verify payee received funds
    let payee_balance_after = token.balance(&payee);
    assert_eq!(payee_balance_after - payee_balance_before, amount);

    // Verify record updated
    let record = client.get_payment(&3001_u64);
    assert_eq!(record.released, true);
    assert_eq!(record.refunded, false);
}

// ===== TEST 5: test_refund_payment =====
#[test]
fn test_refund_payment() {
    let (env, contract_id, usdc, payee, admin) = setup_env();
    let client = FlashPayEscrowClient::new(&env, &contract_id);

    let payer = Address::generate(&env);
    let amount: i128 = 20_000; // 0.002 USDC

    mint_usdc(&env, &usdc, &admin, &payer, 1_000_000);

    let tool = String::from_str(&env, "pdf");
    client.lock_payment(&payer, &amount, &4001_u64, &tool);

    // Check payer balance after lock
    let token = TokenClient::new(&env, &usdc);
    let payer_balance_after_lock = token.balance(&payer);

    // Refund payment
    client.refund_payment(&payee, &4001_u64);

    // Verify payer got funds back
    let payer_balance_after_refund = token.balance(&payer);
    assert_eq!(payer_balance_after_refund - payer_balance_after_lock, amount);

    // Verify record updated
    let record = client.get_payment(&4001_u64);
    assert_eq!(record.released, false);
    assert_eq!(record.refunded, true);
}

// ===== TEST 6: test_duplicate_nonce =====
#[test]
fn test_duplicate_nonce() {
    let (env, contract_id, usdc, _payee, admin) = setup_env();
    let client = FlashPayEscrowClient::new(&env, &contract_id);

    let payer = Address::generate(&env);
    let amount: i128 = 50_000;

    mint_usdc(&env, &usdc, &admin, &payer, 10_000_000);

    let tool = String::from_str(&env, "image");
    client.lock_payment(&payer, &amount, &5001_u64, &tool);

    // Same nonce should fail
    let result = client.try_lock_payment(&payer, &amount, &5001_u64, &tool);
    assert!(result.is_err());
}

// ===== TEST 7: test_unauthorized_release =====
#[test]
fn test_unauthorized_release() {
    let (env, contract_id, usdc, payee, admin) = setup_env();
    let client = FlashPayEscrowClient::new(&env, &contract_id);

    let payer = Address::generate(&env);
    let amount: i128 = 50_000;

    mint_usdc(&env, &usdc, &admin, &payer, 1_000_000);

    let tool = String::from_str(&env, "image");
    client.lock_payment(&payer, &amount, &6001_u64, &tool);

    // Payer tries to release — should fail (not the payee)
    let fake_payee = Address::generate(&env);
    let result = client.try_release_payment(&fake_payee, &6001_u64);
    assert!(result.is_err());
}

// ===== TEST 8: test_get_stats =====
#[test]
fn test_get_stats() {
    let (env, contract_id, usdc, _payee, admin) = setup_env();
    let client = FlashPayEscrowClient::new(&env, &contract_id);

    let payer = Address::generate(&env);
    mint_usdc(&env, &usdc, &admin, &payer, 100_000_000);

    // Lock 4 payments across all tools
    let image = String::from_str(&env, "image");
    let summarise = String::from_str(&env, "summarise");
    let pdf = String::from_str(&env, "pdf");
    let code = String::from_str(&env, "code");

    client.lock_payment(&payer, &50_000_i128, &7001_u64, &image);
    client.lock_payment(&payer, &10_000_i128, &7002_u64, &summarise);
    client.lock_payment(&payer, &20_000_i128, &7003_u64, &pdf);
    client.lock_payment(&payer, &30_000_i128, &7004_u64, &code);

    let stats = client.get_stats();
    assert_eq!(stats.total_payments, 4);
    assert_eq!(stats.total_volume_usdc, 110_000);
    assert_eq!(stats.image_count, 1);
    assert_eq!(stats.summarise_count, 1);
    assert_eq!(stats.pdf_count, 1);
    assert_eq!(stats.code_count, 1);
    assert_eq!(stats.total_users, 1); // same payer
}

// ===== TEST 9: test_get_users =====
#[test]
fn test_get_users() {
    let (env, contract_id, usdc, _payee, admin) = setup_env();
    let client = FlashPayEscrowClient::new(&env, &contract_id);

    let payer1 = Address::generate(&env);
    let payer2 = Address::generate(&env);
    let payer3 = Address::generate(&env);

    mint_usdc(&env, &usdc, &admin, &payer1, 10_000_000);
    mint_usdc(&env, &usdc, &admin, &payer2, 10_000_000);
    mint_usdc(&env, &usdc, &admin, &payer3, 10_000_000);

    let tool = String::from_str(&env, "image");

    client.lock_payment(&payer1, &50_000_i128, &8001_u64, &tool);
    client.lock_payment(&payer2, &50_000_i128, &8002_u64, &tool);
    client.lock_payment(&payer3, &50_000_i128, &8003_u64, &tool);

    // Also lock again with payer1 — should NOT add duplicate
    client.lock_payment(&payer1, &50_000_i128, &8004_u64, &tool);

    let users = client.get_users();
    assert_eq!(users.len(), 3);

    let stats = client.get_stats();
    assert_eq!(stats.total_users, 3);
}
