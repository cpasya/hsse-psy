import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";
import { AuthToast } from "@/features/auth/components/auth-toast";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "SHiELD · Management System", template: "%s | SHIELD" },
  description: "Dashboard SHiELD",
};

const themeScript = `
  try {
    const theme = localStorage.getItem("hsse-theme");
    const dark = theme === "dark";
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
        <QueryProvider>{children}</QueryProvider>
        <Toaster richColors position="bottom-right" />
        <AuthToast />
      </body>
    </html>
  );
}
