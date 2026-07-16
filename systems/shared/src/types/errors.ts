// Domain error classes.
// Routes catch these and map to appropriate HTTP status codes.

export class DomainError extends Error {
  readonly code: string
  readonly statusCode: number
  readonly details?: Record<string, unknown>

  constructor(
    code: string,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'DomainError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, 403)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id?: string) {
    super('NOT_FOUND', `${entity}${id ? ` (${id})` : ''} not found`, 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CONFLICT', message, 409, details)
    this.name = 'ConflictError'
  }
}

export class BusinessRuleViolationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('BUSINESS_RULE_VIOLATION', message, 422, details)
    this.name = 'BusinessRuleViolationError'
  }
}
