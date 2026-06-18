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
import CircularProgress from "@mui/material/CircularProgress";

import RefreshIcon from "@mui/icons-material/Refresh";
import MenuIcon from "@mui/icons-material/Menu";

import { useQuery } from "@tanstack/react-query";
import { list, setToken } from "@/api/subject";
import { collaboration } from "@/api/experiment";
import { useUserStore } from "@/store/user";
import { useDashboardStore } from "@/store/dashboard";
import { useExperimentStore } from "@/store/experiment";

import CCKAPI, {
  HandlerAPI,
} from "../../public/js/circuit-construction-kit-common/js/circuit-construction-kit-common-api";

const api = new CCKAPI(new HandlerAPI());

export default function Step3({ lab }: { lab: number }) {
  const dashboard = useDashboardStore();
  const experiment = useExperimentStore();
  const [enableSim, setEnableSim] = useState(false);
  const [erroredSim, setErroredSim] = useState(false);

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
    experiment.setStep(3, false);
  }, [lab]);
  useEffect(() => {
    setEnableSim(true);
    api.onOpen = () => {
      // setEnableSim(true);
      console.log("sim open");
    };
    api.onClose = () => {
      // setEnableSim(false);
      console.log("sim close");
    };
    api.handler.onStaged = (value: any) => {
      collaboration.publish("simulation", value);
    };
    api.handler.onCommited = (value: any) => {
      console.log("sim save", value);
      experiment.setSimulation(value.blob);
    };
    api.handler.onError = (error: any) => {
      dashboard.setToast({ level: "error", message: error.message });
    };
    api.open("circuit-construction-kit-dc");
    collaboration.subscribe("simulation", handler);
    return () => {
      collaboration.unsubscribe("simulation", handler);
      api.close();
    };
    function handler(value: any) {
      api.send({ call: "onStaged", payload: value });
    }
  }, []);
  useEffect(() => {
    api.handler.onReady = () => {
      // @ts-ignore
      window.sim = api;
      console.log("sim ready", experiment.simulation);
      api.send({
        call: "onLoad",
        payload: experiment.simulation,
      });
    };
    return () => {
      api.handler.onReady = null;
    };
  }, [experiment.simulation]);
  useEffect(() => {
    if (experiment.process == "synchronized") {
      if (experiment.oplog.endsWith("0")) {
        return;
      }
      if (experiment.oplog.startsWith("simulation")) {
        collaboration.sync({
          attr: "simulation",
          simulation: experiment.simulation,
        });
      }
      console.log("upstream", experiment.oplog);
    }
  }, [experiment.oplog]);
  // useEffect(() => {
  //   console.log("sim state", enableSim, erroredSim);
  // }, [enableSim, erroredSim]);

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
              Investigation Design
            </Typography>
            <Typography component="p" variant="body1">
              Uji hipotesismu dengan melakukan eksperimen pada simulasi berikut.
            </Typography>
          </header>
          <Paper
            variant="outlined"
            elevation={4}
            className="w-stretch md:w-182 h-80 md:h-122 p-1 flex items-center justify-center self-center"
          >
            {/* {!enableSim && !erroredSim && (
              <CircularProgress aria-label="Loading…" />
            )} */}
            {experiment.process != "synchronized" && (
              <Skeleton variant="rounded" width="100%" height="100%">
                <iframe
                  src="/simulation"
                  className="w-stretch h-stretch"
                ></iframe>
              </Skeleton>
            )}
            {erroredSim && experiment.process == "synchronized" && (
              <IconButton
                aria-label="refresh"
                className="self-center justify-center"
                color="primary"
                onClick={() => setErroredSim(false)}
              >
                <RefreshIcon fontSize="large" />
              </IconButton>
            )}
            {enableSim &&
              !erroredSim &&
              experiment.process == "synchronized" && (
                <iframe
                  src="/simulation"
                  // width={720}
                  // height={480}
                  // hidden={!enableSim}
                  allowFullScreen
                  className="w-stretch h-stretch"
                  onError={(event) => {
                    console.log("sim frame error", event);
                    setErroredSim(true);
                  }}
                ></iframe>
              )}
          </Paper>
        </Paper>
      </div>
    </Box>
  );
}
