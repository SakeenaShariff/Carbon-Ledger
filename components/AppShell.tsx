"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/upload", label: "Upload" },
  { href: "/dashboard", label: "Dashboard" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="lg:hidden flex items-center justify-between px-4 py-4">
        <span className="font-heading text-xl text-ink">Carbon Ledger</span>
        <button className="btn-secondary px-3 py-2" onClick={() => setOpen((v) => !v)} aria-label="Open menu">
          Menu
        </button>
      </div>

      {open ? (
        <div className="lg:hidden mx-4 mb-4 card space-y-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block rounded-2xl px-4 py-3 ${pathname.startsWith(link.href) ? "bg-primary text-white" : "text-ink hover:bg-canvas"}`}
            >
              {link.label}
            </Link>
          ))}

          <button className="w-full rounded-2xl px-4 py-3 text-left text-ink hover:bg-canvas" onClick={logout} disabled={loggingOut}>
            {loggingOut ? "Signing out…" : "Logout"}
          </button>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-7xl gap-8 px-4 pb-10 lg:px-8">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 lg:block">
          <div className="card flex h-full flex-col">
            <div className="mb-6">
              <p className="font-heading text-2xl text-ink">Carbon Ledger</p>
              <p className="mt-1 text-sm text-muted">Scope 1 &amp; 2 reporting</p>
            </div>

            <nav className="space-y-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-2xl px-4 py-3 transition ${
                    pathname.startsWith(link.href) ? "bg-primary text-white" : "text-ink hover:bg-canvas"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto space-y-4">
              <button
                className="w-full rounded-2xl px-4 py-3 text-left text-muted hover:bg-canvas hover:text-ink transition"
                onClick={logout}
                disabled={loggingOut}
              >
                {loggingOut ? "Signing out…" : "Logout"}
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pt-2 lg:pt-6">{children}</main>
      </div>
    </div>
  );
}
