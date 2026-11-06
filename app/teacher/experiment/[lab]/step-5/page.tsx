import Step5 from "@/layout/experiment/step-5";

export default async function Page({
  params,
}: {
  params: Promise<{ lab: number }>;
}) {
  const { lab } = await params;

  return <Step5 lab={lab} />;
}
