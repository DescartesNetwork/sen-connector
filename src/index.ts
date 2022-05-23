import { Transaction } from '@solana/web3.js'
import { Messenger } from './bridge'

const TIMEOUT = 3000

export type Wallet = {
  getAddress: () => Promise<string>
  signTransaction: (tx: Transaction) => Promise<Transaction>
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>
}

export enum EVENTS {
  CONNECT,
  GET_ADDRESS,
  SIGN_TRANSACTION,
  SIGN_ALL_TRANSACTIONS,
}

export class WalletProvider {
  private iframeID: string
  private messenger: Messenger
  private wallet: Wallet

  constructor(iframeID: string, wallet: Wallet) {
    this.iframeID = iframeID
    this.messenger = new Messenger('server')
    this.wallet = wallet

    this.messenger.listen(async ({ event, data }) => {
      if (event === EVENTS.CONNECT) return this.onConnect()
      if (event === EVENTS.GET_ADDRESS) return this.onGetAddress()
      if (event === EVENTS.SIGN_TRANSACTION) return this.onSignTransaction(data)
      if (event === EVENTS.SIGN_ALL_TRANSACTIONS)
        return this.onSignAllTransactions(data)
    })
  }

  get win() {
    const child = document.getElementById(this.iframeID)
    if (!child || child.tagName !== 'IFRAME')
      throw new Error(`Cannot find iframe with id ${this.iframeID}`)
    const win = (child as HTMLIFrameElement)?.contentWindow
    if (!win) throw new Error('Cannot access to iframe window')
    return win
  }

  emit = (data: any) => {
    return this.messenger.emit(this.win, data)
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
    console.log('tx', tx)
    const signedTx = await this.wallet.signTransaction(tx)
    const serializedTx = signedTx.serialize()
    return this.emit({ event: EVENTS.SIGN_TRANSACTION, data: serializedTx })
  }

  onSignAllTransactions = async (bufs: Buffer[]) => {
    const txs = bufs.map((buf) => Transaction.from(buf))
    const signedTxs = await this.wallet.signAllTransactions(txs)
    const serializedTxs = signedTxs.map((signedTx) => signedTx.serialize())
    return this.emit({
      event: EVENTS.SIGN_ALL_TRANSACTIONS,
      data: serializedTxs,
    })
  }
}

export class WalletConnector {
  private messenger: Messenger
  constructor() {
    this.messenger = new Messenger('client')
  }

  get win() {
    if (!window.parent) throw new Error('Cannot access to parent window')
    return window.parent
  }

  private interact = async <T>({
    event,
    data = {},
    timeout = TIMEOUT,
  }: {
    event: EVENTS
    data?: any
    timeout?: number
  }) => {
    return new Promise((resolve, reject) => {
      try {
        const id = setTimeout(() => reject('Request timeout'), timeout)
        this.messenger.listen(({ event: catchedEvent, data }) => {
          if (event === catchedEvent) {
            clearTimeout(id)
            return resolve(data)
          }
        })
        return this.messenger.emit(this.win, { event, data })
      } catch (er: any) {
        return reject(er.message)
      }
    }) as Promise<T>
  }

  isConnected = async (): Promise<boolean> => {
    return await this.interact<boolean>({
      event: EVENTS.CONNECT,
      timeout: TIMEOUT,
    })
  }

  getAddress = async (): Promise<string> => {
    return await this.interact<string>({
      event: EVENTS.GET_ADDRESS,
      timeout: TIMEOUT * 2,
    })
  }

  signTransaction = async (transaction: Transaction): Promise<Transaction> => {
    const serializedTx = await this.interact<Buffer>({
      event: EVENTS.SIGN_TRANSACTION,
      data: transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      }),
      timeout: TIMEOUT * 20,
    })
    const tx = Transaction.from(serializedTx)
    return tx
  }

  signAllTransactions = async (
    transactions: Transaction[],
  ): Promise<Transaction[]> => {
    const serializedTxs = await this.interact<Buffer[]>({
      event: EVENTS.SIGN_ALL_TRANSACTIONS,
      data: transactions.map((transaction) =>
        transaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        }),
      ),
      timeout: TIMEOUT * 20,
    })
    const txs = serializedTxs.map((serializedTx) =>
      Transaction.from(serializedTx),
    )
    return txs
  }
}
