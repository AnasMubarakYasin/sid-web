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
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import CardActionArea from "@mui/material/CardActionArea";
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

import { NextLinkComposed } from "@/component/link";

export default function Page() {
  const router = useRouter();
  const user = useUserStore();
  const dashboard = useDashboardStore();
  const experiment = useExperimentStore();
  const query = useQuery({
    queryKey: ["experiments"],
    queryFn: list,
  });

  useLayoutEffect(() => {
    dashboard.setTitle("Discoveries");
    dashboard.setLoading(false);
  }, []);
  useLayoutEffect(() => {
    setToken(user.token!);
    return () => setToken("");
  }, [user.token]);
  useLayoutEffect(() => {
    event.onCreate = () => {
      query.refetch();
    };
    event.onDelete = () => {
      query.refetch();
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

  console.log(query.data?.data);

  return (
    <div className="w-container flex flex-col max-sm:justify-evenly gap-8">
      {query.isPending &&
        [, 1, 2, 3, 4, 5, 6].map((v, i) => (
          <Card key={"experiment_l_" + i} elevation={4} variant="outlined">
            <CardContent>
              <Skeleton variant="text">
                <Typography variant="h5" component="h2" gutterBottom>
                  Loading
                </Typography>
              </Skeleton>
              <Skeleton variant="text">
                <Typography variant="body1" component="p">
                  Loading Loading Loading
                </Typography>
              </Skeleton>
            </CardContent>
          </Card>
        ))}
      {query.isSuccess &&
        query.data.data!.map((item: Experiment) => (
          <Card key={"experiment_" + item.id} elevation={4} variant="outlined">
            <CardActionArea
              LinkComponent={NextLinkComposed}
              href={"/student/discoveries/" + item.id}
            >
              {/* <CardMedia
            component="img"
            height="140"
            image="/static/images/cards/contemplative-reptile.jpg"
            alt="green iguana"
          /> */}
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  {item.title || "Experiment " + item.id}
                </Typography>
                <Typography variant="body1" component="p">
                  {item.description || "-"}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
    </div>
  );
}
