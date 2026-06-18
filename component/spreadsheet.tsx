"use client";

import { JSX, useEffect, useRef, useState } from "react";

import {
  Spreadsheet as JSpreadsheetCE,
  Worksheet as JSWorksheetCE,
  jspreadsheet,
} from "@jspreadsheet-ce/react";

import "material-icons/iconfont/filled.css";
import "jsuites/dist/jsuites.css";
import "jspreadsheet-ce/dist/jspreadsheet.css";
import "jspreadsheet-ce/dist/jspreadsheet.themes.css";
import "./spreadsheet.css";

import {
  ToolbarItem,
  WorksheetInstance,
  SpreadsheetInstance,
} from "jspreadsheet-ce";

type TJSProps = JSX.IntrinsicAttributes & jspreadsheet.SpreadsheetOptions;
type TJSWProps = JSX.IntrinsicAttributes & jspreadsheet.WorksheetOptions;
type TJSpreadsheet = (props: TJSProps) => JSX.Element;
type TJSWorksheet = (props: TJSWProps) => JSX.Element;

const JSpreadsheet = JSpreadsheetCE as TJSpreadsheet;
const JSWorksheet = JSWorksheetCE as TJSWorksheet;

export default function Spreadsheet(props: {
  data?: any[][];
  onCreate?: (value: SpreadsheetInstance) => void;
  onChange?: (value: { col: any; row: any; nval: any; oval: any }) => void;
  onUpdate?: (data: any[][]) => void;
}) {
  const api = useRef<jspreadsheet.WorksheetInstance[]>(null);
  // const [show, setShow] = useState(true);

  // Toolbar handler
  const toolbar = (toolbar: { items: ToolbarItem[] }) => {
    // Add a new custom item in the end of my toolbar
    toolbar.items.push({
      tooltip: "Italic",
      content: "italic",
      onclick: function () {
      },
    });
    toolbar.items.splice(2, 1);
    toolbar.items.pop();
    return toolbar;
  };

  useEffect(() => {
    // console.log(api.current[0]);
    const worksheet = api.current![0];
    props.onCreate?.(worksheet.parent);
    // window['worksheet'] = worksheet;
  }, [api]);
  // useEffect(() => {
  // if (!show) {
  //   setTimeout(() => {
  //     jspreadsheet(api.current[0], {
  //       worksheets: [{ minDimensions: [6, 6], data: props.data }],
  //     });
  //     setShow(true);
  //   }, 1000);
  // }
  // }, [show]);

  return (
    <>
      <JSpreadsheet
        //@ts-ignore
        ref={api}
        tabs={false}
        toolbar={toolbar}
        oncreateeditor={(editor) => {}}
        oncreateworksheet={(sheet, opts, index) => {}}
        onchange={(sheet, cell, col, row, nval, oval) => {
          // console.log(sheet, cell, col, row, nval, oval);
          props.onChange?.({ col, row, nval, oval });
        }}
        onafterchanges={(instance, changes) => {
          props.onUpdate?.(instance.getData());
        }}
        onevent={(event, ...args) => {
          console.log("[spreadsheet]", event);
        }}
      >
        <JSWorksheet minDimensions={[6, 6]} data={props.data} />
      </JSpreadsheet>
    </>
  );
}
