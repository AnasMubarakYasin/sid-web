import { ReactNode } from "react";

import Container from "@mui/material/Container";

import Effect from "@/layout/panel/effect";
import Loader from "@/layout/panel/loader";
import Toaster from "@/layout/panel/toaster";
import TopBar from "@/layout/panel/topbar";
import SideBar from "@/layout/panel/sidebar";
import Main from "@/layout/panel/main";

export default function Layout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Container
      maxWidth="xl"
      className="flex text-gray-950 bg-blue-50 dark:text-white dark:bg-mist-950 max-w-dvw min-h-dvh p-0"
    >
      <Effect />
      <Loader />
      <Toaster />
      <TopBar />
      <SideBar />
      <Main>{children}</Main>
    </Container>
  );
}

// "use client";

// import { ReactNode, useEffect, useLayoutEffect, useState } from "react";

// import { useRouter } from "next/navigation";
// import { useDashboardStore, useDashboardState } from "@/store/dashboard";

// import { styled, useTheme } from "@mui/material/styles";
// import CssBaseline from "@mui/material/CssBaseline";
// import Box from "@mui/material/Box";
// import Drawer from "@mui/material/Drawer";
// import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
// import Toolbar from "@mui/material/Toolbar";
// import List from "@mui/material/List";
// import Typography from "@mui/material/Typography";
// import Divider from "@mui/material/Divider";
// import IconButton from "@mui/material/IconButton";
// import ListItem from "@mui/material/ListItem";
// import ListItemButton from "@mui/material/ListItemButton";
// import ListItemIcon from "@mui/material/ListItemIcon";
// import ListItemText from "@mui/material/ListItemText";
// import Skeleton from "@mui/material/Skeleton";
// import Avatar from "@mui/material/Avatar";
// import Container from "@mui/material/Container";
// import Menu from "@mui/material/Menu";
// import MenuItem from "@mui/material/MenuItem";
// import Tooltip from "@mui/material/Tooltip";
// import LinearProgress from "@mui/material/LinearProgress";
// import Snackbar from "@mui/material/Snackbar";
// import Alert from "@mui/material/Alert";

// // import InboxIcon from "@mui/icons-material/MoveToInbox";
// // import MailIcon from "@mui/icons-material/Mail";
// import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
// import ChevronRightIcon from "@mui/icons-material/ChevronRight";
// import MenuIcon from "@mui/icons-material/Menu";
// import DashboardIcon from "@mui/icons-material/Dashboard";
// import ScienceIcon from "@mui/icons-material/Science";
// import LightbulbIcon from "@mui/icons-material/Lightbulb";
// import LogoutIcon from "@mui/icons-material/Logout";
// import ImportContactsIcon from "@mui/icons-material/ImportContacts";
// // import LightModeIcon from "@mui/icons-material/LightMode";
// // import DarkModeIcon from "@mui/icons-material/DarkMode";

// import { usePathname } from "next/navigation";
// import { NextLinkComposed } from "@/component/link";
// import { useUserStore } from "@/store/user";
// import useMediaQuery from "@mui/material/useMediaQuery";

// import Toaster from "@/layout/panel/toaster";
// import Loader from "@/layout/panel/loader";
// import { useLinkStatus } from "next/link";

// import { auth, nav } from "@/api/user";

// const drawerWidth = 240;

// interface AppBarProps extends MuiAppBarProps {
//   open?: boolean;
// }

// const AppBar = styled(MuiAppBar, {
//   // shouldForwardProp: (prop) => prop !== "open",
//   shouldForwardProp: (prop) => !["position", "open"].includes(prop),
// })<AppBarProps>(({ theme }) => ({
//   transition: theme.transitions.create(["margin", "width"], {
//     easing: theme.transitions.easing.sharp,
//     duration: theme.transitions.duration.leavingScreen,
//   }),
//   variants: [
//     {
//       props: ({ position }) => position == "sticky",
//       style: {
//         width: `calc(100% - ${drawerWidth}px)`,
//         height: "56px",
//         background: "red",
//       },
//     },
//     {
//       // props: ({ position, open }) => open,
//       props: ({ position, open }) => position == "fixed" && open,
//       style: {
//         width: `calc(100% - ${drawerWidth}px)`,
//         marginLeft: `${drawerWidth}px`,
//         transition: theme.transitions.create(["margin", "width"], {
//           easing: theme.transitions.easing.easeOut,
//           duration: theme.transitions.duration.enteringScreen,
//         }),
//       },
//     },
//   ],
// }));

