"use client";

import { MouseEvent, ReactNode, useEffect, useLayoutEffect } from "react";

import { styled, useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Skeleton from "@mui/material/Skeleton";
import Avatar from "@mui/material/Avatar";
import Container from "@mui/material/Container";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import LinearProgress from "@mui/material/LinearProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// import InboxIcon from "@mui/icons-material/MoveToInbox";
// import MailIcon from "@mui/icons-material/Mail";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ScienceIcon from "@mui/icons-material/Science";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import LogoutIcon from "@mui/icons-material/Logout";
import ImportContactsIcon from "@mui/icons-material/ImportContacts";
// import LightModeIcon from "@mui/icons-material/LightMode";
// import DarkModeIcon from "@mui/icons-material/DarkMode";

import { NextLinkComposed } from "@/component/link";
import { useUserStore } from "@/store/user";
import { useDashboardStore } from "@/store/dashboard";

const DrawerHeader = styled("header")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(1),
  ...theme.mixins.toolbar,
}));

const drawerWidth = 240;

export default function Sidebar() {
  const { path, isSmallSize, openSideBar, setOpenSideBar } =
    useDashboardStore();
  const { authenticated } = useUserStore();

  //   const theme = useTheme();
  //   const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  //   const [open, setOpen] = useState(!isSmall);

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
      variant={isSmallSize ? "temporary" : "persistent"}
      anchor="left"
      open={openSideBar}
      onClose={() => setOpenSideBar(false)}
      component="aside"
      slotProps={{
        paper: { component: "nav", variant: "outlined", elevation: 4 },
      }}
    >
      <DrawerHeader>
        {!authenticated && (
          <Skeleton variant="rounded" width="80%">
            <Typography
              component="div"
              sx={{ fontSize: 18, fontWeight: "bold" }}
            >
              Loading
            </Typography>
          </Skeleton>
        )}
        {authenticated && (
          <>
            <Typography
              component="div"
              sx={{ fontSize: 18, fontWeight: "bold" }}
            >
              {process.env.NEXT_PUBLIC_APP_NAME}
            </Typography>
          </>
        )}
      </DrawerHeader>
      <Divider />
      {!authenticated && (
        <List>
          {["Loading", "Loading", "Loading"].map((text, index) => (
            <ListItem key={index}>
              <ListItemButton inert>
                <ListItemIcon>
                  <Skeleton variant="circular">
                    <DashboardIcon />
                  </Skeleton>
                </ListItemIcon>
                <ListItemText
                  primary={<Skeleton variant="rounded" width="100%"></Skeleton>}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
      {authenticated && (
        <>
          <List>
            <ListItem disablePadding>
              <ListItemButton
                LinkComponent={NextLinkComposed}
                href="/student"
                selected={path == "/student"}
              >
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary={"Dashboard"} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                LinkComponent={NextLinkComposed}
                href="/student/experiment"
                selected={path == "/student/experiment"}
              >
                <ListItemIcon>
                  <ScienceIcon />
                </ListItemIcon>
                <ListItemText primary={"Experiment"} />
              </ListItemButton>
            </ListItem>
            {/* <ListItem disablePadding>
              <ListItemButton
                LinkComponent={NextLinkComposed}
                href="/student/discoveries"
                selected={path == "/student/discoveries"}
              >
                <ListItemIcon>
                  <LightbulbIcon />
                </ListItemIcon>
                <ListItemText primary={"Discoveries"} />
              </ListItemButton>
            </ListItem> */}
            <ListItem disablePadding>
              <ListItemButton
                LinkComponent={NextLinkComposed}
                href="/student/subject"
                selected={path == "/student/subject"}
              >
                <ListItemIcon>
                  <ImportContactsIcon />
                </ListItemIcon>
                <ListItemText primary={"Subject"} />
              </ListItemButton>
            </ListItem>
          </List>
        </>
      )}
    </Drawer>
  );
}
