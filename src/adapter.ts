import {
  BaseMessageSignerWalletAdapter,
  scopePollingDetectionStrategy,
  WalletName,
  WalletAccountError,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletPublicKeyError,
  WalletReadyState,
  WalletSignMessageError,
  WalletSignTransactionError,
} from '@solana/wallet-adapter-base'
import { PublicKey, Transaction } from '@solana/web3.js'
import { WalletConnector } from './walletConnector'

const MOTHER_PLATFORM = 'https://hub.sentre.io'

export interface SentreWalletAdapterConfig {
  appId: string
}

export const SentreWalletName = 'Sentre' as WalletName<'Sentre'>

export class SentreWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = SentreWalletName
  url = MOTHER_PLATFORM
  icon =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzQiIGhlaWdodD0iNzQiIHZpZXdCb3g9IjAgMCA3NCA3NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTczLjg5NDcgMTguNTc4OEM3My44OTQ3IDI4Ljc4MTUgNjUuNjIzOCAzNy4wNTI1IDU1LjQyMTEgMzcuMDUyNUM0NS4yNTczIDM3LjA1MjUgMzcuMDEwNiAyOC44NDQ2IDM2Ljk0NzcgMTguNjk1NkMzNi44ODUzIDI4LjgxMyAyOC42ODk5IDM3LjAwMTUgMTguNTY5OSAzNy4wNTI3QzI4LjcyODQgMzcuMTA0NSAzNi45NDc0IDQ1LjM1NTUgMzYuOTQ3NCA1NS41MjYyQzM2Ljk0NzQgNjUuNzI4OSAyOC42NzY0IDczLjk5OTggMTguNDczNyA3My45OTk4QzguMjcwOTUgNzMuOTk5OCAwIDY1LjcyODkgMCA1NS41MjYyQzAgNDUuMzU1MyA4LjIxOTM5IDM3LjEwNDEgMTguMzc4MiAzNy4wNTI3QzguMjE5NzIgMzcuMDAwOSAwLjAwMDcxOTU3MiAyOC43NDk5IDAuMDAwNzE5NTcyIDE4LjU3OTNDMC4wMDA3MTk1NzIgOC4zNzY1NCA4LjI3MTY3IDAuMTA1NTkxIDE4LjQ3NDQgMC4xMDU1OTFDMjguNjM4MiAwLjEwNTU5MSAzNi44ODQ5IDguMzEzNDggMzYuOTQ3NyAxOC40NjI1QzM3LjAxMDMgOC4zMTMyNiA0NS4yNTcxIDAuMTA1MTAzIDU1LjQyMTEgMC4xMDUxMDNDNjUuNjIzOCAwLjEwNTEwMyA3My44OTQ3IDguMzc2MDUgNzMuODk0NyAxOC41Nzg4Wk01NS40MjExIDM3LjA1MjVDNDUuMjE4MyAzNy4wNTI1IDM2Ljk0NzQgNDUuMzIzNCAzNi45NDc0IDU1LjUyNjJDMzYuOTQ3NCA2NS43Mjg5IDQ1LjIxODMgNzMuOTk5OCA1NS40MjExIDczLjk5OThDNjUuNjIzOCA3My45OTk4IDczLjg5NDcgNjUuNzI4OSA3My44OTQ3IDU1LjUyNjJDNzMuODk0NyA0NS4zMjM0IDY1LjYyMzggMzcuMDUyNSA1NS40MjExIDM3LjA1MjVaIiBmaWxsPSIjMjdBNTc3Ii8+PC9zdmc+Cg=='

  private _connecting: boolean
  private _wallet: WalletConnector | null
  private _publicKey: PublicKey | null
  private _readyState: WalletReadyState =
    typeof window === 'undefined' || typeof document === 'undefined'
      ? WalletReadyState.Unsupported
      : WalletReadyState.NotDetected
  private _appId: string

  constructor(config: SentreWalletAdapterConfig = { appId: '' }) {
    super()
    this._connecting = false
    this._wallet = null
    this._publicKey = null
    this._appId = config.appId

    if (this._readyState !== WalletReadyState.Unsupported) {
      scopePollingDetectionStrategy(() => {
        if (window.parent.location.origin.includes(MOTHER_PLATFORM)) {
          this._readyState = WalletReadyState.Installed
          this.emit('readyStateChange', this._readyState)
          return true
        }
        return false
      })
    }
  }

  get publicKey(): PublicKey | null {
    return this._publicKey
  }

  get connecting(): boolean {
    return this._connecting
  }

  get readyState(): WalletReadyState {
    return this._readyState
  }

  async connect(): Promise<void> {
    try {
      if (this.connected || this.connecting) return
      if (this._readyState !== WalletReadyState.Installed)
        throw new WalletNotReadyError()

      this._connecting = true
      const wallet = new WalletConnector(this._appId)

      let address: string
      try {
        address = await wallet.getAddress()
      } catch (error: any) {
        throw new WalletAccountError(error?.message, error)
      }

      let publicKey: PublicKey
      try {
        publicKey = new PublicKey(address)
      } catch (error: any) {
        throw new WalletPublicKeyError(error?.message, error)
      }

      this._publicKey = publicKey
      this._wallet = wallet

      this.emit('connect', publicKey)
    } catch (error: any) {
      this.emit('error', error)
      throw error
    } finally {
      this._connecting = false
    }
  }

  async disconnect(): Promise<void> {
    if (this._wallet) {
      this._wallet = null
      this._publicKey = null
    }

    this.emit('disconnect')
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const wallet = this._wallet
      if (!wallet) throw new WalletNotConnectedError()

      try {
        return (await wallet.signTransaction(transaction)) || transaction
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error)
      }
    } catch (error: any) {
      this.emit('error', error)
      throw error
    }
  }

  async signAllTransactions(
    transactions: Transaction[],
  ): Promise<Transaction[]> {
    try {
      const wallet = this._wallet
      if (!wallet) throw new WalletNotConnectedError()

      try {
        return (await wallet.signAllTransactions(transactions)) || transactions
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error)
      }
    } catch (error: any) {
      this.emit('error', error)
      throw error
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    try {
      const wallet = this._wallet
      if (!wallet) throw new WalletNotConnectedError()

      try {
        const msg = new TextDecoder().decode(message)
        const { signature } = await wallet.signMessage(msg)
        const bufSig = Buffer.from(signature, 'hex')
        return Uint8Array.from(bufSig)
      } catch (error: any) {
        throw new WalletSignMessageError(error?.message, error)
      }
    } catch (error: any) {
      this.emit('error', error)
      throw error
    }
  }
}
