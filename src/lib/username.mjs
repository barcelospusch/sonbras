export const normalizeUsername = value => value.trim().toLowerCase();
export function validUsername(value) {
  return typeof value==='string' && /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/.test(value);
}
