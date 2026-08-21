import type { Metadata } from "next";
import "./globals.css";

const productionHost = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://agentshield-ucs503.vercel.app");
const siteBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const socialImage = "/og.png";
const iconImage = `${siteBasePath}/og.png`;

export const metadata: Metadata = {
  metadataBase: new URL(productionHost),
  title: {
    default: "AgentShield | Runtime governance for AI agents",
    template: "%s | AgentShield",
  },
  description:
    "A provider-independent security and governance gateway for AI-agent tool actions, built by a four-member Software Engineering team.",
  icons: {
    icon: iconImage,
    shortcut: iconImage,
  },
  openGraph: {
    title: "AgentShield | Every action earns trust",
    description: "Intercept. Evaluate. Approve. Audit. A human-governed runtime gateway for AI-agent actions.",
    type: "website",
    images: [{ url: socialImage, width: 1200, height: 630, alt: "AgentShield — Every action earns trust" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentShield | Every action earns trust",
    description: "Runtime security and human governance for AI-agent actions.",
    images: [socialImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
