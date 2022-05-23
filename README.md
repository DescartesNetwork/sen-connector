# Senhub Connector

## Installation

```bash
npm i @sentre/connector
```

## To use

```ts
import { WalletConnector } from '@sentre/connector'

const wallet = new WalletConnector('my-app-id')
const isConnected = await wallet.isConnected()
if (isConnected) {
  const address = await wallet.getAddress()
  const signedTransaction = await wallet.signTransaction(transaction)
}
```
