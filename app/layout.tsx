import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://agentshield.openai-sites.com"),
  title: {
    default: "AgentShield | Runtime governance for AI agents",
    template: "%s | AgentShield",
  },
  description:
    "A provider-independent security and governance gateway for AI-agent tool actions, built by a four-member Software Engineering team.",
  icons: {
    icon: "/og.png",
    shortcut: "/og.png",
  },
  openGraph: {
    title: "AgentShield | Every action earns trust",
    description: "Intercept. Evaluate. Approve. Audit. A human-governed runtime gateway for AI-agent actions.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "AgentShield — Every action earns trust" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentShield | Every action earns trust",
    description: "Runtime security and human governance for AI-agent actions.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
