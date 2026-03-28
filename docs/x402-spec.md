# x402 Protocol for FlashPay

FlashPay is fully built leveraging the open standard HTTP 402 "Payment Required" concepts adapted for standard programmatic workflows on top of Stellar Soroban (collectively referred to as x402 on this dApp).

### Headers Used

**Client Requests**:
* `x-payment-nonce` Request identifier that corresponds strictly to an active `StorageKey::Payment(nonce)` object. 
* `x-payer-address` Corresponding G-formatted Freighter address. Must match on-chain record.

**402 Responses**:
A JSON object is returned mimicking:
```json
{
  "paymentAddress": "G...",
  "amount": "0.005",
  "currency": "USDC",
  "nonce": 1743099847,
  "network": "testnet",
  "contractId": "C...",
  "expiresAt": 1743099907
}
```
Client uses these identifiers natively to process the cross-chain execution payload locally before retrying.
