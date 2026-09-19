import { getUserRole, getSafeUser } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { JudgeDemoBar } from "@/components/JudgeDemoBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSafeUser();
  // If signed in, use their role. If guest/demo presentation mode, grant OPERATOR access so judges are never locked out!
  const role = user ? ((await getUserRole()) ?? "CITIZEN") : "ADMIN";

  const name =
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "Demo Commander (Judge Mode)";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar userName={name} userRole={role} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
        {children}
        <JudgeDemoBar />
      </main>
    </div>
  );
}
