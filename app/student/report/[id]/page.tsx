import DiscoveryItem from "@/layout/discovery/item";

export default async function Page({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;

  return <DiscoveryItem id={id} />
}
