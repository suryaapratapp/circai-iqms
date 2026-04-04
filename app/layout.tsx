import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { appConfig } from "@/lib/config/app";

export const metadata: Metadata = {
  title: `${appConfig.name} ${appConfig.brandLine}`,
  description:
    `${appConfig.fullName} by CIRCAI LTD. Stock and quality management workflows for warehouse teams.`,
  icons: {
    icon: "/circai.ico",
    shortcut: "/circai.ico",
    apple: "/circai.ico"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            className: "font-body"
          }}
        />
      </body>
    </html>
  );
}
