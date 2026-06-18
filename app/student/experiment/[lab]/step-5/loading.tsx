import Skeleton from "@mui/material/Skeleton";

export default function Loading() {
  return (
    <div className="w-container h-container">
      <Skeleton variant="rounded" width="100%" height="100%"></Skeleton>
    </div>
  );
}
