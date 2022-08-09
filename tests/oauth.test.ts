import { Keypair } from '@solana/web3.js'
import { sign } from 'tweetnacl'
import { expect } from 'chai'

import { OAuth, Signer } from '../src'

describe('OAuth', () => {
  const keyPair = new Keypair()
  const signer: Signer = {
    getPublicKey: async () => keyPair.publicKey,
    signMessage: async (msg: Buffer) =>
      Buffer.from(sign.detached(msg, keyPair.secretKey)),
  }

  it('sign/verify', async () => {
    const jst = OAuth.issue('hub.sentre.io')
    const bearer = await OAuth.sign(jst, signer)
    const ok = OAuth.verify(bearer)
    expect(ok).true
  })
})
