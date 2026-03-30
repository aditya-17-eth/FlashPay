import {
  SorobanRpc,
  TransactionBuilder,
  Networks,
  Asset,
  Operation,
  Horizon,
} from "@stellar/stellar-sdk";

const HORIZON_URL = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL!;
const NETWORK_PASSPHRASE = Networks.TESTNET;
const USDC_ASSET = new Asset(
  "USDC",
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
);

void SorobanRpc;

function getHorizonServer() {
  return new Horizon.Server(HORIZON_URL);
}

function isUsdcBalanceLine(
  balance: unknown,
): balance is { balance?: string; asset_code?: string; asset_issuer?: string } {
  return typeof balance === "object" && balance !== null && "asset_code" in balance;
}

function hasUsdcTrustline(balances: unknown[]) {
  return balances.some(
    (balance) =>
      isUsdcBalanceLine(balance) &&
      balance.asset_code === USDC_ASSET.getCode() &&
      balance.asset_issuer === USDC_ASSET.getIssuer(),
  );
}

export async function getTestnetUSDC(userPublicKey: string): Promise<string> {
  const server = getHorizonServer();
  const account = await server.loadAccount(userPublicKey);

  const operations = [];
  if (!hasUsdcTrustline(account.balances)) {
    operations.push(
      Operation.changeTrust({
        asset: USDC_ASSET,
        limit: "1000",
      }),
    );
  }

  operations.push(
    Operation.pathPaymentStrictReceive({
      sendAsset: Asset.native(),
      sendMax: "10",
      destination: userPublicKey,
      destAsset: USDC_ASSET,
      destAmount: "1",
      path: [],
    }),
  );

  const transactionBuilder = new TransactionBuilder(account, {
    fee: "200",
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  for (const operation of operations) {
    transactionBuilder.addOperation(operation);
  }

  const transaction = transactionBuilder.setTimeout(30).build();
  return transaction.toXDR();
}

export async function getUSDCBalance(userPublicKey: string): Promise<string> {
  try {
    const server = getHorizonServer();
    const account = await server.loadAccount(userPublicKey);
    const usdcBalance = account.balances.find(
      (balance) =>
        isUsdcBalanceLine(balance) &&
        balance.asset_code === USDC_ASSET.getCode() &&
        balance.asset_issuer === USDC_ASSET.getIssuer(),
    );

    return usdcBalance?.balance ?? "0";
  } catch {
    return "0";
  }
}
