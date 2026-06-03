import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Stake Casino | Home",
    description: "Casino page view with balance, news, search, and live games.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
