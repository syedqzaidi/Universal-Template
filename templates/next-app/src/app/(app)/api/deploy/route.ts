import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST() {
  try {
    const payload = await getPayload({ config })

    // Verify the request is from an authenticated admin/editor
    // Note: In production, add proper auth middleware here

    const siteSettings = await payload.findGlobal({ slug: 'site-settings' })
    const webhookUrl = (siteSettings as any)?.webhookUrl

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'No webhook URL configured in Site Settings' },
        { status: 400 },
      )
    }

    const response = await fetch(webhookUrl, { method: 'POST' })

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Deploy triggered' })
    } else {
      return NextResponse.json(
        { error: `Webhook returned ${response.status} ${response.statusText}` },
        { status: 502 },
      )
    }
  } catch (error) {
    console.error('[Deploy API] Failed:', error)
    return NextResponse.json(
      { error: 'Deploy request failed' },
      { status: 500 },
    )
  }
}
