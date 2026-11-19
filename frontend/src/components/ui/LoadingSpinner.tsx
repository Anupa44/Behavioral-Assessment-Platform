export default function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = { sm: "h-4 w-4 border-2", md: "h-7 w-7 border-2", lg: "h-10 w-10 border-[3px]" }[size];
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-spin rounded-full border-gray-200 border-t-primary-600 ${s}`}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" />
    </div>
  );
}
