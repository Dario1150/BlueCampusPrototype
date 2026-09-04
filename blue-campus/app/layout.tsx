import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import NavSidebar from "@/components/nav-sidebar";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const headingFont = Space_Grotesk({
  variable: "--font-heading-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blue Campus",
  description: "Sailing school management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}
    >
      <body className="flex h-full flex-col md:flex-row">
        <NavSidebar userEmail={user?.email ?? null} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
