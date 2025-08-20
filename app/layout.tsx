import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/providers";
import { EnvWarning } from "@/components/env-warning";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AfterDog - 写实卡通风宠物头像生成器",
  description: "上传人像照片，生成可爱的写实卡通风猫狗头像",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>
          <EnvWarning />
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                zIndex: 9997,
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
