"use client";

import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";

import SyncIcon from "@mui/icons-material/Sync";
import RefreshIcon from "@mui/icons-material/Refresh";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import { useExperimentStore } from "@/store/experiment";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { collaboration, get, removeLab } from "@/api/experiment";
import { useDashboardStore } from "@/store/dashboard";
import { useState } from "react";

export default function NavBar() {
  const dashboard = useDashboardStore();
  const experiment = useExperimentStore();
  const router = useRouter();
  // const [step, setStep] = useState(0);
  // const query = useQuery({
  //   queryKey: ["experiment", experiment.lab],
  //   queryFn: ({ queryKey: [_, id] }) => get({ id: id as number }),
  //   enabled: false,
  //   gcTime: 0,
  // });
  const mutation = useMutation({
    mutationFn: removeLab,
    onSuccess(result) {
      router.replace("/student/experiment");
    },
    onError(error) {
      dashboard.setToast({
        level: "error",
        message: error.message,
      });
    },
  });

  return (
    <Paper
      variant="outlined"
      elevation={4}
      className="flex gap-2 p-2 max-sm:gap-1 max-sm:p-1"
      // hidde={!store.statns=="started"}
    >
      <Tooltip title="Leave">
        <IconButton
          aria-label="Leave"
          color="primary"
          onClick={() => router.replace("/student/experiment")}
        >
          <LogoutIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Sync">
        <IconButton
          aria-label="Sync"
          color="primary"
          onClick={() => {
            // console.log("refresh", experiment);
            collaboration.disconnect();
            collaboration.connect();
          }}
        >
          <SyncIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete Lab">
        <IconButton
          aria-label="Delete Lab"
          color="primary"
          disabled={mutation.isPending || mutation.isSuccess}
          onClick={() =>
            experiment.lab && mutation.mutate({ id: experiment.lab })
          }
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>

      <div className="grow"></div>
      <Tooltip title="Lobby">
        <IconButton
          aria-label="Lobby"
          color="primary"
          hidden={experiment.status != "started"}
          disabled={experiment.step == 0}
          // onClick={store.toggleLobby}
          onClick={() => experiment.setStep(0)}
        >
          <HomeIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Previous">
        <IconButton
          aria-label="Previous"
          color="primary"
          hidden={experiment.status != "started"}
          disabled={experiment.step - 1 < 1}
          onClick={() => experiment.setStep(experiment.step - 1)}
          // onClick={() => setStep(step - 1)}
        >
          <ChevronLeftIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Next">
        <IconButton
          aria-label="Next"
          color="primary"
          hidden={experiment.status != "started"}
          disabled={experiment.step + 1 > 7}
          onClick={() => experiment.setStep(experiment.step + 1)}
          // onClick={() => setStep(step + 1)}
        >
          <ChevronRightIcon />
        </IconButton>
      </Tooltip>

      {/* <Button
        variant="text"
        disabled={store.step - 1 < 1}
        onClick={() => store.setStep(store.step - 1)}
      >
        Sebelumnya
      </Button>
      <Button
        variant="text"
        disabled={store.step + 1 > 7}
        onClick={() => store.setStep(store.step + 1)}
      >
        Selanjutnya
      </Button> */}
      <Tooltip title="Open Menu">
        <IconButton
          aria-label="open menu steps"
          color="primary"
          hidden={experiment.status != "started"}
          onClick={() => experiment.setOpenSideNav(!experiment.openSideNav)}
        >
          <MenuIcon />
        </IconButton>
      </Tooltip>
    </Paper>
  );
}
