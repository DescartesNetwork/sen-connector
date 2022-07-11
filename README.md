# 🤝 Senhub Connector

## Installation

```bash
npm i @sentre/connector
```

## To use

### With [@solana/wallet-adapter](https://solana-labs.github.io/wallet-adapter/)

```ts
import { SentreWalletAdapter } from '@sentre/connector'

// Add SentreWalletAdapter with your provided app id to @solana/wallet-adapter
// https://solana-labs.github.io/wallet-adapter/

const network = WalletAdapterNetwork.Devnet
const appId = 'my-app-id'

const wallets = useMemo(() => [new SentreWalletAdapter({ appId })], [network])
```

### Manual integration

```ts
import { WalletConnector } from '@sentre/connector'

const wallet = new WalletConnector('my-app-id')
const isConnected = await wallet.isConnected()
if (isConnected) {
  // Get the address
  const address = await wallet.getAddress()
  // Sign a transaction
  const signedTransaction = await wallet.signTransaction(transaction)
  // Sign multiple transactions
  const signedTransactions = await wallet.signAllTransactions(transactions)
  // Sign a message
  const { signature, address, message } = await wallet.signMessage(
    'the message needs to be signed',
  )
}
```
