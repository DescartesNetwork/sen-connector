import { Messenger } from './bridge'

const TIMEOUT = 1500

export enum EVENTS {
  CONNECT,
}

export class WalletProvider {
  private iframeID: string
  private messenger: Messenger

  constructor(iframeID: string) {
    this.iframeID = iframeID
    this.messenger = new Messenger('server')

    this.messenger.listen(({ event }) => {
      if (event === EVENTS.CONNECT)
        return this.emit({ event: EVENTS.CONNECT, data: true })
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

  isConnected = async () => {
    return new Promise((resolve, reject) => {
      try {
        const id = setTimeout(() => resolve(false), TIMEOUT)
        this.messenger.listen(({ event, data }) => {
          if (event === EVENTS.CONNECT) {
            clearTimeout(id)
            return resolve(data)
          }
        })
        this.messenger.emit(this.win, { event: EVENTS.CONNECT })
      } catch (er: any) {
        return reject(er.message)
      }
    })
  }
}
