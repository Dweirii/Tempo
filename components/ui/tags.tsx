import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FORMAT_META, STATUS_META, OWNER_META } from "@/lib/ui";
import type { Format, Owner, Status } from "@/lib/types";

export function Pill({
  bg,
  children,
  className,
}: {
  bg: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("tag", className)} style={{ backgroundColor: bg }}>
      {children}
    </span>
  );
}

export const FormatPill = ({ format }: { format: Format }) => (
  <Pill bg={FORMAT_META[format].bg}>{FORMAT_META[format].label}</Pill>
);

export const StatusBadge = ({ status }: { status: Status }) => (
  <Pill bg={STATUS_META[status].bg}>{STATUS_META[status].label}</Pill>
);

export const OwnerTag = ({ owner }: { owner: Owner }) => (
  <Pill bg={OWNER_META[owner].bg}>{OWNER_META[owner].label}</Pill>
);
