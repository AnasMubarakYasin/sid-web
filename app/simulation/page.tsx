"use client";

// import Simulation from "@/component/simulation";
// import { useEffect } from "react";

// import '@/lib/simulation'

import dynamic from "next/dynamic";
const Simulation = dynamic(() => import('@/component/simulation'), {ssr: false})

export default function Page() {
  // useEffect(() => {
  //   import("@/lib/simulation");
  // });
  return (
    <>
      <Simulation></Simulation>
    </>
  );
}
