import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SeoProvider } from "@/components/SeoProvider";
import NextTopLoader from 'nextjs-toploader';
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Telkidukan | Premium E-Commerce",
  description: "A production-grade, fully functional e-commerce platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${montserrat.variable} h-full antialiased`}
      suppressHydrationWarning
    >

      <body className={`${inter.variable} ${montserrat.variable} font-sans`} suppressHydrationWarning>
        <Providers>
          <NextTopLoader color="#000" height={3} showSpinner={false} />
          <SeoProvider />
          {children}
        </Providers>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
