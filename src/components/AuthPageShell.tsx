import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";

type AuthPageShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthPageShell({
  title,
  subtitle,
  children,
  footer,
}: AuthPageShellProps) {
  return (
    <div
      className="flex min-h-dvh w-full flex-col justify-center bg-bg px-6 py-12"
      style={{
        paddingTop: "max(3rem, env(safe-area-inset-top))",
        paddingBottom: "max(3rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mb-10 text-center">
        <div className="mb-4 flex justify-center">
          <Logo className="text-3xl" />
        </div>
        <h1 className="font-syne text-lg font-bold text-text">{title}</h1>
        <p className="mt-1 text-sm text-muted2">{subtitle}</p>
      </div>
      {children}
      {footer}
    </div>
  );
}

export function AuthField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-muted2">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const authInputClass =
  "w-full rounded-[10px] border border-border2 bg-surface2 px-3 py-2.5 text-text focus:border-accent focus:outline-none";

export function AuthError({ message }: { message: string }) {
  return (
    <p className="rounded-[10px] border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {message}
    </p>
  );
}

export function AuthFooterLink({
  text,
  linkText,
  to,
}: {
  text: string;
  linkText: string;
  to: string;
}) {
  return (
    <p className="text-center text-xs text-muted">
      {text}{" "}
      <Link to={to} className="text-accent underline-offset-2 hover:underline">
        {linkText}
      </Link>
    </p>
  );
}
