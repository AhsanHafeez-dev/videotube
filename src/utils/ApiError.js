export class ApiError extends Error {
  constructor(
    statusCode,
    message = "something happends",
    errors = [],
    statckTrace = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.data = null;
    this.success = false;

    if (statckTrace) {
      this.stack = statckTrace;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
