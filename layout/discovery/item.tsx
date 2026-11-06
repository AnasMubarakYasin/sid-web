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

import TextList from "@/component/text-list";
import "@/component/text-editor.css";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/shallow";

import { useDashboardStore } from "@/store/dashboard";
import { useExperimentStore } from "@/store/experiment";
import { useUserStore } from "@/store/user";
import { User } from "@/api/user";

// import { setToken as setTokenSubject, get as getSubject } from "@/api/subject";
import { setToken, report } from "@/api/experiment";

export default function DiscoveryItem({ id }: { id: number }) {
  const router = useRouter();
  const user = useUserStore();
  const dashboard = useDashboardStore();
  // const experiment = useExperimentStore();
  const experiment = useQuery({
    queryKey: ["experiment", id],
    queryFn: ({ queryKey: [_, id] }) => report({ id: id as number }),
    enabled: !!id,
  });
  useLayoutEffect(() => {
    dashboard.setTitle("Report " + id);
    dashboard.setLoading(false);
  }, []);
  useLayoutEffect(() => {
    setToken(user.token!);
    return () => {
      setToken("");
    };
  }, [user.token]);

  return (
    <Box className="flex flex-col gap-4 max-sm:p-1">
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
              Date:{" "}
              {new Date(experiment.data?.data.created_at).toLocaleDateString()}
            </Typography>
            <Typography component="p" variant="body1">
              Status: {experiment.data?.data.status}
            </Typography>
            <Typography component="p" variant="body1">
              Status: {experiment.data?.data.status}
            </Typography>
            <Typography component="p" variant="body1">
              Description: {experiment.data?.data.description}
            </Typography>
          </div>
          <header>
            <Typography component="h3" variant="h6">
              {experiment.data?.data.subject.title}
            </Typography>
            <Typography component="p" variant="body1">
              {experiment.data?.data.subject.description}
            </Typography>
          </header>

          <div className="flex flex-col gap-2">
            <Typography component="p" variant="body1">
              Teacher
            </Typography>
            <div className="flex gap-2">
              {experiment.data?.data.teachers.map((value: any) => (
                <MAvatar key={"teacher_" + value.id} user={value} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Typography component="p" variant="body1">
              Students
            </Typography>
            <Paper variant="outlined" square={false} className="flex gap-2 p-4">
              {experiment.data?.data.students.map((value: any) => (
                <MAvatar key={"student_" + value.id} user={value} />
              ))}
            </Paper>
          </div>
          {/* <div className="flex flex-col gap-2">
            <Typography component="p" variant="body1">
              Groups
            </Typography>
            <Box className="flex flex-wrap gap-4">
             
            </Box>
          </div> */}
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
          </header>
          <Paper
            variant="outlined"
            elevation={4}
            className="w-stretch md:w-182 p-1 self-center justify-center"
          >
            {experiment.isLoading && (
              <Skeleton variant="rounded" width="100%" height="100%">
                <TextList />
              </Skeleton>
            )}
            {experiment.isSuccess && (
              <TextList readonly value={experiment.data?.data.answers} />
            )}
          </Paper>
        </Paper>
        <div></div>
      </div>
    </Box>
  );
}
