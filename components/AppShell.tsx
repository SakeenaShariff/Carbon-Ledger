"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/upload", label: "Upload" },
  { href: "/dashboard", label: "Dashboard" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [driveStatus, setDriveStatus] = useState<{
    configured: boolean;
    connected: boolean;
    email?: string | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/google/status")
      .then((r) => r.json())
      .then((data) => setDriveStatus(data))
      .catch(() => setDriveStatus({ configured: false, connected: false }));
  }, [pathname]);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function disconnectDrive() {
    await fetch("/api/auth/google/disconnect", { method: "POST" });
    setDriveStatus({ configured: true, connected: false });
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

          <div className="pt-2 border-t border-[#d5e4ea]">
            {driveStatus?.connected ? (
              <div className="flex items-center justify-between px-2 py-1 text-xs text-muted">
                <span className="flex items-center gap-1.5 font-medium text-[#1f6f8b]">
                  <span className="h-2 w-2 rounded-full bg-[#1f6f8b]" />
                  Drive Connected
                </span>
                <button onClick={disconnectDrive} className="text-xs text-muted hover:underline">
                  Disconnect
                </button>
              </div>
            ) : (
              <a
                href={`/api/auth/google/connect?returnTo=${encodeURIComponent(pathname)}`}
                className="btn-secondary w-full text-center text-sm py-2"
              >
                Connect Google Drive
              </a>
            )}
          </div>

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
              <div className="rounded-2xl border border-[#d5e4ea] bg-canvas p-3 text-xs">
                <p className="font-semibold text-ink mb-1">Google Drive Storage</p>
                {driveStatus?.connected ? (
                  <div>
                    <div className="flex items-center gap-1.5 text-[#1f6f8b] font-medium">
                      <span className="h-2 w-2 rounded-full bg-[#1f6f8b]" />
                      Connected
                    </div>
                    {driveStatus.email ? (
                      <p className="mt-1 truncate text-muted" title={driveStatus.email}>
                        {driveStatus.email}
                      </p>
                    ) : null}
                    <button
                      onClick={disconnectDrive}
                      className="mt-2 text-[11px] text-muted hover:text-ink underline block"
                    >
                      Disconnect Drive
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-muted mb-2">Connect your Google account to enable storage.</p>
                    <a
                      href={`/api/auth/google/connect?returnTo=${encodeURIComponent(pathname)}`}
                      className="btn-primary w-full text-center text-xs py-2 block"
                    >
                      Connect Google Drive
                    </a>
                  </div>
                )}
              </div>

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
