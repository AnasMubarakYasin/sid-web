"use client";

import { styled } from "@mui/material/styles";

import Skeleton from "@mui/material/Skeleton";

import { useUserStore } from "@/store/user";
import { useDashboardStore } from "@/store/dashboard";

import { ReactNode } from "react";

interface Props {
  wide?: boolean;
  open?: boolean;
}

const drawerWidth = 240;

const CustomMain = styled("main", {
  shouldForwardProp: (prop: string) => !["wide", "open"].includes(prop),
})<Props>(({ theme }) => ({
  container: "main / size",
  width: "stretch",
  height: "stretch",
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ wide }) => wide,
      style: {
        padding: theme.spacing(2),
        marginTop: "58px",
      },
    },
    {
      props: ({ wide }) => !wide,
      style: {
        padding: theme.spacing(4),
        marginTop: "66px",
        marginLeft: `-${drawerWidth}px`,
      },
    },
    {
      props: ({ wide, open }) => !wide && open,
      style: {
        transition: theme.transitions.create("margin", {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
      },
    },
  ],
}));

export default function Main(props: { children: ReactNode }) {
  const { isSmallSize, openSideBar } = useDashboardStore();
  const { authorized } = useUserStore();

  return (
    <CustomMain wide={isSmallSize} open={openSideBar}>
      {!authorized && (
        <Skeleton variant="rounded" width="100%" height="100%"></Skeleton>
      )}
      {authorized && props.children}
    </CustomMain>
  );
}
