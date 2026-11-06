import Step2 from "@/layout/experiment/step-2";

export default async function Page({
  params,
}: {
  params: Promise<{ lab: number }>;
}) {
  const { lab } = await params;

  return <Step2 lab={lab} />;
}
