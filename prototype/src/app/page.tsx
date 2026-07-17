import { redirect } from "next/navigation";
import { getUser, roleHome } from "@/lib/session";

export default async function Home() {
  const user = await getUser();
  if (!user) redirect("/login");
  redirect(roleHome(user.role));
}
