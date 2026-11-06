"use client";

import { useEffect, useLayoutEffect, useState } from "react";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Icon from "@mui/material/Icon";

import ScienceIcon from "@mui/icons-material/Science";
import SummarizeIcon from "@mui/icons-material/Summarize";
import MenuBookIcon from "@mui/icons-material/MenuBook";

import { useDashboardStore } from "@/store/dashboard";
import { useUserStore } from "@/store/user";

import { setToken, event, Stat } from "@/api/resource";

export default function Page() {
  const user = useUserStore();
  const dashboard = useDashboardStore();

  const [stat, setStat] = useState<Stat>({
    experiment: 0,
    report: 0,
    subject: 0,
  });

  useEffect(() => {
    dashboard.setTitle("Dashboard");
    dashboard.setLoading(false);
  }, []);

  useLayoutEffect(() => {
    setToken(user.token!);
    return () => setToken("");
  }, [user.token]);
  useLayoutEffect(() => {
    event.onStat = (data) => {
      setStat(data);
    };
    event.connect().catch((error) => {
      dashboard.setToast({ level: "error", message: error.message });
    });
    return () => {
      event.disconnect();
    };
  }, []);

  return <Box className="grid grid-cols-4 gap-4 max-sm:p-1">
      <Paper
        variant="outlined"
        elevation={4}
        className="w-stretch flex gap-4 p-4 items-center"
      >
        <Icon className="grid place-content-center" sx={{ fontSize: 44 }}>
          <ScienceIcon sx={{ fontSize: 44 }} />
        </Icon>
        <div className="grid">
          <Typography component="h3" variant="overline">
            Experiment
          </Typography>
          <Typography component="h3" variant="body1">
            {stat.experiment}
          </Typography>
        </div>
      </Paper>
      <Paper
        variant="outlined"
        elevation={4}
        className="w-stretch flex gap-4 p-4 items-center"
      >
        <Icon className="grid place-content-center" sx={{ fontSize: 44 }}>
          <SummarizeIcon sx={{ fontSize: 44 }} />
        </Icon>
        <div className="grid">
          <Typography component="h3" variant="overline">
            Report
          </Typography>
          <Typography component="h3" variant="body1">
            {stat.report}
          </Typography>
        </div>
      </Paper>
    </Box>;
}
