import { redirect } from "next/navigation";

export default async function LegacyProfilePage() {
  redirect("/friends");
}
