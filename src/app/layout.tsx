import { fonts } from "@/components/fonts";
import Providers from "@/components/providers";
import { Sidebar } from "@/components/sidebar/sidebar";
import { SiteNavbar } from "@/components/site-navbar";
import { SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "DooleyOnline",
  description:
    "Welcome to DooleyOnline, a secondhand marketplace for Emory students",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const fontVariables = Object.entries(fonts)
  .map(([, v]) => v.variable)
  .join(" ");

const RootLayout = ({
  children,
}: Readonly<{
  children: ReactNode;
}>) => {
  return (
    <html lang="en">
      <body className={`${fontVariables} font-sans antialiased h-svh`}>
        <Providers>
          <Sidebar variant="inset" />
          <SidebarInset className="@container">
            <SiteNavbar />
            <Toaster />
            {children}
          </SidebarInset>
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
