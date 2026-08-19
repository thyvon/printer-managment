import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  online: "default",
  paid: "default",
  sent: "secondary",
  pending: "secondary",
  trial: "secondary",
  draft: "secondary",
  offline: "outline",
  inactive: "secondary",
  maintenance: "outline",
  unreachable: "destructive",
  expired: "outline",
  cancelled: "destructive",
  overdue: "destructive",
  void: "destructive",
  starter: "secondary",
  growth: "default",
  enterprise: "default",
  open: "secondary",
  assigned: "default",
  in_progress: "default",
  resolved: "default",
  closed: "secondary",
  low: "outline",
  medium: "secondary",
  high: "destructive",
  urgent: "destructive",
};

export function StatusBadge({ status }: { status: string }) {
  const variant = variants[status] ?? "secondary";
  return (
    <Badge variant={variant} className={cn("capitalize")}>
      {status}
    </Badge>
  );
}