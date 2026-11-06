import Step1 from "@/layout/experiment/step-1";

export default async function Page({
  params,
}: {
  params: Promise<{ lab: number }>;
}) {
  const { lab } = await params;

  return <Step1 lab={lab} />;
}
