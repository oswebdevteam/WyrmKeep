import { createServerFn } from '@tanstack/react-start'
import * as crypto from 'node:crypto'

function generateAdminJwt(secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const payload = Buffer.from(
    JSON.stringify({
      sub: '00000000-0000-0000-0000-000000000000',
      role: 'admin',
      iat: now,
      exp: now + 5 * 60, // 5 minutes expiry
    })
  ).toString('base64url')

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url')

  return `${header}.${payload}.${signature}`
}

const provisionTenant = createServerFn({ method: 'POST' })
  .validator((data: { name: string; rawApiKey: string }) => data)
  .handler(async ({ data }) => {
    const jwtSecret = process.env.WYRMKEEP_JWT_SECRET
    if (!jwtSecret) {
      throw new Error(
        'Cannot auto-provision tenants.',
      )
    }

    const adminJwt = generateAdminJwt(jwtSecret)
    
    const baseUrl = (
      import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
    ).replace(/\/+$/, '')

    const res = await fetch(`${baseUrl}/v1/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminJwt}`,
      },
      body: JSON.stringify({
        name: data.name,
        raw_api_key: data.rawApiKey,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      let message = `Provisioning failed (${res.status})`
      try {
        const err = JSON.parse(text) as { message?: string }
        if (err.message) message = err.message
      } catch {
        // text wasn't JSON — use the status message
      }
      throw new Error(message)
    }

    const body = (await res.json()) as {
      data: { id: string; name: string }
      api_key: string
      session_token: string
    }

    return {
      tenantId: body.data.id,
      tenantName: body.data.name,
      apiKey: body.api_key,
      sessionToken: body.session_token,
    }
  })

export { provisionTenant }
