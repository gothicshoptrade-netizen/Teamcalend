import { useGetMeeting, useDeleteMeeting, getGetTodayMeetingsQueryKey, getGetWeekMeetingsQueryKey, getGetMeetingQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2, Trash2, Calendar, Clock, MapPin, AlignLeft, Users, ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { useQueryClient } from "@tanstack/react-query";

export function MeetingDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const meetingId = Number(id);

  const { data: meeting, isLoading, error } = useGetMeeting(meetingId, {
    query: { enabled: !!meetingId, queryKey: getGetMeetingQueryKey(meetingId) },
  });

  const deleteMeeting = useDeleteMeeting();

  const handleDelete = () => {
    if (confirm("Удалить встречу? Это действие нельзя отменить.")) {
      deleteMeeting.mutate(
        { id: meetingId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetTodayMeetingsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetWeekMeetingsQueryKey() });
            setLocation("/");
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !meeting) {
    return (
      <Layout>
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md max-w-xl mx-auto mt-8 text-sm">
          Встреча не найдена или не удалось загрузить данные.
        </div>
      </Layout>
    );
  }

  const start = new Date(meeting.startTime);
  const end = new Date(meeting.endTime);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к календарю
        </button>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-border p-6 md:p-8 bg-muted/20 relative">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-foreground pr-12 md:pr-24">
              {meeting.title}
            </h1>

            <button
              onClick={handleDelete}
              disabled={deleteMeeting.isPending}
              className="absolute top-5 right-5 md:top-8 md:right-8 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              title="Удалить встречу"
            >
              {deleteMeeting.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </button>

            <div className="mt-5 flex flex-wrap gap-4 md:gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium text-foreground capitalize">
                  {format(start, "EEEE, d MMMM yyyy", { locale: ru })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground font-mono">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span className="font-bold text-foreground">
                  {format(start, "HH:mm")} — {format(end, "HH:mm")}
                </span>
              </div>
              {meeting.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{meeting.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            <div className="md:col-span-2 space-y-6">
              {meeting.description && (
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    <AlignLeft className="h-4 w-4" />
                    Повестка и заметки
                  </h3>
                  <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                    {meeting.description}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-6 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-10">
              {meeting.organizer && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Организатор
                  </h3>
                  <div className="flex items-center gap-3">
                    <Avatar employee={meeting.organizer} className="h-9 w-9" />
                    <div>
                      <div className="font-medium text-sm">{meeting.organizer.name}</div>
                      <div className="text-xs text-muted-foreground">{meeting.organizer.role}</div>
                    </div>
                  </div>
                </section>
              )}

              <section>
                <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  <Users className="h-4 w-4" />
                  Участники ({meeting.participants.length})
                </h3>
                <div className="space-y-2.5">
                  {meeting.participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <Avatar employee={p} />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.department}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
