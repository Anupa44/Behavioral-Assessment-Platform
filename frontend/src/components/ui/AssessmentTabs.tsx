import { Link, useLocation } from "react-router-dom";

const TABS = [
  { label: "Settings", path: "" },
  { label: "Questions", path: "/questions" },
  { label: "Invitations", path: "/invitations" },
  { label: "Analytics", path: "/analytics" },
];

export default function AssessmentTabs({ assessmentId }: { assessmentId: number | string }) {
  const { pathname } = useLocation();
  const base = `/assessments/${assessmentId}`;

  return (
    <div
      role="tablist"
      className="mb-6 inline-flex gap-0.5 rounded-lg border border-gray-200 bg-gray-100/80 p-1"
    >
      {TABS.map((tab) => {
        const to = `${base}${tab.path}`;
        const active = pathname === to;
        return (
          <Link
            key={tab.label}
            to={to}
            role="tab"
            aria-selected={active}
            className={`focus-ring rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              active
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
