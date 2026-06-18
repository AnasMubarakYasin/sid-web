"use client";

import {
  MouseEvent,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

import { styled, useTheme } from "@mui/material/styles";

import AppBar, { AppBarProps } from "@mui/material/AppBar";
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
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
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

import { useRouter } from "next/navigation";
import useMediaQuery from "@mui/material/useMediaQuery";

interface BarProps extends AppBarProps {
  open?: boolean;
}

const drawerWidth = 240;

const CustomAppBar = styled(AppBar, {
  shouldForwardProp: (prop: string) => !["position", "open"].includes(prop),
})<BarProps>(({ theme }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ position }) => position == "sticky",
      style: {
        width: `calc(100% - ${drawerWidth}px)`,
        height: "56px",
        background: "red",
      },
    },
    {
      props: ({ position, open }) => position == "fixed" && open,
      style: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: `${drawerWidth}px`,
        transition: theme.transitions.create(["margin", "width"], {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

export default function Topbar() {
  const { title, isSmallSize, openSideBar, setOpenSideBar } =
    useDashboardStore();
  const { name, authenticated } = useUserStore();

  const router = useRouter();
  //   const theme = useTheme();
  //   const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  //   const [open, setOpen] = useState(!isSmall);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleDrawerOpen = () => {
    setOpenSideBar(true);
  };
  const handleDrawerClose = () => {
    setOpenSideBar(false);
  };

  const handleOpenUserMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <CustomAppBar
      position={isSmallSize ? "static" : "fixed"}
      variant="outlined"
      color="inherit"
      open={openSideBar}
      elevation={4}
    >
      <Toolbar className="gap-4">
        {!authenticated && (
          <Skeleton variant="circular">
            <IconButton aria-label="Loading">
              <ChevronLeftIcon />
            </IconButton>
          </Skeleton>
        )}
        {authenticated && (
          <>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerClose}
              edge="start"
              sx={[!openSideBar && { display: "none" }]}
            >
              <MenuOpenIcon />
            </IconButton>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={[openSideBar && { display: "none" }]}
            >
              <MenuIcon />
            </IconButton>
          </>
        )}
        {!authenticated && (
          <div className="grow">
            <Skeleton variant="rounded">
              <Typography variant="h6" component="div">
                Loading Loading Loading
              </Typography>
            </Skeleton>
          </div>
        )}
        {authenticated && (
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
        )}
        <Box className="flex gap-2 grow-0">
          {authenticated && (
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar
                alt={name!}
                // src=""
                sx={{ width: 32, height: 32 }}
              />
            </IconButton>
          )}
          {!authenticated && (
            <Tooltip title="Open settings">
              <Skeleton variant="circular">
                <IconButton sx={{ p: 0 }}>
                  <Avatar alt={"Loading"} sx={{ width: 32, height: 32 }} />
                </IconButton>
              </Skeleton>
            </Tooltip>
          )}
          <Menu
            sx={{ mt: "45px" }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            {/* {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  <Typography sx={{ textAlign: "center" }}>
                    {setting}
                  </Typography>
                </MenuItem>
              ))} */}
            <MenuItem onClick={handleCloseUserMenu}>
              <Typography sx={{ textAlign: "center" }}>Profile</Typography>
            </MenuItem>
            <Divider />
            <MenuItem
              LinkComponent={NextLinkComposed}
              href="/sign-out"
              onClick={() => router.push("/sign-out")}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </CustomAppBar>
  );
}
