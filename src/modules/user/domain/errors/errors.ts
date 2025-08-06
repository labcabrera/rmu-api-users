export class DomainError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string = 'DOMAIN_ERROR',
  ) {
    super(message);
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with ${id} not found`, 'NOT_FOUND');
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class UserNotFoundError extends DomainError {
  constructor(message: string) {
    super(message, 'USER_NOT_FOUND');
  }
}
