import { PublicKey } from '@solana/web3.js'
import { decode, encode } from 'bs58'
import { hash, sign } from 'tweetnacl'
import { v4 as uuid } from 'uuid'

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
   * @param opts
   * @param opts.id Unique ID
   * @param opts.issuer We recommend to use your domain .e.g, hub.sentre.io
   * @param opts.createdDate JST created date (unix timestampt in seconds)
   * @param opts.ttl Time to Live in seconds
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

  private concat = () => {
    return `${this.id}/${this.issuer}/${this.createdDate}/${this.ttl}`
  }

  /**
   * Generate a random universal unique id (uuid v4)
   * @returns uuid
   */
  static rand = uuid

  /**
   * Get the current date
   * @returns Unix timestamp in seconds
   */
  static now = () => {
    return Math.floor(Date.now() / 1000)
  }

  /**
   * Validate JST expiration
   * @returns `true` or `false`
   */
  isExpired = () => {
    return JST.now() > this.createdDate + this.ttl
  }

  /**
   * Convert JST to buffer
   * @returns Buffer
   */
  toBuffer = () => {
    const str = this.concat()
    return Buffer.from(str, 'utf8')
  }

  /**
   * Infer JST from buffer
   * @param buf JST buffer
   * @returns JST
   */
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
  static seed = (jst: JST) => {
    const hex = Buffer.from(hash(jst.toBuffer())).toString('hex')
    const content = `Issuing JSON Solana Token to ${jst.issuer}: ${hex}`
    return Buffer.from(new TextEncoder().encode(content))
  }

  /**
   * Conveniently issue an "unsigned" JST
   * @param issuer Issuer name. We recommend to use your app domain
   * @param ttl Time to Live (in seconds)
   * @returns A Json Solana Token
   */
  static issue = (issuer: string, ttl: number = MONTH) => {
    return new JST({ issuer, ttl })
  }

  /**
   * Verify the bearer, which is returned by `sign`
   * @param bearer The bearer. To use, add to request header `Authorization: Bearer bearer`
   * @returns A object of { publicKey, signature, jst }
   */
  static parse = (bearer: string) => {
    const [address, encodedSig, code] = bearer.split('/')
    const publicKey = new PublicKey(address)
    const signature = decode(encodedSig)
    const jst = JST.fromBuffer(Buffer.from(decode(code)))
    return { publicKey, signature, jst }
  }

  /**
   * Sign the JST
   * @param jst JST instance
   * @param signer The signer
   * @returns Bearer
   */
  static sign = async (jst: JST, signer: Signer) => {
    const publicKey = await signer.getPublicKey()
    const address = publicKey.toBase58()
    const sig = await signer.signMessage(OAuth.seed(jst))
    const encodedSig = encode(sig)
    const code = encode(jst.toBuffer())
    return `${address}/${encodedSig}/${code}`
  }

  /**
   * Verify the bearer, which is returned by `sign`
   * @param bearer The bearer. To use, add to request header `Authorization: Bearer bearer`
   * @param strict If true, the validator will throw exception instead of boolean. Default: false
   * @returns `true` or `false`
   */
  static verify = (bearer: string, strict: boolean = false) => {
    try {
      const { publicKey, signature, jst } = OAuth.parse(bearer)
      if (!publicKey) throw new Error('Broken public key')
      const buf = sign.open(Buffer.from(signature), publicKey.toBuffer())
      if (!buf) throw new Error('Broken signature')
      const signedMsg = encode(Buffer.from(buf))
      const expectedMsg = encode(OAuth.seed(jst))
      if (jst.isExpired()) throw new Error('Expired token')
      if (signedMsg !== expectedMsg) throw new Error('Invalid signature')
      return true
    } catch (er: any) {
      if (!strict) return false
      else throw new Error(er.message)
    }
  }
}
