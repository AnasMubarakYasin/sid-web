export interface ApiResponse {
  success: boolean;
  data: any;
  meta: ApiResponseMeta;
  error?: ApiResponseError;
}
export interface ApiResponseMeta {
  token: string;
}
export interface ApiResponseError {
  code: boolean;
  message: string;
}
