import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import OfflineBanner from "@/components/OfflineBanner";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ArteGO",
  description: "Digital art publishing platform.",
  appleWebApp: {
    capable: true,
    title: "ArteGO",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
