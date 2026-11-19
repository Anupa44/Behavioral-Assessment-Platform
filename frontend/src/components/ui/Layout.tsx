import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, LogOut } from "lucide-react";
import { authStore } from "../../store/auth";
import { useAuth } from "../../hooks/useAuth";
import { LogoMark } from "./Logo";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function Layout({
  children,
  title,
  subtitle,
  actions,
  breadcrumbs,
}: LayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    authStore.logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="focus-ring flex shrink-0 items-center gap-2.5 rounded-md">
            <LogoMark size={26} className="rounded-[6px] shadow-raised" />
            <span className="hidden text-sm font-semibold tracking-tight text-gray-900 sm:block">
              BehaviorAssess
            </span>
          </Link>

          {breadcrumbs && breadcrumbs.length > 0 && (
            <>
              <div className="hidden h-4 w-px shrink-0 bg-gray-200 sm:block" />
              <nav
                aria-label="Breadcrumb"
                className="hidden min-w-0 items-center gap-1 text-sm sm:flex"
              >
                {breadcrumbs.map((b, i) => (
                  <span key={i} className="flex min-w-0 items-center gap-1">
                    {i > 0 && <ChevronRight size={14} className="shrink-0 text-gray-300" />}
                    {b.href ? (
                      <Link
                        to={b.href}
                        className="focus-ring truncate rounded text-gray-500 transition-colors hover:text-gray-900"
                      >
                        {b.label}
                      </Link>
                    ) : (
                      <span className="truncate font-medium text-gray-900">{b.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            </>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="hidden text-sm text-gray-500 md:block">{user?.email}</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-200 md:hidden">
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
              className="focus-ring rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {(title || actions) && (
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              {title && <h1 className="page-title">{title}</h1>}
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>
        )}

        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
