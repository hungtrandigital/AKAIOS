// @ak/shared main entry — re-exports public API

// Database
export { prisma, Prisma } from './db/client.js'

// Storage
export {
  getMinIOClient,
  ensureBuckets,
  uploadObject,
  deleteObject,
  getPresignedUrl,
  MINIO_BUCKET_NAMES,
} from './storage/minio.js'

// Health checks
export {
  checkDatabase,
  checkRedis,
  checkMinIO,
  runAllHealthChecks,
} from './health.js'
export type { HealthCheckResult, AggregateHealth } from './health.js'

// Auth
export { issueAccessToken, verifyAccessToken } from './auth/jwt.js'
export type { JwtClaims, IssueTokenInput } from './auth/jwt.js'
export { hashPassword, verifyPassword } from './auth/password.js'
export { generateOtp, isOtpValid, getSmsMode, generateRefreshToken, hashRefreshToken, getRefreshTokenTtlSeconds } from './auth/refresh-token.js'
export type { GeneratedOtp, RefreshTokenRecord } from './auth/refresh-token.js'
export {
  generateTotpSecret,
  encodeBase32,
  decodeBase32,
  loadTotpEncryptionKey,
  encryptTotpSecret,
  decryptTotpSecret,
  generateTotpCode,
  verifyTotpCode,
  buildTotpUri,
  createTotpChallenge,
  consumeTotpChallengeAttempt,
  deleteTotpChallenge,
  createEmployeeOtpChallenge,
  verifyEmployeeOtpChallenge,
  deleteEmployeeOtpChallenge,
  sendEmployeeOtpSms,
  closeAuthRedisClient,
} from './auth/otp.js'
export type { TotpSecretEnvelope } from './auth/otp.js'
export { requirePermission, loadUserPermissions, userHasPermission } from './auth/rbac.js'
export type { RequestLike } from './auth/rbac.js'

// Types
export * from './types/index.js'

// Re-exported Prisma enums (for convenience, avoids importing @prisma/client directly in services)
export {
  UserRole,
  UserStatus,
  SalaryType,
  ProjectStatus,
  ShiftAssignmentStatus,
  AttendanceStatus,
  PayrollPeriodStatus,
  AuditAction,
  ReportFormat,
} from '@prisma/client'
