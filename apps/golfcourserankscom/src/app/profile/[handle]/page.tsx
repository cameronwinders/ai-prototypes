import { redirect } from "next/navigation";

export default async function LegacyProfilePage({
  params
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  redirect(`/u/${handle}`);
}