// const DrawerHeader = styled("header")(({ theme }) => ({
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "center",
//   padding: theme.spacing(1),
//   ...theme.mixins.toolbar,
// }));

// const Main = styled("main", {
//   shouldForwardProp: (prop) => !["wide", "open"].includes(prop),
// })<{
//   wide?: string;
//   open?: boolean;
// }>(({ theme }) => ({
//   container: "main / size",
//   width: "stretch",
//   height: "stretch",
//   transition: theme.transitions.create("margin", {
//     easing: theme.transitions.easing.sharp,
//     duration: theme.transitions.duration.leavingScreen,
//   }),
//   variants: [
//     {
//       props: ({ wide }) => wide,
//       style: {
//         padding: theme.spacing(2),
//         marginTop: "58px",
//       },
//     },
//     {
//       props: ({ wide }) => !wide,
//       style: {
//         padding: theme.spacing(4),
//         marginTop: "66px",
//         marginLeft: `-${drawerWidth}px`,
//       },
//     },
//     {
//       props: ({ wide, open }) => !wide && open,
//       style: {
//         transition: theme.transitions.create("margin", {
//           easing: theme.transitions.easing.easeOut,
//           duration: theme.transitions.duration.enteringScreen,
//         }),
//         marginLeft: 0,
//       },
//     },
//   ],
// }));

// let timeoutid: any;

// function useClient() {
//   const [state, setState] = useState(false);
//   useEffect(() => {
//     // eslint-disable-next-line react-hooks/set-state-in-effect
//     setState(true);
//   }, []);
//   return state;
// }

// export default function Layout({
//   children,
// }: Readonly<{
//   children: ReactNode;
// }>) {
//   const router = useRouter();
//   const {
//     title,
//     path,
//     loading,
//     toasting,
//     toast,
//     setPath,
//     setLoading,
//     setToasting,
//     setToast,
//   } = useDashboardStore();
//   const { name, token, login } = useUserStore();

//   const pathname = usePathname();
//   const linkStatus = useLinkStatus();
//   const theme = useTheme();
//   const isClient = useClient();
//   const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
//   const [open, setOpen] = useState(!isSmall);
//   const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

//   // console.log(theme.breakpoints.down("sm"));

//   // const { title, path, loading, setTitle, setPath, setLoading } =
//   //   useDashboardState({
//   //     path: pathname,
//   //     title: "Dashboard",
//   //     loading: true,
//   //   });

//   const handleDrawerOpen = () => {
//     setOpen(true);
//   };

//   const handleDrawerClose = () => {
//     setOpen(false);
//   };

//   const handleOpenUserMenu = (event: MouseEvent<HTMLElement>) => {
//     setAnchorElUser(event.currentTarget);
//   };

//   const handleCloseUserMenu = () => {
//     setAnchorElUser(null);
//   };

//   useLayoutEffect(() => {
//     setPath(new URL(pathname, location.origin).pathname);
//     if (token) {
//       nav(token, pathname).catch((err) =>
//         setToast({ level: "error", text: err.message }),
//       );
//     }
//   }, [pathname, token]);
//   useLayoutEffect(() => {
//     setLoading(linkStatus.pending);
//   }, [linkStatus.pending]);

//   // useLayoutEffect(() => {
//   //   console.log("path: ", path);
//   //   if (path == "/student") {
//   //     setTitle("Dashboard");
//   //   }
//   // }, [path]);

//   useEffect(() => {
//     // console.log("token: ", !!token)
//     // console.log("client: ", isClient);
//     if (!isClient) {
//       return;
//     }
//     clearTimeout(timeoutid);
//     if (token) {
//       auth(token)
//         .then((res) => {
//           login(res.data.name, token);
//         })
//         .catch((err) => {
//           setToast({ level: "error", text: err.message });
//           timeoutid = setTimeout(() => {
//             router.replace("/sign-in");
//           }, 1000);
//         });
//     } else {
//       timeoutid = setTimeout(() => {
//         router.replace("/sign-in");
//       }, 1000);
//     }
//     return () => {
//       clearTimeout(timeoutid);
//     };
//   }, [isClient, token]);

