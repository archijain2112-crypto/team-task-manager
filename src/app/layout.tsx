import type { Metadata } from "next";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskFlow - Modern Team Task Manager",
  description: "Accelerate your team delivery with task boards, telemetry, and detailed statistics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full bg-[#090a0f] text-slate-100 flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
