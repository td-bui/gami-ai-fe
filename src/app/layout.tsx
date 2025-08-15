import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CodePlay AI",
  description: "Coding System",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Toaster
            position="top-center"
            toastOptions={{
              // Define default options
              duration: 5000,
              
              // Default options for specific types
              success: {
                duration: 4000,
                style: {
                  background: 'linear-gradient(to right, #6ee7b7, #3b82f6)',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '12px 20px',
                  borderRadius: '9999px',
                  border: '1px solid #10b981',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                },
                iconTheme: {
                  primary: '#10b981',
                  secondary: 'white',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                  color: 'white',
                  fontWeight: 'bold',
                  borderRadius: '9999px',
                },
                iconTheme: {
                    primary: 'white',
                    secondary: '#ef4444',
                }
              }
            }}
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
