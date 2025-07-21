import jwt_decode from "jwt-decode";

export function isTokenExpired(token: string): boolean {
  try {
    const decoded: { exp: number } = jwt_decode(token);
    if (!decoded.exp) return true;
    // exp is in seconds, Date.now() is in ms
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}