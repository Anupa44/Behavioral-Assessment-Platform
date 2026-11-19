import { CheckCircle2 } from "lucide-react";
import StatusCard from "../../components/ui/StatusCard";

export default function ParticipantCompletePage() {
  return (
    <StatusCard
      fullScreen
      tone="success"
      icon={<CheckCircle2 size={24} />}
      title="Assessment complete"
      message="Thanks for taking the time. Your responses have been recorded and you can close this page."
    >
      <p className="rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-500 ring-1 ring-inset ring-gray-200">
        If the sender enabled result emails, your behavioral profile will arrive shortly.
      </p>
    </StatusCard>
  );
}
