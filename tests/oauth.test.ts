import { Keypair } from '@solana/web3.js'
import { sign } from 'tweetnacl'
import { expect } from 'chai'

import { OAuth, Signer } from '../src'

describe('OAuth', () => {
  const keyPair = new Keypair()
  const signer: Signer = {
    getPublicKey: async () => keyPair.publicKey,
    signMessage: async (msg: Buffer) =>
      Buffer.from(sign(msg, keyPair.secretKey)),
  }
  const oauth = new OAuth()

  it('sign/verify', async () => {
    const jst = oauth.issue('hub.sentre.io')
    const bearer = await oauth.sign(jst, signer)
    console.log(bearer)
    const ok = oauth.verify(bearer)
    expect(ok).true
  })
})
