import { PublicKey } from '@solana/web3.js'
import { decode, encode } from 'bs58'
import { hash, sign } from 'tweetnacl'

const MONTH = 30 * 24 * 60 * 60

export type Signer = {
  getPublicKey: () => Promise<PublicKey>
  signMessage: (msg: Buffer) => Promise<Buffer>
}

export class JST {
  public id: string
  public issuer: string
  public createdDate: number
  public ttl: number

  /**
   * Json Solana Token
   * @param id Unique ID
   * @param issuer We recommend to use your domain .e.g, hub.sentre.io
   * @param createdDate JST created date (unix timestampt in seconds)
   * @param ttl Time to Live in seconds
   */
  constructor({
    id = JST.rand(),
    issuer,
    createdDate = JST.now(),
    ttl = MONTH,
  }: {
    id?: string
    issuer: string
    createdDate?: number
    ttl?: number
  }) {
    if (id.includes('/') || issuer.includes('/'))
      throw new Error(
        "The token's id and issuer cannot incluse backslash symbol.",
      )
    this.id = id
    this.issuer = issuer
    this.createdDate = createdDate
    this.ttl = ttl
  }

  /**
   * Generate a random unique id
   * @param len id length in bits
   * @returns Unique id
   */
  static rand = (len: number = 32) => {
    const buf = []
    while (buf.length < len) buf.push(Math.round(Math.random() * 256))
    return encode(buf)
  }

  /**
   * Get the current date
   * @returns Unix timestamp in seconds
   */
  static now = () => {
    return Math.floor(Date.now() / 1000)
  }

  /**
   * Validate JST expiration
   * @returns true/false
   */
  isExpired = () => {
    return JST.now() > this.createdDate + this.ttl
  }

  private concat = () => {
    return `${this.id}/${this.issuer}/${this.createdDate}/${this.ttl}`
  }

  toBuffer = () => {
    const str = this.concat()
    return Buffer.from(str, 'utf8')
  }

  static fromBuffer = (buf: Buffer) => {
    const str = buf.toString()
    const [id, issuer, createdDate, ttl] = str.split('/')
    return new JST({
      id,
      issuer,
      createdDate: Number(createdDate),
      ttl: Number(ttl),
    })
  }
}

export class OAuth {
  /**
   * Conveniently issue an "unsigned" JST
   * @param issuer Issuer name. We recommend to use your app domain
   * @param ttl Time to Live (in seconds)
   * @returns JST
   */
  issue = (issuer: string, ttl: number = MONTH) => {
    return new JST({ issuer, ttl })
  }

  /**
   * Sign the JST
   * @param jst
   * @param signer
   * @returns
   */
  sign = async (jst: JST, signer: Signer) => {
    const publicKey = await signer.getPublicKey()
    const address = publicKey.toBase58()
    const sig = await signer.signMessage(Buffer.from(hash(jst.toBuffer())))
    const encodedSig = encode(sig)
    const code = encode(jst.toBuffer())
    return `${address}/${encodedSig}/${code}`
  }

  verify = async (bearer: string) => {
    const [address, encodedSig, code] = bearer.split('/')
    const publicKey = new PublicKey(address)
    const sig = decode(encodedSig)
    const jst = JST.fromBuffer(Buffer.from(decode(code)))
    const buf = sign.open(Buffer.from(sig), publicKey.toBuffer())
    if (!buf) return false
    const msg = encode(Buffer.from(buf))
    const expectedMsg = encode(hash(jst.toBuffer()))
    return msg === expectedMsg
  }
}
