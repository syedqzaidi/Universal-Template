import { createHmac, timingSafeEqual } from 'crypto'

export function verifyResendSignature(
  payload: string,
  headers: {
    'svix-id': string
    'svix-timestamp': string
    'svix-signature': string
  },
  secret: string,
): boolean {
  const msgId = headers['svix-id']
  const timestamp = headers['svix-timestamp']
  const signatures = headers['svix-signature']

  // Check timestamp is not too old (5 minutes tolerance)
  const timestampSeconds = parseInt(timestamp, 10)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestampSeconds) > 300) return false

  // Construct message to sign
  const toSign = `${msgId}.${timestamp}.${payload}`

  // Secret has "whsec_" prefix and is base64 encoded
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')

  const expectedSig = createHmac('sha256', secretBytes)
    .update(toSign)
    .digest('base64')

  // Svix sends multiple signatures separated by spaces, each prefixed with version
  const expectedWithVersion = `v1,${expectedSig}`
  const signatureList = signatures.split(' ')

  return signatureList.some((sig) => {
    if (sig.length !== expectedWithVersion.length) return false
    return timingSafeEqual(
      Buffer.from(sig),
      Buffer.from(expectedWithVersion),
    )
  })
}
