export type MessageProps = {
  type: string
  payload: any
}

const CODE = 'sentre'

export class Messenger {
  private name: string
  private verbose: boolean
  private killers: Array<() => void>

  constructor({
    name = 'unknown',
    verbose = false,
  }: {
    name?: string
    verbose?: boolean
  }) {
    this.name = name
    this.verbose = verbose
    this.killers = []
  }

  emit = (win: Window, data: any) => {
    return win.postMessage({ type: CODE, payload: data }, '*')
  }

  listen = (callback: (data: any) => void): (() => void) => {
    const handler = ({ data: { type, payload }, origin }: MessageEvent) => {
      if (type === CODE) {
        if (this.verbose) console.log('Bridge:', this.name, origin, payload)
        return callback(payload)
      }
    }
    window.addEventListener('message', handler)
    const kill = () => window.removeEventListener('message', handler)
    this.killers.push(kill)
    return kill
  }

  killAll = () => {
    while (this.killers.length > 0) {
      const kill = this.killers.pop()
      if (kill) kill()
    }
  }
}
