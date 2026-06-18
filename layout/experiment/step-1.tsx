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

import MediaPlayer from "@/component/media-player-v2";
import TextList from "@/component/text-list";
import TextEditor from "@/component/text-editor-v3";
import Spreadsheet from "@/component/spreadsheet";
import "@/component/text-editor.css";

import RefreshIcon from "@mui/icons-material/Refresh";
import MenuIcon from "@mui/icons-material/Menu";

import { useDashboardStore } from "@/store/dashboard";
import { list, setToken } from "@/api/subject";
import { useQuery } from "@tanstack/react-query";
import { useExperimentStore } from "@/store/experiment";
import { useUserStore } from "@/store/user";

export default function Step1({ lab }: { lab: number }) {
  const dashboard = useDashboardStore();
  const experiment = useExperimentStore();

  useLayoutEffect(() => {
    dashboard.setTitle("Experiment");
    dashboard.setLoading(false);
  }, []);
  useEffect(() => {
    if (lab == experiment.lab) {
      return;
    }
    experiment.setLab(lab);
    experiment.setStep(1, false);
  }, [lab]);

  return (
    <div className="w-container h-stretch">
      <div className="flex flex-col gap-4 max-sm:p-1">
        <Paper
          variant="outlined"
          elevation={4}
          className="w-stretch flex flex-col gap-6 p-8 max-sm:p-4 self-center justify-center"
        >
          <header className="flex flex-col gap-2">
            <Typography component="h2" variant="h5">
              Phenomenon Orientation
            </Typography>
            <Typography component="p" variant="body1">
              Amati fenomena berikut dengan seksama.
            </Typography>
          </header>
          <Paper
            variant="outlined"
            elevation={4}
            className="w-stretch md:w-182 p-1 self-center justify-center aspect-video"
          >
            {experiment.subject && (
              <MediaPlayer
                className="w-full h-full"
                src={experiment.subject.video}
              />
            )}
          </Paper>
        </Paper>
      </div>
    </div>
  );
}
