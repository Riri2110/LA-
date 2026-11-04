import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COLOR HUNT",
  description: "ラブオール カラーハント",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
