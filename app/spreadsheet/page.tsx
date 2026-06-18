"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

import SpreadsheetV1 from "@/component/spreadsheet";
import SpreadsheetV2 from "@/component/spreadsheet-v2";
import SpreadsheetV3 from "@/component/spreadsheet-v3";
import SpreadsheetV4 from "@/component/spreadsheet-v4";

export default function Page() {
  const [value, setValue] = React.useState("1");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ typography: "body1" }} className="w-dvw h-dvh">
      {/* <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="V1" value="1" />
            <Tab label="V2" value="2" />
            <Tab label="V3" value="3" />
            <Tab label="V4" value="4" />
          </TabList>
        </Box>
        <TabPanel value="1" className="w-dvw h-dvh">
          <SpreadsheetV1 />
        </TabPanel>
        <TabPanel value="2" className="w-dvw h-dvh">
          <SpreadsheetV2 />
        </TabPanel>
        <TabPanel value="3" className="w-dvw h-dvh">
          <SpreadsheetV3 />
        </TabPanel>
        <TabPanel value="4" className="w-dvw h-dvh">
          <SpreadsheetV4 />
        </TabPanel>
      </TabContext> */}
    </Box>
  );
}
