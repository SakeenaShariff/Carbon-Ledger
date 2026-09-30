import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-primary p-12 text-white lg:flex">
        <Link href="/login" className="font-heading text-3xl">
          Carbon Ledger
        </Link>
        <div>
          <h2 className="font-heading text-5xl leading-tight">Calm, accurate Scope 1 and Scope 2 reporting.</h2>
          <p className="mt-6 max-w-md text-lg text-white/80">
            Stationary and mobile combustion, plus purchased electricity. Your files stay in Google Drive.
          </p>
        </div>
        <p className="text-sm text-white/70">Ocean Breeze</p>
      </div>
      <div className="flex items-center justify-center bg-canvas px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <Link href="/login" className="font-heading text-3xl text-ink">
              Carbon Ledger
            </Link>
          </div>
          <div className="card">
            <h1 className="font-heading text-2xl text-ink">{title}</h1>
            <p className="mt-2 text-sm text-muted">{subtitle}</p>
            <div className="mt-6">{children}</div>
            {footer ? <div className="mt-6 text-sm text-muted">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

export function Alert({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "bg-[#fde8e4] text-[#8a3a28]",
    success: "bg-[#e7f6f2] text-[#1f6f8b]",
    info: "bg-[#eef5f8] text-ink",
  };
  return <div className={`rounded-2xl px-4 py-3 text-sm ${styles[tone]}`}>{children}</div>;
}
