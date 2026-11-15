/** HTTP status codes the app reads or returns. */
export const HttpStatus = {
  Ok: 200,
  NotFound: 404,
  TooManyRequests: 429,
  BadGateway: 502,
} as const;
export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus];
