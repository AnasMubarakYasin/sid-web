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
      <SideBar subject={false} />
      <Main>{children}</Main>
    </Container>
  );
}
