// JWT verification plugin. Attaches request.user from Authorization header.

import type { FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { verifyAccessToken, UnauthorizedError, type JwtClaims } from '@ak/shared'

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtClaims
  }
}

async function extractToken(request: FastifyRequest): Promise<string | null> {
  const auth = request.headers.authorization
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return null
}

export const requireAuth = async (request: FastifyRequest) => {
  const token = await extractToken(request)
  if (!token) throw new UnauthorizedError('Missing access token')
  try {
    request.user = verifyAccessToken(token)
  } catch (err) {
    throw new UnauthorizedError(err instanceof Error ? err.message : 'Invalid token')
  }
}

// requireRole removed in favor of @ak/shared's requirePermission(permCode)
// (RBAC Option B — role -> permission mapping is editable via /v1/rbac API)

export const requireInternalApiKey = async (request: FastifyRequest) => {
  const key = request.headers['x-internal-api-key']
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    throw new UnauthorizedError('Invalid internal API key')
  }
}

export const registerAuthPlugin = fp(async (app: import('fastify').FastifyInstance) => {
  app.decorateRequest('user', null)
})
