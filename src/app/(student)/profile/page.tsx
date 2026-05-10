import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfileSelfRedirect() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.username) {
    redirect("/auth/login");
  }
  redirect(`/profile/${session.user.username}`);
}
