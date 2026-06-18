import Step3 from "@/layout/experiment/step-3";

export default async function Page({
  params,
}: {
  params: Promise<{ lab: number }>;
}) {
  const { lab } = await params;

  return <Step3 lab={lab} />;
}
