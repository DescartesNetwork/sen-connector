import { Transaction } from '@solana/web3.js'

import { Messenger } from './bridge'
import { EVENTS, ONE_SEC } from './constants'
import { SignedMessage } from './gateway'

export const UID = () => Math.round(Math.random() * 10 ** 9)

export class WalletConnector {
  private messenger: Messenger
  private id: string

  constructor(appId: string, verbose: boolean = false) {
    this.id = appId + '-iframe'
    this.messenger = new Messenger({ name: this.id, verbose })
  }

  private interact = async <T>({
    event,
    data = undefined,
    timeout = ONE_SEC * 3,
  }: {
    event: EVENTS
    data?: any
    timeout?: number
  }) => {
    return new Promise<T>((resolve, reject) => {
      try {
        if (!window.parent) throw new Error('Cannot access to parent window')
        const timeoutId = setTimeout(() => reject('Request timeout'), timeout)
        const id = this.id
        const uid = UID()
        const kill = this.messenger.listen(
          ({ event: catchedEvent, uid: catchedUID, data: catchedData }) => {
            if (event === catchedEvent && uid === catchedUID) {
              clearTimeout(timeoutId)
              kill()
              return resolve(catchedData)
            }
          },
        )
        return this.messenger.emit(window.parent, { event, id, uid, data })
      } catch (er: any) {
        return reject(er.message)
      }
    })
  }

  isConnected = async (): Promise<boolean> => {
    return await this.interact<boolean>({
      event: EVENTS.CONNECT,
      timeout: ONE_SEC * 3,
    })
  }

  getAddress = async (): Promise<string> => {
    return await this.interact<string>({
      event: EVENTS.GET_ADDRESS,
      timeout: ONE_SEC * 6,
    })
  }

  signTransaction = async (transaction: Transaction): Promise<Transaction> => {
    const serializedTx = await this.interact<Buffer>({
      event: EVENTS.SIGN_TRANSACTION,
      data: transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      }),
      timeout: ONE_SEC * 60,
    })
    const tx = Transaction.from(serializedTx)
    Object.assign(transaction, tx)
    return transaction
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
      timeout: ONE_SEC * 120,
    })
    const txs = serializedTxs.map((serializedTx) =>
      Transaction.from(serializedTx),
    )
    txs.forEach((tx, i) => {
      transactions[i] = Object.assign(transactions[i], tx)
    })
    return transactions
  }

  signMessage = async (message: string): Promise<SignedMessage> => {
    const signedMessage = await this.interact<SignedMessage>({
      event: EVENTS.SIGN_MESSAGE,
      data: message,
      timeout: ONE_SEC * 60,
    })
    return signedMessage
  }
}
