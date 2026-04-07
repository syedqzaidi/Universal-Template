import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Website Template",
  description: "Website Template",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
