import type { Employee } from "@workspace/api-client-react";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  employee: Employee;
}

export function Avatar({ employee, className, ...props }: AvatarProps) {
  const bgColor = employee.color || "hsl(var(--secondary))";
  const textColor = employee.color ? "#ffffff" : "hsl(var(--secondary-foreground))";
  
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ring-1 ring-white dark:ring-background",
        className
      )}
      style={{ backgroundColor: bgColor, color: textColor }}
      title={employee.name}
      {...props}
    >
      {employee.avatarInitials || getInitials(employee.name)}
    </div>
  );
}
