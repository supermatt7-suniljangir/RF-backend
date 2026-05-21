// utils/appError.ts
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function success<T>({
  data,
  message,
  success,
  ...rest
}: ApiResponse<T>): ApiResponse<T> {
  return {
    success: success ?? true,
    data,
    message,
    ...rest,
  };
}

export function formValidationError(errors: ValidationError[]): ApiResponse<null> {
  return {
    success: false,
    message: "Validation error",
    errors,
    data: null,
  };
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}
