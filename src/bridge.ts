export type MessageProps = {
  type: string
  payload: any
}

const CODE = 'sentre'

export class Messenger {
  private partnerWindow: Window
  private name?: string

  constructor(partnerWindow: Window, name = 'unknown') {
    this.partnerWindow = partnerWindow
    this.name = name
  }

  emit = (data: any) => {
    return this.partnerWindow.postMessage({ type: CODE, payload: data })
  }

  listen = (callback: (data: any) => void) => {
    return window.addEventListener(
      'message',
      ({ data: { type, payload }, origin }) => {
        if (type === CODE) {
          console.log(this.name, origin)
          return callback(payload)
        }
      },
    )
  }
}
