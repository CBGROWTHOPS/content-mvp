import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content Admin",
  description: "Internal content generation dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <header className="mb-8 flex items-center gap-6 border-b border-zinc-800 pb-4">
            <a
              href="/"
              className="text-lg font-semibold text-zinc-100 hover:text-white"
            >
              Content Admin
            </a>
            <nav className="flex gap-4">
              <a
                href="/jobs"
                className="text-sm text-zinc-400 hover:text-zinc-100"
              >
                Jobs
              </a>
              <a
                href="/new"
                className="text-sm text-zinc-400 hover:text-zinc-100"
              >
                New Job
              </a>
            </nav>
          </header>
          <main>{children}</main>
          <footer className="mt-12 border-t border-zinc-800 pt-6 text-center text-sm text-zinc-500">
            <Link href="/docs" className="text-zinc-400 hover:text-white">
              Documentation
            </Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
