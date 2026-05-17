export type RewriteErrorCode =
  | "invalid_api_key"
  | "model_not_found"
  | "invalid_base_url"
  | "quota_exceeded"
  | "rate_limited"
  | "timeout"
  | "content_too_long"
  | "provider_error"
  | "network_error"
  | "unsafe_base_url";

export class RewriteError extends Error {
  constructor(
    public code: RewriteErrorCode,
    message: string,
    public status = 400,
    public detail?: string,
  ) {
    super(message);
  }
}
