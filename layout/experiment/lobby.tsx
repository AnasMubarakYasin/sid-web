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

import { list } from "@/api/subject";
import { collaboration, get } from "@/api/experiment";
import { useDashboardStore } from "@/store/dashboard";
import { useExperimentStore } from "@/store/experiment";
import { useUserStore } from "@/store/user";
import { User } from "@/api/user";

export default function Lobby({ lab }: { lab: number }) {
  const router = useRouter();
  const user = useUserStore();
  const dashboard = useDashboardStore();
  const experiment = useExperimentStore();
  // const {} = useExperimentStore(useShallow((state) => ({ group })));
  const userGroup = useExperimentStore((state) => {
    if (user.role == "teacher") {
      return undefined;
    }
    return state.groups.find((group) =>
      group.students.find((student) => student.id == user.id),
    );
  });
  const subjects = useQuery({
    queryKey: ["subjects"],
    queryFn: list,
  });
  const query_experiment = useQuery({
    queryKey: ["experiment", lab],
    queryFn: ({ queryKey: [_, id] }) => get({ id: id as number }),
    enabled: !!lab,
  });
  const handleChange = (event: SelectChangeEvent) => {
    experiment.setSubject(
      subjects.data!.data.find((item: any) => item.id == event.target.value),
    );
  };

  useLayoutEffect(() => {
    dashboard.setTitle("Experiment | Lobby");
    dashboard.setLoading(false);
  }, []);
  useEffect(() => {
    // console.log(
    //   "status",
    //   query_experiment.isError,
    //   query_experiment.isSuccess && !query_experiment.data?.data,
    // );
    // if (query_experiment.isError) {
    //   router.replace("/student/experiment");
    // } else if (query_experiment.isSuccess && !query_experiment.data.data) {
    //   router.replace("/student/experiment");
    // } else if (query_experiment.isPending || query_experiment.isPaused) {
    // } else {
    //   experiment.setLab(lab);
    // }
  }, [query_experiment.status]);
  useEffect(() => {
    if (lab == experiment.lab) {
      return;
    }
    experiment.setLab(lab);
    experiment.setStep(0, false);
  }, [lab]);
  useEffect(() => {
    if (experiment.process == "synchronized") {
      if (experiment.oplog.endsWith("0")) {
        return;
      }
      if (experiment.oplog.startsWith("groups")) {
        collaboration.sync({
          attr: "groups",
          groups: experiment.groups,
        });
      }
      if (experiment.oplog.startsWith("subject")) {
        collaboration.sync({
          attr: "subject",
          subject: experiment.subject!,
        });
      }
      if (experiment.oplog.startsWith("status")) {
        collaboration.sync({
          attr: "status",
          status: experiment.status!,
        });
      }
      console.log("upstream", experiment.oplog);
    }
  }, [experiment.oplog]);
  function onKick(user: User) {
    collaboration.kick(user);
  }

  return (
    <Box
      className="w-container"
      // hidden={experiment.lobby}
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
      <div className="flex flex-col gap-4">
        <Paper
          variant="outlined"
          elevation={4}
          className="w-stretch flex flex-col gap-6 p-8 max-sm:p-4 self-center justify-center"
        >
          <header className="flex flex-col gap-2">
            <Typography component="h2" variant="h5">
              Preparing Experiment
            </Typography>
            <Typography component="p" variant="body1">
              Set a Experiment Subject, Manage Students.
            </Typography>
          </header>
          <div>
            <Typography component="p" variant="body1">
              Lab: {lab}
            </Typography>
            <Typography component="p" variant="body1">
              Status: {experiment.status}
            </Typography>
          </div>
          {experiment.status == "waiting" && (
            <Box component="div" className="flex flex-col gap-1">
              <Typography component="label" htmlFor="subject">
                Subject
              </Typography>
              <Select
                id="subject"
                label=""
                variant="outlined"
                fullWidth
                value={
                  experiment.subject ? experiment.subject.id.toString() : ""
                }
                onChange={handleChange}
                displayEmpty
                renderValue={(selected: string) => {
                  if (selected) {
                    return (
                      <div className="text-[16px] font-400">
                        {experiment.subject!.title}
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-[16px] font-400 opacity-50">
                        Choose Subject
                      </div>
                    );
                  }
                }}
              >
                {subjects.data?.data.map((item: any) => (
                  <MenuItem key={"options_" + item.id} value={item.id + ""}>
                    {item.title}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}
          <div>
            <Typography component="h3" variant="h6">
              {experiment.subject && experiment.subject.title}
            </Typography>
            <Typography component="p" variant="body1">
              {experiment.subject && experiment.subject.description}
            </Typography>
          </div>

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
              {experiment.teachers.map((value, index) => (
                <MAvatar
                  key={"teacher_" + value.id}
                  user={value}
                  onKick={value.id == user.id ? undefined : onKick}
                />
              ))}
              {!experiment.teachers.length && <Avatar className="opacity-0" />}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Typography component="p" variant="body1">
              Students
            </Typography>
            <Paper variant="outlined" square={false} className="flex gap-2 p-4">
              {/* {experiment.students.map((value, index) => (
                <Tooltip key={"student_" + value.id} title={value.name}>
                  <Avatar alt={value.name} />
                </Tooltip>
              ))} */}
              {experiment.students.map((value, index) => (
                <MAvatar
                  key={"student_" + value.id}
                  user={value}
                  onKick={value.id == user.id ? undefined : onKick}
                />
              ))}
              {!experiment.students.length && <Avatar className="opacity-0" />}
            </Paper>
          </div>
          <div className="flex flex-col gap-2">
            <Typography component="p" variant="body1">
              Groups
            </Typography>
            <Box
              // variant="elevation"
              // square={false}
              className="flex flex-wrap gap-4"
            >
              {experiment.status == "waiting" && (
                <Paper
                  variant="outlined"
                  square={false}
                  className="flex gap-2 w-44 h-28 items-center justify-center"
                >
                  <Tooltip title="Create Group">
                    <IconButton
                      aria-label="Create Group"
                      color="primary"
                      onClick={() => experiment.addGroup()}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Paper>
              )}
              {experiment.groups.map((group) => (
                <Paper
                  key={"group_" + group.id}
                  variant="outlined"
                  square={false}
                  className="flex gap-2 p-2 w-44 h-28 items-start justify-center relative"
                >
                  {experiment.status == "waiting" && (
                    <Tooltip title="Delete">
                      <IconButton
                        aria-label="Delete"
                        color="primary"
                        className="absolute top-2 right-2 p-0"
                        size="small"
                        onClick={() => experiment.delGroup(group.id)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
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
                      {experiment.status == "waiting" && (
                        <>
                          <Tooltip
                            title="Join Group"
                            hidden={user.role == "teacher" || !!userGroup}
                          >
                            <IconButton
                              aria-label="Join Group"
                              color="primary"
                              size="medium"
                              onClick={() =>
                                experiment.joinGroup(group.id, {
                                  id: user.id!,
                                  name: user.name!,
                                  role: user.role!,
                                })
                              }
                            >
                              <LoginIcon fontSize="medium" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title="Leave Group"
                            hidden={
                              user.role == "teacher" ||
                              !userGroup ||
                              userGroup.id != group.id
                            }
                          >
                            <IconButton
                              aria-label="Leave Group"
                              color="primary"
                              size="medium"
                              onClick={() =>
                                experiment.leaveGroup(group.id, {
                                  id: user.id!,
                                  name: user.name!,
                                  role: user.role!,
                                })
                              }
                            >
                              <LogoutIcon fontSize="medium" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>
                </Paper>
              ))}
            </Box>
          </div>
          {experiment.status == "waiting" && (
            <Button
              color="primary"
              variant="contained"
              onClick={() => experiment.start()}
              fullWidth={false}
            >
              Mulai
            </Button>
          )}
        </Paper>
      </div>
    </Box>
  );
}
