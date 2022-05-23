# Senhub Connector

## Installation

```bash
npm i @sentre/connector
```

## To use

```ts
import { WalletConnector } from '@sentre/connector'

const wallet = new WalletConnector()
if (wallet.isConnected()) {
  const address = await wallet.getAddress()
  const signedTransaction = await wallet.signTransaction(transaction)
}
```
