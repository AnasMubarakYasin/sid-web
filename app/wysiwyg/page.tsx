"use client";


// import Spreadsheet from "@/component/spreadsheet";
// import Spreadsheet from "@/component/spreadsheet-v2";
// import dynamic from "next/dynamic";
// const Spreadsheet = dynamic(() => import("@/component/spreadsheet-v2"), {ssr: false})
import TextEditor from "@/component/text-editor-v3";

// import { useEffect } from "react";

// import '@/lib/simulation'

// import dynamic from "next/dynamic";
// const Simulation = dynamic(() => import('@/component/simulation'), {ssr: false})

export default function Page() {
  // useEffect(() => {
  //   import("@/lib/simulation");
  // });
  return (
    <>
      <TextEditor />
    </>
  );
}