//   // if (!isClient || !token) {
//   //   return (
//   //     <Container
//   //       maxWidth="xl"
//   //       sx={{ display: "flex" }}
//   //       className="text-gray-950 bg-blue-50 dark:text-white dark:bg-mist-950 max-w-dvw min-h-dvh items-center justify-center"
//   //     >
//   //       <LinearProgress
//   //         aria-label="Loading…"
//   //         className="absolute top-0 left-0 z-2000 w-full"
//   //       />
//   //       {/* {!token ? "Unauthorized" : "Loading"} */}
//   //       Loading
//   //     </Container>
//   //   );
//   // }

//   console.log("render");

//   return (
//     <Container
//       maxWidth="xl"
//       // sx={{ display: "flex" }}
//       // inert={loading}
//       className="flex text-gray-950 bg-blue-50 dark:text-white dark:bg-mist-950 max-w-dvw min-h-dvh p-0"
//     >
//       {/* {loading && (
//         <LinearProgress
//           aria-label="Loading…"
//           className="absolute top-0 left-0 z-2000 w-full"
//         />
//       )} */}
//       <Loader />
//       <Toaster />
//       {/* <CssBaseline /> */}
//       <AppBar
//         // position="fixed"
//         position={isSmall ? "static" : "fixed"}
//         variant="outlined"
//         color="inherit"
//         open={open}
//         elevation={4}
//       >
//         <Toolbar className="gap-4">
//           {!token && (
//             <Skeleton variant="circular">
//               <IconButton aria-label="Loading">
//                 <ChevronLeftIcon />
//               </IconButton>
//             </Skeleton>
//           )}
//           {token && (
//             <>
//               <IconButton
//                 color="inherit"
//                 aria-label="open drawer"
//                 onClick={handleDrawerClose}
//                 edge="start"
//                 sx={[!open && { display: "none" }]}
//               >
//                 <ChevronLeftIcon />
//               </IconButton>
//               <IconButton
//                 color="inherit"
//                 aria-label="open drawer"
//                 onClick={handleDrawerOpen}
//                 edge="start"
//                 sx={[open && { display: "none" }]}
//               >
//                 <MenuIcon />
//               </IconButton>
//             </>
//           )}
//           {!token && (
//             <div className="grow">
//               <Skeleton variant="rounded">
//                 <Typography variant="h6" component="div">
//                   Loading Loading Loading
//                 </Typography>
//               </Skeleton>
//             </div>
//           )}
//           {token && (
//             <Typography
//               variant="h6"
//               noWrap
//               component="div"
//               sx={{ flexGrow: 1 }}
//             >
//               {title}
//             </Typography>
//           )}
//           <Box className="flex gap-2 grow-0">
//             <Tooltip title="Open settings">
//               {token && (
//                 <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
//                   <Avatar
//                     alt={name}
//                     src="/static/images/avatar/2.jpg"
//                     sx={{ width: 32, height: 32 }}
//                   />
//                 </IconButton>
//               )}
//               {!token && (
//                 <Skeleton variant="circular">
//                   <IconButton sx={{ p: 0 }}>
//                     <Avatar alt={"Loading"} sx={{ width: 32, height: 32 }} />
//                   </IconButton>
//                 </Skeleton>
//               )}
//             </Tooltip>
//             <Menu
//               sx={{ mt: "45px" }}
//               id="menu-appbar"
//               anchorEl={anchorElUser}
//               anchorOrigin={{
//                 vertical: "top",
//                 horizontal: "right",
//               }}
//               keepMounted
//               transformOrigin={{
//                 vertical: "top",
//                 horizontal: "right",
//               }}
//               open={Boolean(anchorElUser)}
//               onClose={handleCloseUserMenu}
//             >
//               {/* {settings.map((setting) => (
//                 <MenuItem key={setting} onClick={handleCloseUserMenu}>
//                   <Typography sx={{ textAlign: "center" }}>
//                     {setting}
//                   </Typography>
//                 </MenuItem>
//               ))} */}
//               <MenuItem onClick={handleCloseUserMenu}>
//                 <Typography sx={{ textAlign: "center" }}>Profile</Typography>
//               </MenuItem>
//               <Divider />
//               <MenuItem
//                 LinkComponent={NextLinkComposed}
//                 href="/sign-out"
//                 onClick={() => router.push("/sign-out")}
//               >
//                 <ListItemIcon>
//                   <LogoutIcon fontSize="small" />
//                 </ListItemIcon>
//                 <ListItemText>Logout</ListItemText>
//               </MenuItem>
//             </Menu>
//           </Box>
//         </Toolbar>
//       </AppBar>
//       <Drawer
//         sx={{
//           width: drawerWidth,
//           flexShrink: 0,
//           "& .MuiDrawer-paper": {
//             width: drawerWidth,
//             boxSizing: "border-box",
//           },
//         }}
//         variant={isSmall ? "temporary" : "persistent"}
//         anchor="left"
//         open={open}
//         onClose={() => setOpen(false)}
//         component="aside"
//         slotProps={{
//           paper: { component: "nav", variant: "outlined", elevation: 4 },
//         }}
//       >
//         <DrawerHeader>
//           {!token && (
//             <Skeleton variant="rounded" width="80%">
//               <Typography
//                 component="div"
//                 sx={{ fontSize: 18, fontWeight: "bold" }}
//               >
//                 Loading
//               </Typography>
//             </Skeleton>
//           )}
//           {token && (
//             <>
//               <Typography
//                 component="div"
//                 sx={{ fontSize: 18, fontWeight: "bold" }}
//               >
//                 {process.env.NEXT_PUBLIC_APP_NAME}
//               </Typography>
//             </>
//           )}
//         </DrawerHeader>
//         <Divider />
//         {!token && (
//           <List>
//             {["Loading", "Loading", "Loading"].map((text, index) => (
//               <ListItem key={index}>
//                 <ListItemButton>
//                   <ListItemIcon>
//                     <Skeleton variant="circular">
//                       <DashboardIcon />
//                     </Skeleton>
//                   </ListItemIcon>
//                   <ListItemText
//                     primary={
//                       <Skeleton variant="rounded" width="100%"></Skeleton>
//                     }
//                   />
//                 </ListItemButton>
//               </ListItem>
//             ))}
//           </List>
//         )}
//         {token && (
//           <>
//             <List>
//               <ListItem disablePadding>
//                 <ListItemButton
//                   LinkComponent={NextLinkComposed}
//                   href="/student"
//                   selected={path == "/student"}
//                 >
//                   <ListItemIcon>
//                     <DashboardIcon />
//                   </ListItemIcon>
//                   <ListItemText primary={"Dashboard"} />
//                 </ListItemButton>
//               </ListItem>
//               <ListItem disablePadding>
//                 <ListItemButton
//                   LinkComponent={NextLinkComposed}
//                   href="/student/experiment"
//                   selected={path == "/student/experiment"}
//                 >
//                   <ListItemIcon>
//                     <ScienceIcon />
//                   </ListItemIcon>
//                   <ListItemText primary={"Experiment"} />
//                 </ListItemButton>
//               </ListItem>
//               <ListItem disablePadding>
//                 <ListItemButton
//                   LinkComponent={NextLinkComposed}
//                   href="/student/discoveries"
//                   selected={path == "/student/discoveries"}
//                 >
//                   <ListItemIcon>
//                     <LightbulbIcon />
//                   </ListItemIcon>
//                   <ListItemText primary={"Discoveries"} />
//                 </ListItemButton>
//               </ListItem>
//               <ListItem disablePadding>
//                 <ListItemButton
//                   LinkComponent={NextLinkComposed}
//                   href="/student/subject"
//                   selected={path == "/student/subject"}
//                 >
//                   <ListItemIcon>
//                     <ImportContactsIcon />
//                   </ListItemIcon>
//                   <ListItemText primary={"Subject"} />
//                 </ListItemButton>
//               </ListItem>
//             </List>
//           </>
//         )}
//       </Drawer>
//       <Main wide={isSmall} open={open}>
//         {!token && (
//           <Skeleton variant="rounded" width="100%" height="100%"></Skeleton>
//         )}
//         {token && children}
//       </Main>
//     </Container>
//   );
// }
