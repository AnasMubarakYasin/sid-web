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
import TabContext from "@mui/lab/TabContext";
// import Tab from "@mui/material/Tab";
// import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Checkbox from "@mui/material/Checkbox";
import Select, { SelectChangeEvent } from "@mui/material/Select";

import AddIcon from "@mui/icons-material/Add";
import LoginIcon from "@mui/icons-material/Login";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useDashboardStore } from "@/store/dashboard";
import { createLab, event, Experiment, list, setToken } from "@/api/experiment";
import { useExperimentStore } from "@/store/experiment";
import { useUserStore } from "@/store/user";
import { playRoomCreatedSound, playRoomDeletedSound } from "@/lib/sfx";

export default function Page() {
  const router = useRouter();
  const user = useUserStore();
  const dashboard = useDashboardStore();
  const experiment = useExperimentStore();
  const query = useQuery({
    queryKey: ["experiments"],
    queryFn: list,
    // gcTime: 0,
  });
  const mutation = useMutation({
    mutationFn: createLab,
    onSuccess(result) {
      // experiment.setLab(result.data.id);
      router.replace("/student/experiment/" + result.data.id);
      setTimeout(() => {}, 1000);
    },
  });

  useLayoutEffect(() => {
    dashboard.setTitle("Experiment");
    dashboard.setLoading(false);
  }, []);
  useLayoutEffect(() => {
    setToken(user.token!);
    return () => setToken("");
  }, [user.token]);
  useLayoutEffect(() => {
    event.onCreate = () => {
      query.refetch();
      playRoomCreatedSound();
    };
    event.onDelete = () => {
      query.refetch();
      playRoomDeletedSound();
    };
    event.onStart = (data) => {
      if (query.data && query.data.data.length != data.count) {
        query.refetch();
      }
    };
    event.connect().catch((error) => {
      dashboard.setToast({ level: "error", message: error.message });
    });
    return () => {
      event.disconnect();
    };
  }, []);

  return (
    <div className="w-container flex flex-wrap max-sm:justify-evenly gap-8">
      {query.isPending &&
        [, 1, 2, 3, 4, 5, 6].map((v, i) => (
          <Skeleton key={"lab_l_" + i} variant="rounded">
            <Paper
              variant="outlined"
              elevation={4}
              className="flex flex-col gap-2 w-34 h-34 items-center justify-center"
            >
              <IconButton color="primary">
                <AddIcon />
              </IconButton>
            </Paper>
          </Skeleton>
        ))}
      {query.isSuccess &&
        query.data.data!.map((item: Experiment) => (
          <Paper
            key={"experiment_" + item.id}
            variant="outlined"
            elevation={4}
            className="flex flex-col gap-2 w-34 h-34 items-center justify-center"
          >
            <div>Lab {item.id}</div>
            <Tooltip title="Join Lab">
              <IconButton
                color="primary"
                size="large"
                disabled={mutation.data && mutation.data.data.id == item.id}
                onClick={() => {
                  // experiment.setLab(item.id);
                  router.replace("/student/experiment/" + item.id);
                }}
              >
                <LoginIcon />
              </IconButton>
            </Tooltip>
          </Paper>
        ))}
      {query.isSuccess && (
        <Paper
          variant="outlined"
          elevation={4}
          className="flex flex-col gap-2 w-34 h-34 items-center justify-center"
        >
          <Tooltip title="Create Lab">
            <IconButton
              color="primary"
              size="large"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({})}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Paper>
      )}
    </div>
  );
}
