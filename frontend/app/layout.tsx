import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import ChatWidget from "@/components/chat/ChatWidget";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "AI Recipe Maker - Generate Recipes with AI",
  description: "Create delicious recipes using AI. Generate recipes from dish names or available ingredients.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="antialiased" suppressHydrationWarning={true}>
        <Navbar />
        {children}
        <ChatWidget />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
