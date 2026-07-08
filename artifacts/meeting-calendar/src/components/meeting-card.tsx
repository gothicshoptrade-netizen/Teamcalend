import type { Meeting, Employee } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Avatar } from "./avatar";
import { cn } from "@/lib/utils";

interface MeetingCardProps {
  meeting: Meeting;
  compact?: boolean;
}

export function MeetingCard({ meeting, compact = false }: MeetingCardProps) {
  const start = new Date(meeting.startTime);
  const end = new Date(meeting.endTime);

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className={cn(
        "block bg-card border border-card-border rounded-md transition-all hover:shadow-md hover:border-primary/30 group",
        compact ? "p-3" : "p-4 md:p-5"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-xs font-bold text-primary bg-accent px-2 py-0.5 rounded-sm shrink-0">
              {format(start, "HH:mm")} — {format(end, "HH:mm")}
            </span>
            {meeting.location && (
              <span className="text-xs text-muted-foreground truncate">
                {meeting.location}
              </span>
            )}
          </div>
          <h3
            className={cn(
              "font-semibold text-foreground truncate group-hover:text-primary transition-colors",
              compact ? "text-sm" : "text-base mb-2"
            )}
          >
            {meeting.title}
          </h3>
          {!compact && meeting.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {meeting.description}
            </p>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex items-center justify-between",
          compact ? "mt-2" : "mt-3 pt-3 border-t border-border/50"
        )}
      >
        <div className="flex items-center -space-x-2">
          {meeting.participants.slice(0, 5).map((p: Employee) => (
            <Avatar key={p.id} employee={p} className="ring-2 ring-card" />
          ))}
          {meeting.participants.length > 5 && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-medium ring-2 ring-card z-10">
              +{meeting.participants.length - 5}
            </div>
          )}
        </div>
        {!compact && meeting.organizer && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Орг.:</span>
            <span className="font-medium text-foreground">{meeting.organizer.name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
