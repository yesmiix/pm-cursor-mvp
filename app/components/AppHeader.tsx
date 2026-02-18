"use client";

import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Design Brief" },
  { href: "/user-segments", label: "User Segments" },
  { href: "/kb", label: "База знаний" },
  { href: "/ask", label: "Спросить" },
  { href: "/backlog", label: "Backlog" },
  { href: "/feedback", label: "User Feedback" },
] as const;

export type AppHeaderProps = {
  pathname: string;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  title: string;
  description?: React.ReactNode;
};

export function AppHeader({
  pathname,
  theme,
  setTheme,
  title,
  description,
}: AppHeaderProps) {
  const linkClass = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href))
      ? theme === "dark"
        ? "bg-zinc-800 text-zinc-50"
        : "bg-zinc-900 text-zinc-50"
      : theme === "dark"
        ? "text-zinc-300 hover:bg-zinc-800/80"
        : "text-zinc-600 hover:bg-zinc-100";

  return (
    <header
      className={`flex flex-wrap items-center justify-between gap-4 border-b pb-4 ${
        theme === "dark" ? "border-zinc-800" : "border-zinc-200"
      }`}
    >
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold tracking-tight">{title}</h1>
        {description && (
          <p
            className={`mt-1 text-xs ${
              theme === "dark" ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
        <nav className="flex flex-wrap items-center gap-1 text-[11px] font-medium">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link rounded-md px-2.5 py-1.5 ${linkClass(href)}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className={`btn-secondary rounded-lg border px-3 py-1.5 text-[11px] font-medium ${
            theme === "dark"
              ? "border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300"
          }`}
        >
          {theme === "dark" ? "Dark theme" : "Light theme"}
        </button>
      </div>
    </header>
  );
}
