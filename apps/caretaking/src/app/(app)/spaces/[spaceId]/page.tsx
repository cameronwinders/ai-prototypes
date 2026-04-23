import { redirect } from "next/navigation";

type SpacePageProps = {
  params: Promise<{ spaceId: string }>;
};

export default async function SpacePage({ params }: SpacePageProps) {
  const { spaceId } = await params;
  redirect(`/spaces/${spaceId}/timeline`);
}
