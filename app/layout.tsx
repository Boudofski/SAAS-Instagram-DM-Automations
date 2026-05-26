import ReactQueryProvider from "@/providers/react-query-provider";
import ReduxProvider from "@/providers/redux-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AP3k — Instagram Comment Automation",
  description:
    "AP3k turns Instagram comments into public replies, leads, and tracked outcomes using official Meta APIs.",
  openGraph: {
    title: "AP3k — Instagram Comment Automation",
    description:
      "AP3k turns Instagram comments into public replies, leads, and tracked outcomes using official Meta APIs.",
    url: "https://ap3k.com",
    siteName: "AP3k",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AP3k — Instagram Comment Automation",
    description:
      "AP3k turns Instagram comments into public replies, leads, and tracked outcomes using official Meta APIs.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={jakarta.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReduxProvider>
            <ReactQueryProvider>{children}</ReactQueryProvider>
          </ReduxProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
