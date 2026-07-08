import { useState } from "react";
import { useListMeetings } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { MeetingCard } from "@/components/meeting-card";
import { format, subDays, addDays } from "date-fns";
import { Loader2 } from "lucide-react";

export function SearchMeetings() {
  const today = new Date();
  const [from, setFrom] = useState(format(subDays(today, 7), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(addDays(today, 30), "yyyy-MM-dd"));

  const { data: meetings, isLoading } = useListMeetings({ from, to });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Все встречи</h1>
          <p className="text-muted-foreground mt-1 text-sm">Поиск по диапазону дат.</p>
        </header>

        <div className="bg-card border border-border p-4 rounded-lg mb-6 flex flex-col sm:flex-row items-end gap-3 md:gap-4">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wider">
              С
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wider">
              По
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !meetings?.length ? (
          <div className="text-center py-20 text-muted-foreground text-sm">
            В этом диапазоне встреч нет.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-2">
              Найдено: {meetings.length} {meetings.length === 1 ? "встреча" : meetings.length < 5 ? "встречи" : "встреч"}
            </p>
            {meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} compact />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
