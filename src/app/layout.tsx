import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nómina Venezuela - Sistema de Gestión",
  description: "Sistema de gestión de nómina multi-empresa con cálculos LOTTT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} antialiased bg-neutral-900 text-white`}>
        {children}
      </body>
    </html>
  );
}
