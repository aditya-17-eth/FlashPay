use soroban_sdk::{contracterror};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NonceAlreadyUsed = 3,
    PaymentNotFound = 4,
    Unauthorized = 5,
    InvalidAmount = 6,
    AlreadyReleased = 7,
    AlreadyRefunded = 8,
    InvalidTool = 9,
    SessionNotFound = 10,
    SessionExpired = 11,
    SessionBudgetExceeded = 12,
    SessionInactive = 13,
}
