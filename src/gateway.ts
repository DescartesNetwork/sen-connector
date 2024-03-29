import { Transaction } from '@solana/web3.js'

import { Messenger } from './bridge'
import { EVENTS } from './constants'

export type SignedMessage = {
  address: string // base58
  signature: string // hex
  message: string // raw
}

export type Wallet = {
  getAddress: () => Promise<string>
  signTransaction: (tx: Transaction) => Promise<Transaction>
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>
  signMessage: (msg: string) => Promise<SignedMessage>
}

export class Gateway {
  private messenger: Messenger
  private wallet: Wallet

  constructor(wallet: Wallet, verbose: boolean = false) {
    this.messenger = new Messenger({ name: 'gateway', verbose })
    this.wallet = wallet

    this.messenger.listen(async ({ id, uid, event, data }) => {
      if (event === EVENTS.CONNECT) return this.onConnect(id, uid)
      if (event === EVENTS.GET_ADDRESS) return this.onGetAddress(id, uid)
      if (event === EVENTS.SIGN_TRANSACTION)
        return this.onSignTransaction(id, uid, data)
      if (event === EVENTS.SIGN_ALL_TRANSACTIONS)
        return this.onSignAllTransactions(id, uid, data)
      if (event === EVENTS.SIGN_MESSAGE)
        return this.onSignMessage(id, uid, data)
    })
  }

  terminate = () => this.messenger.killAll()

  emit = (id: string, data: any) => {
    const child = document.getElementById(id)
    if (!child || child.tagName !== 'IFRAME')
      throw new Error(`Cannot find iframe with id ${id}`)
    const wd = (child as HTMLIFrameElement)?.contentWindow
    if (!wd) throw new Error('Cannot access to iframe window')
    return this.messenger.emit(wd, data)
  }

  onConnect = (id: string, uid: number) => {
    return this.emit(id, { uid, event: EVENTS.CONNECT, data: true })
  }

  onGetAddress = async (id: string, uid: number) => {
    const address = await this.wallet.getAddress()
    return this.emit(id, { uid, event: EVENTS.GET_ADDRESS, data: address })
  }

  onSignTransaction = async (id: string, uid: number, buf: Buffer) => {
    const tx = Transaction.from(buf)
    const signedTx = await this.wallet.signTransaction(tx)
    const serializedTx = signedTx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })
    return this.emit(id, {
      uid,
      event: EVENTS.SIGN_TRANSACTION,
      data: serializedTx,
    })
  }

  onSignAllTransactions = async (id: string, uid: number, bufs: Buffer[]) => {
    const txs = bufs.map((buf) => Transaction.from(buf))
    const signedTxs = await this.wallet.signAllTransactions(txs)
    const serializedTxs = signedTxs.map((signedTx) =>
      signedTx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      }),
    )
    return this.emit(id, {
      uid,
      event: EVENTS.SIGN_ALL_TRANSACTIONS,
      data: serializedTxs,
    })
  }

  onSignMessage = async (id: string, uid: number, msg: string) => {
    const signedMsg = await this.wallet.signMessage(msg)
    return this.emit(id, {
      uid,
      event: EVENTS.SIGN_MESSAGE,
      data: signedMsg,
    })
  }
}
