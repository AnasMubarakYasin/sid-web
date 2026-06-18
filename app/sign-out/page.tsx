"use client";

import { Link } from "@/component/link";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { setToken, signout } from "@/api/user";
import { useUserStore } from "@/store/user";
import { useMutation } from "@tanstack/react-query";

export default function Page() {
  const router = useRouter();
  const { name, logout } = useUserStore();

  const mutation = useMutation({
    mutationFn: signout,
    onSuccess(result) {
      router.replace("/sign-in");
      logout();
    },
  });
  function onSubmit(event: Event) {
    event.preventDefault();
    mutation.mutate();
  }
  return (
    <Container
      className="grid place-content-center-safe bg-blue-200 dark:bg-blue-900 w-screen h-screen"
      maxWidth={false}
    >
      <Paper elevation={1} className="flex flex-col gap-8 p-8 rounded-lg">
        <Box component="header" className="flex flex-col gap-2">
          <Typography
            component="h1"
            sx={{ fontSize: 32, fontWeight: "bolder" }}
          >
            Yakin ingin keluar?
          </Typography>
          <Typography
            component="p"
            sx={{ fontWeight: "regular", opacity: 0.9 }}
          >
            Kamu akan keluar dari akun {name}, dan harus login kembali <br />
            untuk melanjutkan.
          </Typography>
        </Box>
        <Box component="main" className="flex flex-col gap-4">
          <Box
            component="form"
            className="flex flex-col gap-4"
            onSubmit={onSubmit}
          >
            {/* <Box component="div" className="flex flex-col gap-1">
              <Typography component="label" htmlFor="username">
                Username
              </Typography>
              <TextField
                id="username"
                name="username"
                label=""
                variant="outlined"
                placeholder="simplename"
                fullWidth
              />
            </Box>
            <Box component="div" className="flex flex-col gap-1">
              <Typography component="label" htmlFor="password">
                Password
              </Typography>
              <TextField
                id="password"
                name="password"
                label=""
                variant="outlined"
                placeholder="********"
                type="password"
                fullWidth
              />
            </Box>
            <Box component="div" className="flex flex-col gap-1">
              <Typography component="label" htmlFor="password-confirm">
                Konfirmasi Password
              </Typography>
              <TextField
                id="password-confirm"
                name="password-confirm"
                label=""
                variant="outlined"
                placeholder="********"
                type="password"
                fullWidth
              />
            </Box> */}
            <Button variant="contained" color="primary" type="submit">
              Keluar
            </Button>
            <Button variant="text" type="button" onClick={() => router.back()}>
              Kembali
            </Button>
          </Box>
          {/* <Typography component="p" align="center">
            <Link href="sign-in">masuk disini</Link>
          </Typography> */}
        </Box>
      </Paper>
    </Container>
  );
}
