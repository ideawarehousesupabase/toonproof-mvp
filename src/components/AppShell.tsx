import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  FolderLock,
  FileBadge,
  UserRound,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { getSession, logoutUser, type Session } from "@/lib/users";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assets", label: "My Assets", icon: FolderLock },
  { to: "/certificates", label: "Certificates", icon: FileBadge },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function useRequireSession() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const current = getSession();
    if (!current) {
      navigate({ to: "/login" });
    } else {
      setSession(current);
    }
    setChecked(true);
  }, [navigate]);

  return { session, checked };
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function logout() {
    await logoutUser();
    navigate({ to: "/login" });
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || pathname.startsWith(to + "/");
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
      <button
        onClick={logout}
        className="btn-base mt-1 justify-start px-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      >
        <LogOut className="size-4" />
        Logout
      </button>
    </nav>
  );

  const brand = (
    <Link to="/dashboard" className="flex items-center gap-2 px-1 py-1">
      <span className="grid size-8 place-items-center rounded-lg bg-accent">
        <ShieldCheck className="size-4 text-accent-foreground" />
      </span>
      <span className="text-base font-bold tracking-tight text-sidebar-foreground">ToonProof</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col justify-between bg-sidebar p-4 lg:flex">
        <div className="flex flex-col gap-6">
          {brand}
          {nav}
        </div>

        {session ? (
          <div className="rounded-xl bg-sidebar-accent/50 p-3 border border-sidebar-border">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-accent font-bold text-xs text-accent-foreground">
                {session.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-semibold text-sidebar-foreground">
                  {session.fullName}
                </span>
                <span className="truncate font-mono text-[0.62rem] text-sidebar-foreground/60">
                  {session.creatorType}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="px-2 text-xs text-sidebar-foreground/50">IP &amp; Royalty Vault</p>
        )}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 lg:hidden">
        {brand}
        <button
          aria-label="Open menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {open ? (
        <div className="sticky top-[3.75rem] z-30 flex flex-col bg-sidebar px-4 pb-4 lg:hidden">
          {nav}
        </div>
      ) : null}

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
