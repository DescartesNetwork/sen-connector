import { Transaction } from '@solana/web3.js'
import { Messenger } from './bridge'

const TIMEOUT = 3000

export type Wallet = {
  getAddress: () => Promise<string>
  signTransaction: (tx: Transaction) => Promise<Transaction>
  signAllTransaction?: (txs: Transaction[]) => Promise<Transaction[]>
}

export enum EVENTS {
  CONNECT,
  GET_ADDRESS,
  SIGN_TRANSACTION,
}

export class WalletProvider {
  private iframeID: string
  private messenger: Messenger
  private wallet: any

  constructor(iframeID: string, wallet: Wallet) {
    this.iframeID = iframeID
    this.messenger = new Messenger('server')
    this.wallet = wallet

    this.messenger.listen(async ({ event }) => {
      if (event === EVENTS.CONNECT) return this.onConnect()
      if (event === EVENTS.GET_ADDRESS) return this.wallet.onGetAddress()
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
    console.log(address)
    return this.emit({ event: EVENTS.GET_ADDRESS, data: address })
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
    const { signature, publicKey } = await this.interact({
      event: EVENTS.SIGN_TRANSACTION,
      data: transaction,
      timeout: TIMEOUT * 20,
    })
    transaction.addSignature(publicKey, signature)
    return transaction
  }
}
