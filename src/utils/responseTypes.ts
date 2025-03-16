// utils/appError.ts
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Set to true to differentiate between operational and programming errors
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

export function formValidationError(errors: ValidationError[]): ApiResponse {
  return {
    success: false,
    message: "Validation error",
    errors,
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
