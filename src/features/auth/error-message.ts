export function authErrorMessage(input: unknown): string | null {
  if (
    typeof input !== "object" ||
    input === null ||
    !("message" in input)
  ) {
    return null;
  }

  if (Array.isArray(input.message)) {
    return input.message.map(String).join(", ");
  }

  return typeof input.message === "string"
    ? input.message
    : null;
}
