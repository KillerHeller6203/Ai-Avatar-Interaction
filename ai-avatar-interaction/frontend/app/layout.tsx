import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resumé Edge — AI Resume Enhancer & Interview Avatar",
  description: "Get AI-powered actionable feedback and practice real-time AI mock interviews.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.bunny.net/css?family=satoshi:400,500,700,800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
