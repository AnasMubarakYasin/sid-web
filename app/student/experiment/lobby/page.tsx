"use client";

import { useEffect, useLayoutEffect, useState } from "react";

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
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";

import MediaPlayer from "@/component/media-player-v2";
import TextList from "@/component/text-list";
import TextEditor from "@/component/text-editor-v3";
import Spreadsheet from "@/component/spreadsheet";
import "@/component/text-editor.css";

import RefreshIcon from "@mui/icons-material/Refresh";
import MenuIcon from "@mui/icons-material/Menu";

import { useDashboardStore } from "@/store/dashboard";
import { list, setToken } from "@/api/subject";
import { useQuery } from "@tanstack/react-query";
import { useExperimentStore } from "@/store/experiment";
import { useUserStore } from "@/store/user";

function createData(
  name: string,
  calories: number,
  fat: number,
  carbs: number,
  protein: number,
) {
  return { name, calories, fat, carbs, protein };
}

const rows = [
  createData("Frozen yoghurt", 159, 6.0, 24, 4.0),
  createData("Ice cream sandwich", 237, 9.0, 37, 4.3),
  createData("Eclair", 262, 16.0, 24, 6.0),
  createData("Cupcake", 305, 3.7, 67, 4.3),
  createData("Gingerbread", 356, 16.0, 49, 3.9),
];

