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

import { Editor } from "@tiptap/react";
import TextEditor from "@/component/text-editor";
import "@/component/text-editor.css";

import { useQuery } from "@tanstack/react-query";
import { list, setToken } from "@/api/subject";
import { collaboration } from "@/api/experiment";
import { useUserStore } from "@/store/user";
import { useDashboardStore } from "@/store/dashboard";
import { useExperimentStore } from "@/store/experiment";
import { Step } from "@tiptap/pm/transform";
import { debounce } from "@/lib/utils";

export default function Step5({ lab }: { lab: number }) {
  const dashboard = useDashboardStore();
  const experiment = useExperimentStore();
  const ref = useRef<Editor>(null);

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
      if (experiment.oplog.startsWith("conclusion")) {
        collaboration.sync({
          attr: "conclusion",
          conclusion: experiment.conclusion,
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
    collaboration.subscribe("conclusion", handler);
    return () => {
      collaboration.unsubscribe("conclusion", handler);
    };
    function handler(message: any) {
      // console.log(message);
      const steps = message.steps.map((step: any) =>
        Step.fromJSON(editor.schema, step),
      ) as Step[];
      for (const step of steps) {
        editor.view.updateState(editor.state.apply(editor.state.tr.step(step)));
      }
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
              Explanation Construction
            </Typography>
            <Typography component="p" variant="body1">
              Tarik kesimpulan berdasarkan seluruh kegiatan inquiry yang telah
              kamu lakukan.
            </Typography>
          </header>
          <Paper
            variant="outlined"
            elevation={4}
            className="w-stretch md:w-182 p-1 self-center justify-center"
          >
            {experiment.process != "synchronized" && (
              <Skeleton variant="rounded">
                <TextEditor />
              </Skeleton>
            )}
            {experiment.process == "synchronized" && (
              <TextEditor
                content={experiment.conclusion}
                onCreate={(editor) => {
                  ref.current = editor;
                }}
                onUpdate={(value) => {
                  debounce(() => {
                    if (experiment.process == "synchronized") {
                      experiment.setConclusion(value);
                    } else {
                      dashboard.setToast({
                        level: "warning",
                        message: "your changes not synchronize",
                      });
                    }
                  }, 1000);
                }}
                onStep={(value) => {
                  collaboration.publish("conclusion", { steps: value });
                }}
              />
            )}
          </Paper>
        </Paper>
      </div>
    </Box>
  );
}
