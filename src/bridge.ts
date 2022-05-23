export type MessageProps = {
  type: string
  payload: any
}

const CODE = 'sentre'

export class Messenger {
  private name?: string

  constructor(name = 'unknown') {
    this.name = name
  }

  emit = (win: Window, data: any) => {
    return win.postMessage({ type: CODE, payload: data }, '*')
  }

  listen = (callback: (data: any) => void) => {
    return window.addEventListener(
      'message',
      ({ data: { type, payload }, origin }) => {
        if (type === CODE) {
          console.log(this.name, origin, payload)
          return callback(payload)
        }
      },
    )
  }
}
