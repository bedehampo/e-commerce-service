export class GenericError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ServiceError extends GenericError {
  constructor(message: string) {
    super(message);
  }
} 

export class NotFoundError extends GenericError {
  constructor(message: string) {
    super(message);
  }
}
export class ConflictError extends GenericError {
  constructor(message: string) {
    super(message);
  }
}

export class ValidationError extends GenericError {
  // constructor(errors: any = [], message: string = "") {
  //   message = `${errors[0].message}`;
  //   super(message);
  //   // @ts-ignore
  //   this.errors = errors;
  // }
  constructor(message: string) {
    super(message);
  }
}

export class AuthenticationError extends GenericError {
  constructor(message: string) {
    super(message);
  }
}

export class AuthorizationError extends GenericError {
  constructor(message = "you are not authorized to perform this action") {
    super(message);
  }
}
