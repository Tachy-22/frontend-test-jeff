import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DocumentProvider } from "@/contexts/DocumentContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Inter } from 'next/font/google';

// Initialize the Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Document Signer & Annotation Tool",
  description:
    "Upload, annotate, and sign PDF documents with our interactive web application",
  keywords: [
    "PDF signer",
    "document annotation",
    "PDF tool",
    "digital signature",
  ],
  authors: [{ name: "Jeff" }],
  creator: "JEFF ENTEKUME",
  publisher: "JEFF ENTEKUME",
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    title: "Document Signer & Annotation Tool",
    description:
      "Upload, annotate, and sign PDF documents with our interactive web application",
    url: "https://frontend-test-jeff.vercel.app",
    siteName: "Document Signer & Annotation Tool",
    images: [
      {
        url: "/og-image.png", // Update with your actual OG image filename
        width: 1200,
        height: 630,
        alt: "Document Signer & Annotation Tool Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Document Signer & Annotation Tool",
    description:
      "Upload, annotate, and sign PDF documents with our interactive web application",
    images: ["/og-image.png"], // Update with your actual OG image filename
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`
          ${inter.variable}
      antialiased`}
      >
          <TooltipProvider>
            <DocumentProvider>
              <Toaster />
              <Sonner />
              {children}
            </DocumentProvider>
          </TooltipProvider>
      </body>
    </html>
  );
}
