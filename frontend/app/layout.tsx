import "antd/dist/reset.css";
import "./globals.css";

import { Inter, Space_Grotesk } from "next/font/google";
import { ConfigProvider } from "antd";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable}`}
      >
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#DAB2FF',
              colorText: '#FFFFFF',
              colorIcon: '#D8B4FE',
              colorBgBase: "#080808",
              colorBorder: "#71717a",
            },
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}