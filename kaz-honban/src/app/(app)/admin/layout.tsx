import { redirect } from "next/navigation";
import { verifyAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await verifyAdmin();

  if (!result.isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <AdminNav />
      <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
    </div>
  );
}
