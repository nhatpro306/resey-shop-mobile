// Typed application errors. Services throw these; UI maps code -> toast + recovery.
export type AppErrorCode =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "OUT_OF_STOCK"
  | "NOT_FOUND"
  | "VALIDATION"
  | "NETWORK"
  | "RATE_LIMITED"
  | "UNKNOWN";

export class AppError extends Error {
  code: AppErrorCode;
  cause?: unknown;
  constructor(code: AppErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.cause = cause;
  }
}

type SupabaseLikeError = { code?: string; message?: string; status?: number } | null;

// Normalize PostgREST / Auth / Storage errors into an AppError.
export function mapSupabaseError(error: SupabaseLikeError): AppError {
  if (!error) return new AppError("UNKNOWN", "Unknown error");
  const code = error.code ?? "";
  const status = error.status ?? 0;

  if (status === 401 || code === "PGRST301") return new AppError("AUTH_REQUIRED", "Please sign in.", error);
  if (status === 403 || code === "42501") return new AppError("FORBIDDEN", "You don't have access.", error);
  if (status === 404 || code === "PGRST116") return new AppError("NOT_FOUND", "Not found.", error);
  if (code === "23514" || code === "P0001") return new AppError("OUT_OF_STOCK", "Some items are out of stock.", error);
  if (status === 429) return new AppError("RATE_LIMITED", "Too many requests. Try again shortly.", error);
  if (status >= 500) return new AppError("NETWORK", "Server error. Please retry.", error);

  return new AppError("UNKNOWN", error.message ?? "Something went wrong.", error);
}
