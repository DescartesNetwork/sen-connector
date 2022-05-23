import { Messenger } from './bridge'

export enum EVENTS {
  CONNECT,
}

export class WalletProvider {
  private messenger: Messenger

  constructor(iframeID: string) {
    const child = document.getElementById(iframeID)
    if (!child || child.tagName !== 'IFRAME')
      throw new Error(`Cannot find iframe with id ${iframeID}`)
    const win = (child as HTMLIFrameElement)?.contentWindow
    if (!win) throw new Error('Cannot access to iframe window')
    this.messenger = new Messenger(win, 'server')

    this.messenger.listen(({ event }) => {
      if (event === EVENTS.CONNECT)
        return this.messenger.emit({ event: EVENTS.CONNECT, data: true })
    })
  }
}

export class WalletConnector {
  private messenger: Messenger
  constructor() {
    this.messenger = new Messenger(window.parent, 'client')
  }

  isConnected = async () => {
    return new Promise((resolve, reject) => {
      try {
        const id = setTimeout(() => resolve(false), 3000)
        this.messenger.listen(({ events, data }) => {
          if (events === EVENTS.CONNECT) {
            clearTimeout(id)
            return resolve(data)
          }
        })
      } catch (er: any) {
        return reject(er.message)
      }
    })
  }
}
