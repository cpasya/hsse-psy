import { ProfilePage } from "@/features/users/components/profile-page";
import { requireSession } from "@/lib/guards";

export const metadata = { title: "Profile" };

export default async function Page() {
  const session = await requireSession();

  return <ProfilePage user={session.user} />;
}
