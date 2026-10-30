import { requirePermission } from "@/lib/guards";
import { Forbidden } from "@/components/shared/module-placeholder";
import { AccessPage } from "@/features/access/components/access-page";

export const metadata = {
    title: "Roles",
};

export default async function Page() {
    const { allowed } = await requirePermission("roles.read");

    return allowed
        ? <AccessPage resource="roles" />
        : <Forbidden />;
}