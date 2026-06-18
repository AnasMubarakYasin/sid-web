"use client";

import { Link } from "@/component/link";
import {
  Box,
  Button,
  Checkbox,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { setToken, signin } from "@/api/user";
import { useUserStore } from "@/store/user";

export default function Page() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useUserStore();

  const mutation = useMutation({
    mutationFn: signin,
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
  function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    mutation.mutate({ username, password });
  }
  return (
    <Container
      className="grid place-content-center-safe bg-blue-200 dark:bg-blue-900 max-w-dvw min-h-dvh"
      maxWidth={false}
    >
      <Paper elevation={1} className="flex flex-col gap-8 px-8 py-5 rounded-lg">
        <Box component="header" className="flex flex-col gap-2">
          <Typography
            component="h1"
            sx={{ fontSize: 32, fontWeight: "bolder" }}
          >
            Selamat Datang
          </Typography>
          <Typography
            component="p"
            sx={{ fontWeight: "regular", opacity: 0.9 }}
          >
            Masuk untuk melanjutkan ke {process.env.NEXT_PUBLIC_APP_NAME}
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
              <Typography component="label" htmlFor="password">
                Password
              </Typography>
              <TextField
                id="password"
                name="password"
                autoComplete="current-password"
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
            <Box
              component="div"
              className="flex gap-1 items-center-safe -left-3 relative"
            >
              <Checkbox id="remember" disabled={mutation.isPending} />
              <Typography component="label" htmlFor="remember">
                Remember me
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              loading={mutation.isPending || mutation.isSuccess}
            >
              Masuk
            </Button>
          </Box>
          <Typography component="p" align="center">
            Belum memiliki akun? <Link href="sign-up">daftar disini</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
