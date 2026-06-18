"use client";

import { useEffect, useLayoutEffect, useState } from "react";

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
import Checkbox from "@mui/material/Checkbox";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import Avatar from "@mui/material/Avatar";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteIcon from "@mui/icons-material/Delete";

import MAvatar from "@/layout/experiment/avatar";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/shallow";

import { useDashboardStore } from "@/store/dashboard";
import { useExperimentStore } from "@/store/experiment";
import { useUserStore } from "@/store/user";
import { User } from "@/api/user";

import { setToken as setTokenSubject, list } from "@/api/subject";
import { setToken as setTokenExperiment, get } from "@/api/experiment";

export default function DiscoveryItem({ id }: { id: number }) {
  const router = useRouter();
  const user = useUserStore();
  const dashboard = useDashboardStore();
  // const experiment = useExperimentStore();
  const subjects = useQuery({
    queryKey: ["subjects"],
    queryFn: list,
  });
  const query_experiment = useQuery({
    queryKey: ["experiment", id],
    queryFn: ({ queryKey: [_, id] }) => get({ id: id as number }),
    enabled: !!id,
  });

  useLayoutEffect(() => {
    dashboard.setTitle("Discovery " + id);
    dashboard.setLoading(false);
  }, []);
  useLayoutEffect(() => {
    setTokenSubject(user.token!);
    setTokenExperiment(user.token!);
    return () => {
      setTokenSubject("");
      setTokenExperiment("");
    };
  }, [user.token]);

  return (
    <Box className="w-container">
      <div className="flex flex-col gap-4">
        <Paper
          variant="outlined"
          elevation={4}
          className="w-stretch flex flex-col gap-6 p-8 max-sm:p-4 self-center justify-center"
        >
          {/* <header className="flex flex-col gap-2">
            <Typography component="h2" variant="h5">
              Preparing Experiment
            </Typography>
            <Typography component="p" variant="body1">
              Set a Experiment Subject, Manage Students.
            </Typography>
          </header> */}
          <div>
            <Typography component="p" variant="body1">
              Lab: {id}
            </Typography>
            <Typography component="p" variant="body1">
              -
            </Typography>
          </div>
          <header>
            <Typography component="h3" variant="h6">
              {/* {experiment.subject && experiment.subject.title} */}
            </Typography>
            <Typography component="p" variant="body1">
              {/* {experiment.subject && experiment.subject.description} */}
            </Typography>
          </header>

          <div className="flex flex-col gap-2">
            <Typography component="p" variant="body1">
              Teacher
            </Typography>
            <div className="flex gap-2">
              {/* {experiment.teachers.map((value, index) => (
                <Tooltip key={"teacher_" + value.id} title={value.name}>
                  <Avatar alt={value.name} />
                </Tooltip>
              ))} */}
              {/* {experiment.teachers.map((value, index) => (
                <MAvatar key={"teacher_" + value.id} user={value} />
              ))} */}
              {/* {!experiment.teachers.length && <Avatar className="opacity-0" />} */}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Typography component="p" variant="body1">
              Students
            </Typography>
            <Paper variant="outlined" square={false} className="flex gap-2 p-4">
              {/* {experiment.students.map((value, index) => (
                <MAvatar key={"student_" + value.id} user={value} />
              ))}
              {!experiment.students.length && <Avatar className="opacity-0" />} */}
            </Paper>
          </div>
          <div className="flex flex-col gap-2">
            <Typography component="p" variant="body1">
              Groups
            </Typography>
            <Box className="flex flex-wrap gap-4">
              {/* {experiment.groups.map((group) => (
                <Paper
                  key={"group_" + group.id}
                  variant="outlined"
                  square={false}
                  className="flex gap-2 p-2 w-44 h-28 items-start justify-center relative"
                >
                  <div className="flex flex-col flex-wrap items-center justify-center gap-4">
                    <Typography component="h4" variant="body1">
                      {group.name}
                    </Typography>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {group.students.map((student) => (
                        <Tooltip
                          key={"group_student_" + student.id}
                          title={student.name}
                        >
                          <Avatar alt={student.name} />
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </Paper>
              ))} */}
            </Box>
          </div>
        </Paper>
      </div>
    </Box>
  );
}
