"use client";

import React, { useMemo } from "react";

import {
  Workbook,
  type IWorkbook,
  type ISheet,
  type ICellRange,
} from "@sheetxl/sdk";

import { WorkbookElement } from "@sheetxl/studio-mui";

export default function Spreadsheet() {
  const workbook: IWorkbook = useMemo<IWorkbook>(() => {
    const wb: IWorkbook = new Workbook();
    const sheet: ISheet = wb.getSheetAt(0);
    const range: ICellRange = sheet.getRange("A1:B1");
    range.setValues([["Hello", "World"]]);
    return wb;
  }, []);

  return <WorkbookElement workbook={workbook} />;
}
