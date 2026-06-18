"use client";

import { Link } from "@/component/link";
import {
  Box,
  Button,
  Container,
  // InputLabel,
  MenuItem,
  // LinearProgress,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";

import { setToken, signup } from "@/api/user";
import { useState } from "react";
import { useUserStore } from "@/store/user";
import { useMutation } from "@tanstack/react-query";

export default function Page() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { login } = useUserStore();

  const mutation = useMutation({
    mutationFn: signup,
    onSuccess(result) {
      login({
        id: result.data.id,
        name: result.data.name,
        role: result.data.role,
        token: result.meta.token,
      });
      setToken(result.meta.token);
      router.replace("/student");
    },
  });
  function onSubmit(event: Event) {
    event.preventDefault();
    mutation.mutate({ username, role, password, confirm });
  }
  return (
    <Container
      className="grid place-content-center-safe bg-blue-200 dark:bg-blue-900 w-screen h-screen"
      maxWidth={false}
    >
      {/* <LinearProgress
        aria-label="Loading…"
        className="absolute top-0 left-0 z-10 w-full"
      /> */}
      <Paper elevation={1} className="flex flex-col gap-8 px-8 py-5 rounded-lg">
        <Box component="header" className="flex flex-col gap-2">
          <Typography
            component="h1"
            sx={{ fontSize: 32, fontWeight: "bolder" }}
          >
            Buat Akun Baru
          </Typography>
          <Typography
            component="p"
            sx={{ fontWeight: "regular", opacity: 0.9 }}
          >
            Daftar untuk membuat akun {process.env.NEXT_PUBLIC_APP_NAME}
          </Typography>
        </Box>
        <Box component="main" className="flex flex-col gap-4">
          <Typography component="p" color="error">
            {mutation.error?.message}
          </Typography>
          <Box
            component="form"
            className="flex flex-col gap-4"
            // @ts-expect-error ___
            onSubmit={onSubmit}
          >
            <Box component="div" className="flex flex-col gap-1">
              <Typography component="label" htmlFor="username">
                Username
              </Typography>
              <TextField
                id="username"
                name="username"
                autoComplete="username"
                label=""
                variant="outlined"
                placeholder="simplename"
                fullWidth
                onChange={(event) => setUsername(event.target.value)}
                value={username}
                disabled={mutation.isPending}
              />
            </Box>
            <Box component="div" className="flex flex-col gap-1">
              <Typography component="label" htmlFor="role">
                Role
              </Typography>
              {/* <FormControl fullWidth> */}
              {/* <Typography component="label" htmlFor="subject">
                  Subject
                </Typography> */}
              {/* <InputLabel id="subject">Subject</InputLabel> */}
              <Select
                id="role"
                // labelId="subject"
                label=""
                variant="outlined"
                // placeholder="simplename"
                fullWidth
                onChange={(event) => setRole(event.target.value)}
                value={role}
                disabled={mutation.isPending}
                displayEmpty
                renderValue={(selected: string) => {
                  if (selected) {
                    return (
                      <div className="text-[16px] font-400">{selected}</div>
                    );
                  } else {
                    return (
                      <div className="text-[16px] font-400 opacity-50">
                        choose role
                      </div>
                    );
                  }
                }}
              >
                {["teacher", "student"].map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
              {/* </FormControl> */}
            </Box>
            <Box component="div" className="flex flex-col gap-1">
              <Typography component="label" htmlFor="password">
                Password
              </Typography>
              <TextField
                id="password"
                name="password"
                autoComplete="new-password"
                label=""
                variant="outlined"
                placeholder="********"
                type="password"
                fullWidth
                onChange={(event) => setPassword(event.target.value)}
                value={password}
                disabled={mutation.isPending}
              />
            </Box>
            <Box component="div" className="flex flex-col gap-1">
              <Typography component="label" htmlFor="password-confirm">
                Konfirmasi Password
              </Typography>
              <TextField
                id="password-confirm"
                name="password-confirm"
                autoComplete="new-password"
                label=""
                variant="outlined"
                placeholder="********"
                type="password"
                fullWidth
                onChange={(event) => setConfirm(event.target.value)}
                value={confirm}
                disabled={mutation.isPending}
              />
            </Box>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              loading={mutation.isPending || mutation.isSuccess}
            >
              Daftar
            </Button>
          </Box>
          <Typography component="p" align="center">
            Telah memiliki akun? <Link href="sign-in">masuk disini</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
