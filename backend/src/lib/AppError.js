export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Default export alias — supports legacy default-import call sites
// (e.g. callController.js, call.service.js) without touching the
// 14 other files that use the named import.
export default AppError;
