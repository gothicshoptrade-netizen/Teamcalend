import { useGetWeekMeetings } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function WeekView() {
  const { data: meetings, isLoading } = useGetWeekMeetings();

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 13 }).map((_, i) => i + 8); // 8:00–20:00

  const getMeetingStyle = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const startMins = (start.getHours() - 8) * 60 + start.getMinutes();
    const durationMins = (end.getTime() - start.getTime()) / 60000;
    return {
      top: `${(startMins / 60) * 60}px`,
      height: `${Math.max((durationMins / 60) * 60, 24)}px`,
    };
  };

  return (
    <Layout>
      <div className="flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
        <header className="mb-4 md:mb-6 shrink-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Эта неделя</h1>
          <p className="text-muted-foreground font-mono text-xs md:text-sm mt-1 uppercase tracking-wider">
            {format(weekStart, "d MMM", { locale: ru })} — {format(addDays(weekStart, 6), "d MMM yyyy", { locale: ru })}
          </p>
        </header>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col min-h-0">
            {/* Header row */}
            <div className="flex border-b border-border bg-muted/30 shrink-0 overflow-x-auto">
              <div className="w-12 md:w-16 shrink-0 border-r border-border" />
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-1 min-w-[90px] p-2 md:p-3 text-center border-r border-border last:border-r-0",
                    isSameDay(day, today) && "bg-accent/50"
                  )}
                >
                  <div className="font-semibold text-xs md:text-sm capitalize">
                    {format(day, "EE", { locale: ru })}
                  </div>
                  <div
                    className={cn(
                      "font-mono text-[10px] md:text-xs mt-0.5 inline-block px-1.5 py-0.5 rounded-sm",
                      isSameDay(day, today)
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-muted-foreground"
                    )}
                  >
                    {format(day, "d MMM", { locale: ru })}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid body — horizontal scroll on mobile */}
            <div className="flex-1 overflow-auto">
              <div className="flex min-w-[640px]">
                {/* Time labels */}
                <div className="w-12 md:w-16 shrink-0 border-r border-border bg-card">
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="h-[60px] relative border-b border-border/50 text-right pr-1 md:pr-2"
                    >
                      <span className="text-[9px] md:text-[10px] font-mono text-muted-foreground absolute -top-2.5 right-1 md:right-2 bg-card px-0.5">
                        {hour}:00
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {days.map((day) => {
                  const dayMeetings =
                    meetings?.filter((m) => isSameDay(new Date(m.startTime), day)) || [];
                  return (
                    <div
                      key={day.toISOString()}
                      className="flex-1 min-w-[90px] relative border-r border-border/50 last:border-r-0"
                    >
                      {hours.map((hour) => (
                        <div key={hour} className="h-[60px] border-b border-border/30 w-full" />
                      ))}
                      {dayMeetings.map((meeting) => {
                        const style = getMeetingStyle(meeting.startTime, meeting.endTime);
                        return (
                          <Link
                            key={meeting.id}
                            href={`/meetings/${meeting.id}`}
                            className="absolute left-0.5 right-0.5 rounded-sm bg-primary/10 border-l-2 border-primary overflow-hidden hover:bg-primary/20 transition-colors z-10 hover:z-20 group"
                            style={style}
                            title={`${meeting.title} (${format(new Date(meeting.startTime), "HH:mm")} – ${format(new Date(meeting.endTime), "HH:mm")})`}
                          >
                            <div className="p-1 h-full overflow-hidden">
                              <div className="font-semibold text-[10px] md:text-[11px] leading-tight text-foreground group-hover:text-primary transition-colors truncate">
                                {meeting.title}
                              </div>
                              <div className="font-mono text-[9px] md:text-[10px] text-muted-foreground mt-0.5 truncate">
                                {format(new Date(meeting.startTime), "HH:mm")}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
