import Lobby from "@/layout/experiment/lobby";

export default async function Page({
  params,
}: {
  params: Promise<{ lab: number }>;
}) {
  const { lab } = await params;

  return <Lobby lab={lab} />;
}
