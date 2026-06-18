"use client";

import {
  MouseEvent,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

import { styled, useTheme } from "@mui/material/styles";

import { useUserStore } from "@/store/user";
import { useDashboardStore } from "@/store/dashboard";

import { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useMediaQuery from "@mui/material/useMediaQuery";

import { auth, authz } from "@/api/user";

let timeoutid: any;

export default function Effect() {
  const pathname = usePathname();
  const linkStatus = useLinkStatus();
  const router = useRouter();
  const theme = useTheme();

  const { setPath, setOpenSideBar, setIsSmallSize, setLoading, setToast } =
    useDashboardStore();
  const { token, authenticated, login } = useUserStore();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const isClient = useClient();

  useLayoutEffect(() => {
    setIsSmallSize(isSmall);
    setOpenSideBar(!isSmall);
  }, [isSmall]);
  useLayoutEffect(() => {
    setPath(new URL(pathname, location.origin).pathname);
  }, [pathname]);
  useLayoutEffect(() => {
    setLoading(linkStatus.pending);
  }, [linkStatus.pending]);
  useLayoutEffect(() => {
    if (!isClient) {
      return;
    }
    clearTimeout(timeoutid);
    if (token) {
      auth(token!)
        .then((res) => {
          login({
            id: res.data.id,
            name: res.data.name,
            role: res.data.role,
            token: token,
          });
        })
        .catch((err) => {
          console.error(err);
          setLoading(true);
          setToast({ level: "error", message: err.message });
          timeoutid = setTimeout(() => {
            router.replace("/sign-in");
          }, 1000);
        });
    } else {
      timeoutid = setTimeout(() => {
        setLoading(true);
        setToast({ level: "error", message: "unauthenticated" });
        router.replace("/sign-in");
      }, 1000);
    }
    return () => {
      clearTimeout(timeoutid);
    };
  }, [isClient]);
  useLayoutEffect(() => {
    if (!isClient) {
      return;
    }
    if (authenticated) {
      authz(token!, pathname).catch((err) => {
        console.error(err);
        setToast({ level: "error", message: err.message });
      });
    }
  }, [isClient, pathname]);

  return <></>;
}

function useClient() {
  const [state, setState] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(true);
  }, []);
  return state;
}
