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

export interface SentreWalletAdapterConfig {
  appId: string
}

export const SentreWalletName = 'Sentre' as WalletName<'Sentre'>

export class SentreWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = SentreWalletName
  url = 'https://hub.sentre.io'
  icon =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTg2IiBoZWlnaHQ9IjIyOCIgdmlld0JveD0iMCAwIDE4NiAyMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik05Mi42ODA5IDIyNy44ODJMMzAuODY2NyAxNjUuOTYzQzExLjEwMzEgMTQ2LjE2NSAwIDExOS4zMTUgMCA5MS4zMTY3QzAgNjMuMzE5NSAxMS4xMDMxIDM2LjQ2ODggMzAuODY2NyAxNi42NzE1TDQ3LjQ4MDkgMC4wMjkyMzU4TDEwOS4zMyA2MS45ODMzQzEyOS4wNzggODEuNzgzOCAxNDAuMTY4IDEwOC42MjkgMTQwLjE2MiAxMzYuNjE5QzE0MC4xNTUgMTY0LjYwOCAxMjkuMDUyIDE5MS40NDggMTA5LjI5NSAyMTEuMjM5TDkyLjY4MDkgMjI3Ljg4MloiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcl8zMTdfNCkiLz4KPHBhdGggZD0iTTc2LjA3MzkgNjEuOTg4OUwxMzcuOTU4IDBMMTU0LjU3MiAxNi42NDIzQzE2NC4zNjggMjYuNDQ2MSAxNzIuMTM5IDM4LjA4NzggMTc3LjQ0MiA1MC45MDJDMTgyLjc0NCA2My43MTYyIDE4NS40NzQgNzcuNDUxMyAxODUuNDc0IDkxLjMyMjdDMTg1LjQ3NCAxMDUuMTk0IDE4Mi43NDQgMTE4LjkyOSAxNzcuNDQyIDEzMS43NDNDMTcyLjEzOSAxNDQuNTU3IDE2NC4zNjggMTU2LjE5OSAxNTQuNTcyIDE2Ni4wMDNMOTIuNzIyNSAyMjcuOTU3TDc2LjA3MzkgMjExLjI4QzU2LjMxMDIgMTkxLjQ4MyA0NS4yMDcgMTY0LjYzMiA0NS4yMDcgMTM2LjYzNUM0NS4yMDcgMTA4LjYzNyA1Ni4zMTAyIDgxLjc4NjEgNzYuMDczOSA2MS45ODg5WiIgZmlsbD0idXJsKCNwYWludDFfbGluZWFyXzMxN180KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzMxN180IiB4MT0iMTQwLjIyIiB5MT0iMTEzLjk3MyIgeDI9Ii0wLjAyMjgyMDMiIHkyPSIxMTMuOTczIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiNGOTU3NUUiLz4KPHN0b3Agb2Zmc2V0PSIwLjI3IiBzdG9wLWNvbG9yPSIjRjg1NTVCIi8+CjxzdG9wIG9mZnNldD0iMC40OSIgc3RvcC1jb2xvcj0iI0Y0NEY1MSIvPgo8c3RvcCBvZmZzZXQ9IjAuNjgiIHN0b3AtY29sb3I9IiNFRTQ1NDAiLz4KPHN0b3Agb2Zmc2V0PSIwLjg3IiBzdG9wLWNvbG9yPSIjRTYzNzI4Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0RFMkExMyIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfMzE3XzQiIHgxPSItNDIwNjA4IiB5MT0iMzUyNjM0IiB4Mj0iLTQyNDM3MSIgeTI9IjM1MTcxMiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjRjk1NzVFIi8+CjxzdG9wIG9mZnNldD0iMC4yNyIgc3RvcC1jb2xvcj0iI0Y4NTU1QiIvPgo8c3RvcCBvZmZzZXQ9IjAuNDkiIHN0b3AtY29sb3I9IiNGNDRGNTEiLz4KPHN0b3Agb2Zmc2V0PSIwLjY4IiBzdG9wLWNvbG9yPSIjRUU0NTQwIi8+CjxzdG9wIG9mZnNldD0iMC44NyIgc3RvcC1jb2xvcj0iI0U2MzcyOCIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNERTJBMTMiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K'

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
      const isIframe = window !== window.top
      const key = 'walletName'
      const mem = localStorage.getItem(key) || ''
      if (isIframe && JSON.parse(mem) !== SentreWalletName)
        localStorage.removeItem(key)
      scopePollingDetectionStrategy(() => {
        if (isIframe) {
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
