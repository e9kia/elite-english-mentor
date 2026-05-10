import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfileRouter() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.username) {
    redirect("/dashboard");
  }

  redirect(`/profile/${session.user.username}`);
}
