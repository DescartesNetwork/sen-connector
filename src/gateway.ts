import { Transaction } from '@solana/web3.js'

import { Messenger } from './bridge'
import { EVENTS } from './constants'

export type Wallet = {
  getAddress: () => Promise<string>
  signTransaction: (tx: Transaction) => Promise<Transaction>
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>
}

export class Gateway {
  private iframeID: string
  private messenger: Messenger
  private wallet: Wallet

  constructor(iframeID: string, wallet: Wallet) {
    this.iframeID = iframeID
    this.messenger = new Messenger({ name: 'server' })
    this.wallet = wallet

    this.messenger.listen(async ({ event, data }) => {
      if (event === EVENTS.CONNECT) return this.onConnect()
      if (event === EVENTS.GET_ADDRESS) return this.onGetAddress()
      if (event === EVENTS.SIGN_TRANSACTION) return this.onSignTransaction(data)
      // if (event === EVENTS.SIGN_ALL_TRANSACTIONS)
      //   return this.onSignAllTransactions(data)
    })
  }

  emit = (data: any) => {
    const child = document.getElementById(this.iframeID)
    if (!child || child.tagName !== 'IFRAME')
      throw new Error(`Cannot find iframe with id ${this.iframeID}`)
    const wd = (child as HTMLIFrameElement)?.contentWindow
    if (!wd) throw new Error('Cannot access to iframe window')
    return this.messenger.emit(wd, data)
  }

  onConnect = () => {
    return this.emit({ event: EVENTS.CONNECT, data: true })
  }

  onGetAddress = async () => {
    const address = await this.wallet.getAddress()
    return this.emit({ event: EVENTS.GET_ADDRESS, data: address })
  }

  onSignTransaction = async (buf: Buffer) => {
    const tx = Transaction.from(buf)
    const signedTx = await this.wallet.signTransaction(tx)
    const serializedTx = signedTx.serialize()
    return this.emit({ event: EVENTS.SIGN_TRANSACTION, data: serializedTx })
  }

  // onSignAllTransactions = async (bufs: Buffer[]) => {
  //   const txs = bufs.map((buf) => Transaction.from(buf))
  //   const signedTxs = await this.wallet.signAllTransactions(txs)
  //   const serializedTxs = signedTxs.map((signedTx) => signedTx.serialize())
  //   return this.emit({
  //     event: EVENTS.SIGN_ALL_TRANSACTIONS,
  //     data: serializedTxs,
  //   })
  // }
}
