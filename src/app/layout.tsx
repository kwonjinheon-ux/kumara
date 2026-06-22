import type { Metadata } from "next";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { MainNavbar } from "@/components/common/MainNavbar";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Kumara",
  description: "New Zealand Korean community platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <MainNavbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
