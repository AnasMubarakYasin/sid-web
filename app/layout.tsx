import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Roboto } from "next/font/google";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/lib/theme";
import QueryProviders from "@/component/query";
// import QueryProviders from "@/component/query-v2";
import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Welcome | Scientific Inquiry Digital",
  description: "Platform Virtual Lab berbasis inquiry yang membantu siswa melakukan eksperimen virtual, menyusun hipotesis, menganalisis data, dan menarik kesimpulan secara interaktif.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <body className="flex flex-col max-w-dvw min-h-dvh overflow-x-hidden overflow-y-auto">
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <QueryProviders>{children}</QueryProviders>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
