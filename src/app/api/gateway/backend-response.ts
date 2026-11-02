export function unwrapBackendEnvelope(input: unknown): unknown {
  if (
    typeof input === "object" &&
    input !== null &&
    "status" in input &&
    typeof input.status === "number" &&
    "message" in input &&
    typeof input.message === "string" &&
    "data" in input
  ) {
    return input.data;
  }

  return input;
}
