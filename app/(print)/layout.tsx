import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return <div className="bg-white min-h-screen text-black p-0 m-0">{children}</div>;
}
