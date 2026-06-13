import type { Metadata } from "next";
import { Tajawal, El_Messiri } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
});

// خط عرض أنيق للعناوين الكبيرة — يمنح المنصة طابعًا فاخرًا
const messiri = El_Messiri({
  variable: "--font-display",
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Spa & Salon Pro — نظام حجوزات وإدارة الصالونات والسبا",
    template: "%s · Spa & Salon Pro",
  },
  description:
    "Spa & Salon Pro: نظام سحابي عربي متكامل لإدارة الصالونات والسبا — حجوزات لحظية، قاعدة عملاء، تذكيرات واتساب، ونقاط ولاء. لكل صالون نظامه وهويته ورابطه الخاص.",
  keywords: [
    "حجوزات صالون",
    "إدارة سبا",
    "نظام مواعيد",
    "صالون نسائي",
    "spa salon software",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${tajawal.variable} ${messiri.variable} antialiased`}
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
