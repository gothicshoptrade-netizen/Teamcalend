import { useGetTodayMeetings } from "@workspace/api-client-react";
import { MeetingCard } from "@/components/meeting-card";
import { Layout } from "@/components/layout";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2, CalendarX2 } from "lucide-react";
import { Link } from "wouter";

export function Home() {
  const { data: meetings, isLoading, error } = useGetTodayMeetings();
  const today = new Date();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 md:mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Сегодня</h1>
            <p className="text-muted-foreground font-mono text-xs md:text-sm mt-1 uppercase tracking-wider">
              {format(today, "EEEE, d MMMM yyyy", { locale: ru })}
            </p>
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md text-sm">
            Не удалось загрузить расписание. Попробуйте обновить страницу.
          </div>
        ) : !meetings || meetings.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-lg p-10 md:p-14 text-center flex flex-col items-center">
            <div className="h-12 w-12 bg-accent rounded-full flex items-center justify-center mb-4">
              <CalendarX2 className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">День свободен</h2>
            <p className="text-muted-foreground mb-6 max-w-md text-sm">
              На сегодня встреч нет — отличное время для глубокой работы.
            </p>
            <Link
              href="/new"
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              Запланировать встречу
            </Link>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
