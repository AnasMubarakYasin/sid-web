"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TabContext from "@mui/lab/TabContext";
// import Tab from "@mui/material/Tab";
// import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Checkbox from "@mui/material/Checkbox";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Skeleton from "@mui/material/Skeleton";
import Avatar from "@mui/material/Avatar";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";

import RefreshIcon from "@mui/icons-material/Refresh";
import MenuIcon from "@mui/icons-material/Menu";

import Spreadsheet from "@/component/spreadsheet";
import { SpreadsheetInstance } from "jspreadsheet-ce";

import { useQuery } from "@tanstack/react-query";
import { list, setToken } from "@/api/subject";
import { collaboration } from "@/api/experiment";
import { useUserStore } from "@/store/user";
import { useDashboardStore } from "@/store/dashboard";
import { useExperimentStore } from "@/store/experiment";

import { debounce } from "@/lib/utils";

export default function Step4({ lab }: { lab: number }) {
  const dashboard = useDashboardStore();
  const experiment = useExperimentStore();
  const ref = useRef<SpreadsheetInstance>(null);

  useLayoutEffect(() => {
    dashboard.setTitle("Experiment");
    dashboard.setLoading(false);
  }, []);
  //   useLayoutEffect(() => {
  //     setToken(token!);
  //     return () => setToken("");
  //   }, [token]);
  useEffect(() => {
    if (lab == experiment.lab) {
      return;
    }
    experiment.setLab(lab);
    experiment.setStep(4, false);
  }, [lab]);
  useEffect(() => {
    if (experiment.process == "synchronized") {
      if (experiment.oplog.endsWith("0")) {
        return;
      }
      if (experiment.oplog.startsWith("collections")) {
        collaboration.sync({
          attr: "collections",
          collections: experiment.collections,
        });
      }
      console.log("upstream", experiment.oplog);
    }
  }, [experiment.oplog]);
  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const editor = ref.current;
    const sheet = editor.worksheets[0];
    let prev: any = { col: -1, row: -1 };
    collaboration.subscribe("collections", handler);
    return () => {
      collaboration.unsubscribe("collections", handler);
    };
    function handler(message: any) {
      console.log(message);
      if (prev.col == message.col && prev.row == message.row) {
        return;
      }
      prev = message;
      sheet.setValueFromCoords(message.col, message.row, message.nval);
    }
  }, [ref.current]);

  return (
    <Box
      className="w-container h-stretch"
      inert={
        experiment.process == "connecting" ||
        experiment.process == "disconnected"
      }
      sx={[
        (experiment.process == "connecting" ||
          experiment.process == "disconnected") && {
          opacity: "0.6",
        },
      ]}
    >
      <div className="flex flex-col gap-4 max-sm:p-1">
        <Paper
          variant="outlined"
          elevation={4}
          className="w-stretch flex flex-col gap-6 p-8 max-sm:p-4 self-center justify-center"
        >
          <header className="flex flex-col gap-2">
            <Typography component="h2" variant="h5">
              Data Collection and Analisys
            </Typography>
            <Typography component="p" variant="body1">
              Analisis data yang telah kamu peroleh dari eksperimen.
            </Typography>
          </header>
          <Paper
            variant="outlined"
            elevation={4}
            className="w-stretch md:w-182 p-1 self-center justify-center"
          >
            {experiment.process != "synchronized" && (
              <Skeleton variant="rounded" width="100%" height="100%">
                <Spreadsheet />
              </Skeleton>
            )}
            {experiment.process == "synchronized" && (
              <Spreadsheet
                data={experiment.collections}
                onCreate={(sheet) => {
                  ref.current = sheet;
                }}
                onChange={(value) => {
                  collaboration.publish("collections", value);
                }}
                onUpdate={(data) => {
                  debounce(() => {
                    if (experiment.process == "synchronized") {
                      experiment.setCollections(data);
                    } else {
                      dashboard.setToast({
                        level: "warning",
                        message: "your changes not synchronize",
                      });
                    }
                  }, 1000);
                }}
              />
            )}
          </Paper>
        </Paper>
      </div>
    </Box>
  );
}
