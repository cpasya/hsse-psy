import { createHash } from "node:crypto";

import type { UserDTO } from "@/features/users/types";

const ttl = 5_000;
const maxEntries = 1_000;
const profiles = new Map<string, { value: UserDTO; until: number }>();
const inFlight = new Map<string, Promise<UserDTO>>();

export async function cachedProfile(
  accessToken: string,
  load: () => Promise<UserDTO>,
  force = false,
): Promise<UserDTO> {
  const key = createHash("sha256").update(accessToken).digest("hex");
  const now = Date.now();
  const cached = profiles.get(key);

  if (!force && cached && cached.until > now) return cached.value;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = load().then((value) => {
    for (const [entry, profile] of profiles) {
      if (profile.until <= Date.now()) profiles.delete(entry);
    }

    while (profiles.size >= maxEntries) {
      const oldest = profiles.keys().next().value;
      if (oldest === undefined) break;
      profiles.delete(oldest);
    }

    profiles.set(key, { value, until: Date.now() + ttl });
    return value;
  });

  inFlight.set(key, promise);

  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
}
