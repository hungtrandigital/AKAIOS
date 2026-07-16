// Argon2id password hashing. Memory=64MB, iterations=3, parallelism=4 (OWASP 2024 baseline).

import argon2 from 'argon2'

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
}

export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }
  return argon2.hash(plain, ARGON2_OPTIONS)
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain)
  } catch {
    return false
  }
}
