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

import TextList from "@/component/text-list";
import "@/component/text-editor.css";

import RefreshIcon from "@mui/icons-material/Refresh";
import MenuIcon from "@mui/icons-material/Menu";

import { useQuery } from "@tanstack/react-query";
import { list, setToken } from "@/api/subject";
import { collaboration } from "@/api/experiment";
import { useUserStore } from "@/store/user";
import { useDashboardStore } from "@/store/dashboard";
import { useExperimentStore } from "@/store/experiment";

import { Editor } from "@tiptap/react";
import { EditorState } from "@tiptap/pm/state";
import { Schema } from "@tiptap/pm/model";
import { orderedList, listItem } from "@tiptap/pm/schema-list";
import { AddMarkStep, Step, Transform } from "@tiptap/pm/transform";

import { debounce } from "@/lib/utils";

export default function Step2({ lab }: { lab: number }) {
  const dashboard = useDashboardStore();
  const experiment = useExperimentStore();
  const ref = useRef<Editor>(null);

  useLayoutEffect(() => {
    dashboard.setTitle("Experiment");
    dashboard.setLoading(false);
  }, []);
  useEffect(() => {
    if (lab == experiment.lab) {
      return;
    }
    experiment.setLab(lab);
    experiment.setStep(2, false);
  }, [lab]);
  useEffect(() => {
    if (experiment.process == "synchronized") {
      if (experiment.oplog.endsWith("0")) {
        return;
      }
      if (experiment.oplog.startsWith("questions")) {
        collaboration.sync({
          attr: "questions",
          questions: experiment.questions,
        });
      }
      if (experiment.oplog.startsWith("answers")) {
        collaboration.sync({
          attr: "answers",
          answers: experiment.answers,
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
    collaboration.subscribe("answers", handler);
    return () => {
      collaboration.unsubscribe("answers", handler);
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
              Question Formulation
            </Typography>
            <Typography component="p" variant="body1">
              Berdasarkan fenomena yang kamu amati, rumuskan masalah yang akan
              kamu selidiki.
            </Typography>
          </header>
          <Paper
            variant="outlined"
            elevation={4}
            className="w-stretch md:w-182 p-1 self-center justify-center"
          >
            {experiment.subject &&
              experiment.subject.questions.map((question, index) => (
                <Box
                  key={"question_" + index}
                  component="div"
                  className="flex gap-1 items-center-safe"
                >
                  <Checkbox
                    id={"question_" + index}
                    checked={experiment.questions.includes(question)}
                    onChange={(_, checked) => {
                      if (checked) {
                        experiment.addQuestion(question);
                      } else {
                        experiment.delQuestion(question);
                      }
                    }}
                  />
                  <Typography component="label" htmlFor={"question_" + index}>
                    {index + 1}. {question}
                  </Typography>
                </Box>
              ))}
          </Paper>
        </Paper>
        <Paper
          variant="outlined"
          elevation={4}
          className="w-stretch flex flex-col gap-6 p-8 max-sm:p-4 self-center justify-center"
        >
          <header className="flex flex-col gap-2">
            <Typography component="h2" variant="h5">
              Hypotesis
            </Typography>
            <Typography component="p" variant="body1">
              Buatlah dugaan sementara (hipotesis) berdasarkan rumusan masalah
              yang telah kamu buat.
            </Typography>
          </header>
          <Paper
            variant="outlined"
            elevation={4}
            className="w-stretch md:w-182 p-1 self-center justify-center"
          >
            {experiment.process != "synchronized" && (
              <Skeleton variant="rounded" width="100%" height="100%">
                <TextList />
              </Skeleton>
            )}
            {experiment.process == "synchronized" && (
              <TextList
                value={experiment.answers}
                onCreate={(editor) => {
                  ref.current = editor;
                }}
                onUpdate={(value) => {
                  debounce(() => {
                    if (experiment.process == "synchronized") {
                      experiment.setAnswers(value);
                    } else {
                      dashboard.setToast({
                        level: "warning",
                        message: "your changes not synchronize",
                      });
                    }
                  }, 1000);
                }}
                onStep={(value) => {
                  collaboration.publish("answers", { steps: value });
                }}
              />
            )}
          </Paper>
        </Paper>
      </div>
    </Box>
  );
}
