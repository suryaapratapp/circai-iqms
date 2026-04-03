import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { appConfig } from "@/lib/config/app";

export const metadata: Metadata = {
  title: `${appConfig.name} | ${appConfig.fullName}`,
  description:
    `${appConfig.fullName} for RZ-Circular. Mobile-first stock and quality workflows for warehouse teams.`
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
