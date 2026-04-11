import { createHmac, timingSafeEqual } from 'crypto'

export function verifyTwentySignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  const sigBuffer = Buffer.from(signature)
  const expBuffer = Buffer.from(expected)

  if (sigBuffer.length !== expBuffer.length) return false

  return timingSafeEqual(sigBuffer, expBuffer)
}
