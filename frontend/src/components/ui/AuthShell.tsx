import { Link } from "react-router-dom";
import { LogoMark } from "./Logo";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-[25rem] animate-fade-in-up">
        <div className="mb-8 text-center">
          <Link to="/login" className="focus-ring inline-flex rounded-xl">
            <LogoMark size={44} className="rounded-[10px] shadow-raised" />
          </Link>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg sm:p-7">
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-gray-500">{footer}</div>}
      </div>
    </div>
  );
}
