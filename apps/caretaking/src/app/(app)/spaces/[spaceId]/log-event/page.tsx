import { permanentRedirect } from "next/navigation";

type LegacyLogEventPageProps = {
  params: Promise<{ spaceId: string }>;
};

export default async function LegacyLogEventPage({ params }: LegacyLogEventPageProps) {
  const { spaceId } = await params;

  permanentRedirect(`/spaces/${spaceId}/events/new`);
}
