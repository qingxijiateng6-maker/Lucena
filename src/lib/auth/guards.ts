export function requireAuthenticatedUser<T>(user: T | null): T {
  if (!user) {
    throw new Error("Authentication required.");
  }

  return user;
}
