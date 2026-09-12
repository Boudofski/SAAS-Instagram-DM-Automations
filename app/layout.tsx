import ReactQueryProvider from "@/providers/react-query-provider";
import ReduxProvider from "@/providers/redux-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import ConsentAwareAnalytics from "@/components/global/consent-aware-analytics";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });
const siteDescription =
  "Automatically reply to Instagram comments, send the promised link by DM, and track every lead—without complicated flows or code.";
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL("https://ap3k.com"),
  title: {
    default: "AP3K — Instagram Comment & DM Automation",
    template: "%s",
  },
  description: siteDescription,
  applicationName: "AP3K",
  alternates: { canonical: "/" },
  verification: googleVerification ? { google: googleVerification } : undefined,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "AP3K — Instagram Comment & DM Automation",
    description: siteDescription,
    url: "https://ap3k.com",
    siteName: "AP3K",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AP3K — Instagram Comment & DM Automation",
    description: siteDescription,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={jakarta.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <ReduxProvider>
            <ReactQueryProvider>{children}</ReactQueryProvider>
          </ReduxProvider>
          <Toaster />
        </ThemeProvider>
        <ConsentAwareAnalytics />
      </body>
    </html>
  );
}
