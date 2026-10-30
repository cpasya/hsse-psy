import { z } from "zod";
const schema = z.object({
  API_BASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
});
export function serverEnv() {
  return schema.parse(process.env);
}
