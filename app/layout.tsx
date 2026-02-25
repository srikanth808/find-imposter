import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Find the Imposter — Party Game",
  description: "A real-time multiplayer party game. Join with friends, find the imposter, vote them out!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stars min-h-screen">
        {children}
      </body>
    </html>
  );
}
