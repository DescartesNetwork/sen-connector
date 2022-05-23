import { Transaction } from '@solana/web3.js'

import { Messenger } from './bridge'
import { EVENTS, TIMEOUT } from './constants'

export class WalletConnector {
  private messenger: Messenger
  constructor() {
    this.messenger = new Messenger({ name: 'client' })
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
        if (!window.parent) throw new Error('Cannot access to parent window')
        const id = setTimeout(() => reject('Request timeout'), timeout)
        const kill = this.messenger.listen(({ event: catchedEvent, data }) => {
          if (event === catchedEvent) {
            clearTimeout(id)
            kill()
            return resolve(data)
          }
        })
        return this.messenger.emit(window.parent, { event, data })
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

  // signAllTransactions = async (
  //   transactions: Transaction[],
  // ): Promise<Transaction[]> => {
  //   const serializedTxs = await this.interact<Buffer[]>({
  //     event: EVENTS.SIGN_ALL_TRANSACTIONS,
  //     data: transactions.map((transaction) =>
  //       transaction.serialize({
  //         requireAllSignatures: false,
  //         verifySignatures: false,
  //       }),
  //     ),
  //     timeout: TIMEOUT * 20,
  //   })
  //   const txs = serializedTxs.map((serializedTx) =>
  //     Transaction.from(serializedTx),
  //   )
  //   return txs
  // }
}
