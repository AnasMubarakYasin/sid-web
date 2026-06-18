"use client";

import LinearProgress from "@mui/material/LinearProgress";
import { useDashboardStore } from "@/store/dashboard";

export default function Loader() {
  const { loading } = useDashboardStore();
  return (
    <LinearProgress
      aria-label="Loading…"
      className="fixed top-0 left-0 z-2000 w-full"
      hidden={!loading}
    />
  );
}
