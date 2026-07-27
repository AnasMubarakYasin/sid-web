import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.26"],
  // rewrites() {
  //   return [
  //     {
  //       source: "/api/:rest*",
  //       destination: "http://192.168.1.26:3010/api/:rest*",
  //     },
  //     {
  //       source: "/event/:rest*",
  //       destination: "http://192.168.1.26:3010/event/:rest*",
  //     },
  //     {
  //       source: "/message/:rest*",
  //       destination: "http://192.168.1.26:3010/message/:rest*",
  //     },
  //   ];
  // },
};

export default nextConfig;
