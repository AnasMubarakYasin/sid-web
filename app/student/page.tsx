"use client";

import { useEffect } from "react";
import {
  // useDashboardStateGlobal,
  useDashboardStore,
} from "@/store/dashboard";

export default function Page() {
  // const { setTitle, setLoading } = useDashboardStateGlobal();
  const { setTitle, setLoading } = useDashboardStore();

  useEffect(() => {
    setTitle("Dashboard");
    setLoading(false);
  }, []);

  return <>Dashboard</>;
}