export default function Page() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(1);
  const [enableSim, setEnableSim] = useState(false);
  const [subject, setSubject] = useState("");
  const [started, setStarted] = useState(false);
  const { setTitle, setLoading } = useDashboardStore();
  const { token } = useUserStore();
  const store = useExperimentStore();
  const query = useQuery({
    queryKey: ["subjects"],
    queryFn: list,
  });
  const handleChange = (event: SelectChangeEvent) => {
    setSubject(event.target.value as string);
    store.select(query.data.data.find((item) => item.id == event.target.value));
  };

  useLayoutEffect(() => {
    setTitle("Experiment");
    setLoading(false);
  }, []);
  useLayoutEffect(() => {
    setToken(token);
    return () => setToken("");
  }, [token]);

  function toggleSteps() {
    setOpen(!open);
  }
  // function handleTab(event, value) {
  //   setTab(value);
  // }
  return (
    <div className="flex flex-col gap-4">
      <Drawer
        anchor="right"
        variant="temporary"
        open={open}
        onClose={toggleSteps}
        component="aside"
      >
        <header className="h-16 flex items-center justify-center">
          <Typography component="div" className="text-lg">
            Inquiry Steps
          </Typography>
        </header>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton selected={tab == 1} onClick={() => setTab(1)}>
              <ListItemText primary={"Lobby"} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={tab == 2} onClick={() => setTab(1)}>
              <ListItemText primary={"Phenomenon Orientation"} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={tab == 3} onClick={() => setTab(2)}>
              <ListItemText primary={"Question Formulation"} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={tab == 4} onClick={() => setTab(3)}>
              <ListItemText primary={"Investigation Design"} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={tab == 5} onClick={() => setTab(4)}>
              <ListItemText primary={"Data Collection and Analisys"} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={tab == 6} onClick={() => setTab(5)}>
              <ListItemText primary={"Explanation Construction"} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={tab == 7} onClick={() => setTab(6)}>
              <ListItemText primary={"Communicate and Reflection"} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <TabContext value={tab}>
        {/* <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList onChange={handleTab} aria-label="lab API tabs example">
            <Tab label="Item One" value={1} />
            <Tab label="Item Two" value={2} />
            <Tab label="Item Three" value={3} />
          </TabList>
        </Box> */}
        <TabPanel keepMounted value={1} className="p-0">
          <div className="flex flex-col gap-4 max-sm:p-1">
            <header>
              <Typography component="h2" variant="h5">
                Lobby
              </Typography>
              <Typography component="p" variant="body1">
                Set experiment subject
              </Typography>
            </header>
            <Paper
              variant="outlined"
              elevation={4}
              className="w-stretch sm:w-182 flex flex-col gap-4 p-4 self-center justify-center"
            >
              <FormControl fullWidth>
                {/* <Typography component="label" htmlFor="subject">
                  Subject
                </Typography> */}
                <InputLabel id="subject">Subject</InputLabel>
                <Select
                  labelId="subject"
                  id="input-subject"
                  value={store.id}
                  label="Subject"
                  disabled={started}
                  onChange={handleChange}
                >
                  {query.data?.data.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <div>
                <Typography component="h3" variant="h6">
                  {store.title}
                </Typography>
                <Typography component="p" variant="body1">
                  {store.description}
                </Typography>
              </div>
              <Button
                color="primary"
                variant="contained"
                disabled={started}
                onClick={() => {
                  setStarted(true);
                  setTab(2);
                }}
                fullWidth={false}
              >
                Mulai
              </Button>
            </Paper>
          </div>
        </TabPanel>
        <TabPanel keepMounted value={2} className="p-0">
          <div className="flex flex-col gap-4 max-sm:p-1">
            <header>
              <Typography component="h2" variant="h5">
                Phenomenon Orientation
              </Typography>
              <Typography component="p" variant="body1">
                Amati fenomena berikut dengan seksama.
              </Typography>
            </header>
            <Paper
              variant="outlined"
              elevation={4}
              className="w-stretch sm:w-182 p-1 self-center justify-center aspect-video"
            >
              {store.video && (
                <MediaPlayer className="w-full h-full" src={store.video} />
              )}
            </Paper>
          </div>
        </TabPanel>
        <TabPanel keepMounted value={3} className="p-0">
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-4 max-sm:p-1">
              <header>
                <Typography component="h2" variant="h5">
                  Question Formulation
                </Typography>
                <Typography component="p" variant="body1">
                  Berdasarkan fenomena yang kamu amati, rumuskan masalah yang
                  akan kamu selidiki.
                </Typography>
              </header>
              <Paper
                variant="outlined"
                elevation={4}
                className="flex flex-col gap-1 p-2"
                // sx={{
                //   color: "hsl(var(--foreground))",
                //   backgroundColor: "hsl(var(--background))",
                // }}
              >
                {/* <TaskList></TaskList> */}
                {store.questions.map((question, index) => (
                  <Box
                    key={index}
                    component="div"
                    className="flex gap-1 items-center-safe"
                  >
                    <Checkbox id={index + "_id"} />
                    <Typography component="label" htmlFor={index + "_id"}>
                      {index + 1}. {question}
                    </Typography>
                  </Box>
                ))}
                {/* <Box component="div" className="flex gap-1 items-center-safe">
                  <Checkbox id="q1" />
                  <Typography component="label" htmlFor="q1">
                    1. Question?
                  </Typography>
                </Box>
                <Box component="div" className="flex gap-1 items-center-safe">
                  <Checkbox id="q2" />
                  <Typography component="label" htmlFor="q2">
                    2. Question?
                  </Typography>
                </Box> */}
              </Paper>
            </section>
            <section className="flex flex-col gap-4 max-sm:p-1">
              <header>
                <Typography component="h2" variant="h5">
                  Hypotesis
                </Typography>
                <Typography component="p" variant="body1">
                  Buatlah dugaan sementara (hipotesis) berdasarkan rumusan
                  masalah yang telah kamu buat.
                </Typography>
              </header>
              <Paper variant="outlined" elevation={4}>
                <TextList />
              </Paper>
            </section>
          </div>
        </TabPanel>
        <TabPanel keepMounted value={4} className="p-0">
          <div className="flex flex-col gap-4 max-sm:p-1">
            <header>
              <Typography component="h2" variant="h5">
                Investigation Design
              </Typography>
              <Typography component="p" variant="body1">
                Uji hipotesismu dengan melakukan eksperimen pada simulasi
                berikut.
              </Typography>
            </header>
            <Paper
              variant="outlined"
              elevation={4}
              className="w-stretch sm:w-182 h-80 sm:h-122 p-1 flex self-center justify-center"
            >
              {!enableSim && (
                <IconButton
                  aria-label="refresh"
                  className="self-center justify-center"
                  color="primary"
                  onClick={() => setEnableSim(true)}
                >
                  <RefreshIcon fontSize="large" />
                </IconButton>
              )}
              {enableSim && (
                <iframe
                  src="/simulation"
                  // width={720}
                  // height={480}
                  allowFullScreen
                  className="w-stretch h-stretch"
                  onError={(event) => {
                    console.log(event);
                    setEnableSim(false);
                  }}
                ></iframe>
              )}
              {/* <iframe src="/simulation" width={720} height={480} allowFullScreen></iframe> */}
            </Paper>
          </div>
        </TabPanel>
        <TabPanel keepMounted value={5} className="p-0">
          <div className="flex flex-col gap-4 max-sm:p-1">
            <header>
              <Typography component="h2" variant="h5">
                Data Collection and Analisys
              </Typography>
              <Typography component="p" variant="body1">
                Analisis data yang telah kamu peroleh dari eksperimen.
              </Typography>
            </header>
            <Paper variant="outlined" elevation={4}>
              <Spreadsheet />
            </Paper>

            {/* <TableContainer component={Paper}>
              <Table className="w-stretch" aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Dessert (100g serving)</TableCell>
                    <TableCell align="right">Calories</TableCell>
                    <TableCell align="right">Fat&nbsp;(g)</TableCell>
                    <TableCell align="right">Carbs&nbsp;(g)</TableCell>
                    <TableCell align="right">Protein&nbsp;(g)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.name}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {row.name}
                      </TableCell>
                      <TableCell align="right">{row.calories}</TableCell>
                      <TableCell align="right">{row.fat}</TableCell>
                      <TableCell align="right">{row.carbs}</TableCell>
                      <TableCell align="right">{row.protein}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer> */}
          </div>
        </TabPanel>
        <TabPanel keepMounted value={6} className="p-0">
          <div className="flex flex-col gap-4 max-sm:p-1">
            <header>
              <Typography component="h2" variant="h5">
                Explanation Construction
              </Typography>
              <Typography component="p" variant="body1">
                Tarik kesimpulan berdasarkan seluruh kegiatan inquiry yang telah
                kamu lakukan.
              </Typography>
            </header>
            <Paper variant="outlined" elevation={4}>
              <TextEditor />
            </Paper>
          </div>
        </TabPanel>
        <TabPanel keepMounted value={7} className="p-0">
          <div className="flex flex-col gap-4 max-sm:p-1">
            <header>
              <Typography component="h2" variant="h5">
                Communicate and Reflection
              </Typography>
              <Typography component="p" variant="body1">
                Amati fenomena berikut dengan seksama
              </Typography>
            </header>
          </div>
        </TabPanel>
      </TabContext>
      <div className="flex gap-2" hidden={!started}>
        <IconButton aria-label="refresh" color="primary">
          <RefreshIcon />
        </IconButton>
        <div className="grow"></div>
        <Button
          variant="text"
          disabled={tab - 1 < 1}
          onClick={() => setTab(tab - 1)}
        >
          Sebelumnya
        </Button>
        <Button
          variant="text"
          disabled={tab + 1 > 7}
          onClick={() => setTab(tab + 1)}
        >
          Selanjutnya
        </Button>
        <IconButton
          aria-label="open menu steps"
          color="primary"
          onClick={toggleSteps}
        >
          <MenuIcon />
        </IconButton>
      </div>
    </div>
  );
}
