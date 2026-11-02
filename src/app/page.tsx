import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function Home() {
  const s = await getServerSession(authOptions);
  redirect(
    s && !s.error
      ? s.user.mustachePassword
        ? "/change-password"
        : "/dashboard"
      : "/login",
  );
}
