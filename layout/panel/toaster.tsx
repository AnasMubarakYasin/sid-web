"use client";

import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useDashboardStore } from "@/store/dashboard";
import { useLayoutEffect } from "react";

export default function Toaster() {
  const { toasting, toast, setToasting, setToast } = useDashboardStore();
  useLayoutEffect(() => {
    return handleClose;
  }, []);
  function handleClose() {
    setToast({ level: "", message: "" }, false);
  }
  return (
    <Snackbar
      open={toasting}
      autoHideDuration={5000}
      message={toast.level ? undefined : toast.message}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      onClose={handleClose}
    >
      {toast.level ? (
        <Alert
          severity={toast.level}
          variant="filled"
          sx={{ width: "100%" }}
          onClose={handleClose}
        >
          {toast.message}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
}
