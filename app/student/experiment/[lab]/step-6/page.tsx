import Step6 from "@/layout/experiment/step-6";

export default async function Page({
  params,
}: {
  params: Promise<{ lab: number }>;
}) {
  const { lab } = await params;

  return <Step6 lab={lab} />;
}
