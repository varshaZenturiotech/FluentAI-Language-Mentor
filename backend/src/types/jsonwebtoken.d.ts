declare module 'jsonwebtoken' {
  export interface SignOptions {
    expiresIn?: string | number;
    [key: string]: unknown;
  }

  export interface JwtPayload {
    [key: string]: unknown;
  }

  export function sign(
    payload: string | object | Buffer,
    secretOrPrivateKey: string | Buffer,
    options?: SignOptions
  ): string;

  export function verify(token: string, secretOrPublicKey: string | Buffer): string | JwtPayload;

  export function decode(token: string): string | JwtPayload | null;
}
