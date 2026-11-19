import { AlertCircle } from "lucide-react";

interface Props {
  message?: string;
  errors?: Record<string, string[]>;
}

/** Turns `password_confirm` into `Password confirm` for field-level API errors. */
function humanize(field: string) {
  return field.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export default function ErrorMessage({ message, errors }: Props) {
  const messages: string[] = [];
  if (message) messages.push(message);
  if (errors) {
    Object.entries(errors).forEach(([field, errs]) => {
      errs.forEach((e) =>
        messages.push(field === "non_field_errors" ? e : `${humanize(field)}: ${e}`)
      );
    });
  }

  if (!messages.length) return null;

  return (
    <div
      role="alert"
      className="flex animate-fade-in gap-2.5 rounded-lg bg-red-50 p-3 ring-1 ring-inset ring-red-600/15"
    >
      <AlertCircle size={16} className="mt-px shrink-0 text-red-500" />
      <div className="min-w-0 space-y-0.5 text-sm text-red-700">
        {messages.map((m, i) => (
          <p key={i}>{m}</p>
        ))}
      </div>
    </div>
  );
}
