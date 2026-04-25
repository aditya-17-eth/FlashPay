use soroban_sdk::{Address, Env, Symbol, symbol_short, Vec};

use crate::{PaymentRecord, Session, Stats, StorageKey};

const USDC_KEY: Symbol = symbol_short!("USDC");
const PAYEE_KEY: Symbol = symbol_short!("PAYEE");
const STATS_KEY: Symbol = symbol_short!("STATS");
const USERS_KEY: Symbol = symbol_short!("USERS");
const INIT_KEY: Symbol = symbol_short!("INIT");

const TTL_THRESHOLD: u32 = 17280;
const TTL_EXTEND: u32 = 17280;
const TEMP_TTL: u32 = 7200; // ~1 hour in ledgers

// --- Initialization ---

pub fn set_initialized(env: &Env) {
    env.storage().instance().set(&INIT_KEY, &true);
    env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND);
}

pub fn is_initialized(env: &Env) -> bool {
    env.storage().instance().has(&INIT_KEY)
}

// --- USDC Token ---

pub fn set_usdc_token(env: &Env, token: &Address) {
    env.storage().instance().set(&USDC_KEY, token);
}

pub fn get_usdc_token(env: &Env) -> Address {
    env.storage().instance().get(&USDC_KEY).unwrap()
}

// --- Payee ---

pub fn set_payee(env: &Env, payee: &Address) {
    env.storage().instance().set(&PAYEE_KEY, payee);
}

pub fn get_payee(env: &Env) -> Address {
    env.storage().instance().get(&PAYEE_KEY).unwrap()
}

// --- Stats ---

pub fn get_stats(env: &Env) -> Stats {
    env.storage().instance().get(&STATS_KEY).unwrap_or(Stats {
        total_payments: 0,
        total_volume_usdc: 0,
        total_users: 0,
        image_count: 0,
        summarise_count: 0,
        pdf_count: 0,
        code_count: 0,
    })
}

pub fn set_stats(env: &Env, stats: &Stats) {
    env.storage().instance().set(&STATS_KEY, stats);
    env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND);
}

// --- Users ---

pub fn get_users(env: &Env) -> Vec<Address> {
    env.storage()
        .instance()
        .get(&USERS_KEY)
        .unwrap_or(Vec::new(env))
}

pub fn set_users(env: &Env, users: &Vec<Address>) {
    env.storage().instance().set(&USERS_KEY, users);
    env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND);
}

pub fn add_user_if_new(env: &Env, payer: &Address) -> bool {
    let mut users = get_users(env);
    // Check if user already exists
    let mut found = false;
    for i in 0..users.len() {
        if users.get(i).unwrap() == *payer {
            found = true;
            break;
        }
    }
    if !found {
        users.push_back(payer.clone());
        set_users(env, &users);
        return true;
    }
    false
}

// --- Payment Records ---

pub fn set_payment(env: &Env, nonce: u64, record: &PaymentRecord) {
    let key = StorageKey::Payment(nonce);
    env.storage().persistent().set(&key, record);
    env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
}

pub fn get_payment(env: &Env, nonce: u64) -> Option<PaymentRecord> {
    let key = StorageKey::Payment(nonce);
    env.storage().persistent().get(&key)
}

// --- Nonce Deduplication ---

pub fn mark_nonce_used(env: &Env, nonce: u64) {
    let key = StorageKey::NonceUsed(nonce);
    env.storage().temporary().set(&key, &true);
    env.storage().temporary().extend_ttl(&key, TEMP_TTL, TEMP_TTL);
}

pub fn is_nonce_used(env: &Env, nonce: u64) -> bool {
    let key = StorageKey::NonceUsed(nonce);
    env.storage().temporary().has(&key)
}

// --- Sessions ---

pub fn set_session(env: &Env, owner: &Address, session: &Session) {
    let key = StorageKey::Session(owner.clone());
    env.storage().persistent().set(&key, session);
    env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
}

pub fn get_session(env: &Env, owner: &Address) -> Option<Session> {
    let key = StorageKey::Session(owner.clone());
    env.storage().persistent().get(&key)
}

pub fn remove_session(env: &Env, owner: &Address) {
    let key = StorageKey::Session(owner.clone());
    if env.storage().persistent().has(&key) {
        env.storage().persistent().remove(&key);
    }
}
