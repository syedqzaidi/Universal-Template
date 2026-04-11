import { createHmac, timingSafeEqual } from 'crypto'

export function verifyTwentySignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  if (signature.length !== expected.length) return false

  const sigBuffer = Buffer.from(signature)
  const expBuffer = Buffer.from(expected)

  return timingSafeEqual(sigBuffer, expBuffer)
}
