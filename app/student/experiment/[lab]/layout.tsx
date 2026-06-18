"use client";

import { ReactNode, useEffect, useLayoutEffect } from "react";

import { useRouter } from "next/navigation";

import SideNav from "@/layout/experiment/sidenav";
import NavBar from "@/layout/experiment/navbar";
// import Lobby from "@/layout/experiment/lobby";

import { useExperimentStore } from "@/store/experiment";

import { setToken as setTokenSubject } from "@/api/subject";
import {
  setToken as setTokenExperiment,
  collaboration,
  get,
} from "@/api/experiment";
import { useUserStore } from "@/store/user";

import { playJoinSound, playLeaveSound, playRoomDeletedSound } from "@/lib/sfx";
import { useDashboardStore } from "@/store/dashboard";

export default function Layout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = useUserStore();
  const experiment = useExperimentStore();
  const dashboard = useDashboardStore();
  const router = useRouter();
  useLayoutEffect(() => {
    setTokenSubject(user.token!);
    setTokenExperiment(user.token!);
    return () => {
      setTokenSubject("");
      setTokenExperiment("");
    };
  }, [user.token]);
  useLayoutEffect(() => {
    if (!experiment.lab) {
      return;
    }
    collaboration.onConnected = () => {
      experiment.setProcess("connected");
      dashboard.setToast({ level: "success", message: "Connected" });
    };
    collaboration.onDisconnected = () => {
      experiment.setProcess("disconnected");
      dashboard.setToast({ level: "error", message: "Disonnected" });
    };
    collaboration.onRetry = () => {
      experiment.setProcess("connecting");
      dashboard.setToast({ level: "warning", message: "Reconnecting" });
      get({ id: experiment.lab! }).then((value) => {
        if (!value.data) {
          collaboration.retry = false;
          dashboard.setToast({
            level: "error",
            message: "Experiment not exists",
          });
          router.replace("/student/experiment");
        }
      });
    };
    collaboration.onJoin = (data) => {
      if (user.id == data.id) {
        return;
      }
      experiment.join(data);
      playJoinSound();
    };
    collaboration.onLeave = (data) => {
      if (user.id == data.id) {
        return;
      }
      experiment.leave(data);
      playLeaveSound();
    };
    collaboration.onKick = (data) => {
      dashboard.setToast({
        level: "warning",
        message: "You was kicked",
      });
      router.replace("/student/experiment");
    };
    collaboration.onDestroy = () => {
      playRoomDeletedSound();
      router.replace("/student/experiment");
    };
    collaboration.onSync = (data) => {
      // console.log("[sync]", data);
      experiment.sync(data);
    };
    collaboration.onFailed = (data) => {
      // console.log("[failed]", data);
      dashboard.setToast({
        level: "error",
        message: data.error.message,
      });
      if (data.error.code == "UNAUTHORIZED") {
        router.replace("/student/experiment");
      }
      if (data.attr == "subject") {
        experiment.setSubjectUSync(data.subject!);
      }
      if (data.attr == "status") {
        if (data.status == "waiting") {
          experiment.wait();
        } else {
          experiment.setStatusUSync(data.status!);
        }
      }
      // if (data.type == "sync") {}
    };
    collaboration.lab = experiment.lab;
    collaboration.retry = true;
    collaboration.connect();
    collaboration.subscribe("refresh", refresh);
    window.addEventListener("beforeunload", unload);
    return () => {
      window.removeEventListener("beforeunload", unload);
      collaboration.unsubscribe("refresh", refresh);
      collaboration.disconnect();
    };
    function refresh() {
      window.removeEventListener("beforeunload", unload);
      location.reload();
    }
    function unload(event: BeforeUnloadEvent) {
      // event.preventDefault();
      collaboration.publish("refresh", {});
    }
  }, [experiment.lab]);
  useEffect(() => {
    // @ts-ignore
    window.experiment = experiment;
    return () => {
      experiment.reset();
    };
  }, []);
  useEffect(() => {
    if (!experiment.lab || !experiment.stepping) {
      return;
    }
    // console.log({ ...experiment });
    // console.log("step", experiment.step);
    if ([1, 2, 3, 4, 5, 6].includes(experiment.step)) {
      router.push(
        `/student/experiment/${experiment.lab}/step-${experiment.step}`,
      );
    } else {
      router.push("/student/experiment/" + experiment.lab);
    }
  }, [experiment.lab, experiment.step, experiment.stepping]);
  useEffect(() => {
    console.log("process", experiment.process)
  }, [experiment.process]);

  return (
    <div className="flex flex-col gap-6  max-sm:gap-3">
      <SideNav />
      {/* <Lobby /> */}
      {/* <div hidden={!store.lobby}>{children}</div> */}
      {children}
      <NavBar />
      <div></div>
    </div>
  );
}
