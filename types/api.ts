export interface ApiEnvelope<T> {
  data: T;
  error: null | {
    code: string;
    message: string;
    details?: unknown;
  };
}
