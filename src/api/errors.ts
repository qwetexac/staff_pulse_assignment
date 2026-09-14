export class ApiValidationError extends Error {
  readonly issues: unknown

  constructor(message: string, issues: unknown) {
    super(message)
    this.name = 'ApiValidationError'
    this.issues = issues
  }
}

export class ApiHttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiHttpError'
    this.status = status
  }
}
