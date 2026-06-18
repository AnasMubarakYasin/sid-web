import Step4 from "@/layout/experiment/step-4";

export default async function Page({
  params,
}: {
  params: Promise<{ lab: number }>;
}) {
  const { lab } = await params;

  return <Step4 lab={lab} />;
}
