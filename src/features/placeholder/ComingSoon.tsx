import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";

export function ComingSoon({ icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-[560px]">
      <Card>
        <EmptyState
          icon={icon}
          title={title}
          description={description}
          action={{ label: "Volver al inicio", href: "/" }}
        />
      </Card>
    </div>
  );
}
