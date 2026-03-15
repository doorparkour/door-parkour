/**
 * Unwrap a parse result. Use after checking for error and returning early.
 * Ensures we never pass undefined to DB when validation failed.
 */
export function unwrap<T>(result: { data?: T; error?: string }): T {
  if (result.error) throw new Error(result.error);
  if (result.data === undefined) throw new Error("Validation failed");
  return result.data;
}
