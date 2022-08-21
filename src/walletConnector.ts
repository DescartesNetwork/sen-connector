import { Transaction } from '@solana/web3.js'

import { Messenger } from './bridge.js'
import { EVENTS, ONE_SEC } from './constants.js'
import { SignedMessage } from './gateway.js'

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
    data = {},
    timeout = ONE_SEC * 3,
  }: {
    event: EVENTS
    data?: any
    timeout?: number
  }) => {
    return new Promise((resolve, reject) => {
      try {
        if (!window.parent) throw new Error('Cannot access to parent window')
        const timeoutId = setTimeout(() => reject('Request timeout'), timeout)
        const id = this.id
        const uid = UID()
        const kill = this.messenger.listen(
          ({ event: catchedEvent, uid: catchedUID, data }) => {
            if (event === catchedEvent && uid === catchedUID) {
              clearTimeout(timeoutId)
              kill()
              return resolve(data)
            }
          },
        )
        return this.messenger.emit(window.parent, { event, id, uid, data })
      } catch (er: any) {
        return reject(er.message)
      }
    }) as Promise<T>
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
      timeout: ONE_SEC * 120,
    })
    const txs = serializedTxs.map((serializedTx) =>
      Transaction.from(serializedTx),
    )
    return txs
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
