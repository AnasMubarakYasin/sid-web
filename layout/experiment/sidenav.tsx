"use client";

import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";

import { useExperimentStore } from "@/store/experiment";
import { useRouter } from "next/navigation";

export default function SideNav() {
  const store = useExperimentStore();
  const router = useRouter();

  return (
    <Drawer
      anchor="right"
      variant="temporary"
      open={store.openSideNav}
      onClose={() => store.setOpenSideNav(false)}
      component="aside"
    >
      <header className="h-16 flex items-center justify-center">
        <Typography component="div" className="text-lg">
          Inquiry Steps
        </Typography>
      </header>
      <Divider />
      <List>
        {/* <ListItem disablePadding>
          <ListItemButton selected={store.step == 0} onClick={() => store.setStep(0)}>
            <ListItemText primary={"Lobby"} />
          </ListItemButton>
        </ListItem> */}
        <ListItem disablePadding>
          <ListItemButton
            selected={store.step == 1}
            onClick={() => {
              store.setStep(1);
              // router.push("/student/experiment/" + store.lab + "/step-" + 1);
            }}
          >
            <ListItemText primary={"1. Phenomenon Orientation"} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            selected={store.step == 2}
            onClick={() => {
              store.setStep(2);
              // router.push("/student/experiment/" + store.lab + "/step-" + 2);
            }}
          >
            <ListItemText primary={"2. Question Formulation"} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            selected={store.step == 3}
            onClick={() => {
              store.setStep(3);
              // router.push("/student/experiment/" + store.lab + "/step-" + 3);
            }}
          >
            <ListItemText primary={"3. Investigation Design"} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            selected={store.step == 4}
            onClick={() => {
              store.setStep(4);
              // router.push("/student/experiment/" + store.lab + "/step-" + 4);
            }}
          >
            <ListItemText primary={"4. Data Collection and Analisys"} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            selected={store.step == 5}
            onClick={() => {
              store.setStep(5);
              // router.push("/student/experiment/" + store.lab + "/step-" + 5);
            }}
          >
            <ListItemText primary={"5. Explanation Construction"} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            selected={store.step == 6}
            onClick={() => {
              store.setStep(6);
              // router.push("/student/experiment/" + store.lab + "/step-" + 6);
            }}
          >
            <ListItemText primary={"6. Communicate and Reflection"} />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
}
