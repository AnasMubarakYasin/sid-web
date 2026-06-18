"use client";

import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";

import { useRef } from "react";

export default function Spreadsheet() {
  const ref = useRef<WorkbookInstance>(null);

  return (
    <Workbook
      ref={ref}
      column={6}
      row={6}
      data={[{ name: "Sheet1" }]}
      showToolbar
      showFormulaBar
      showSheetTabs={false}
    />
  );
}
