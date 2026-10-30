import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import { SessionProvider } from "@/providers/session-provider";
import { Toaster } from "sonner";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "HSSE · Management System", template: "%s | HSSE" },
  description: "K3, Keamanan & Lingkungan — workspace operasional HSSE",
};

const themeScript = `
  try {
    const theme = localStorage.getItem("hsse-theme");
    const dark = theme ? theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.toggle("light", !dark);
  } catch {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SessionProvider>
          <QueryProvider>{children}</QueryProvider>
        </SessionProvider>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
