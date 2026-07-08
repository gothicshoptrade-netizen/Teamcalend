import { useState } from "react";
import { useListEmployees, useCreateMeeting, useCheckConflict, getGetTodayMeetingsQueryKey, getGetWeekMeetingsQueryKey, getListMeetingsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { format, addHours, startOfHour } from "date-fns";
import { Loader2, AlertCircle, Calendar as CalendarIcon, Clock, MapPin, Users, Type, CheckCircle2 } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { useQueryClient } from "@tanstack/react-query";

export function NewMeeting() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: employees } = useListEmployees();
  const createMeeting = useCreateMeeting();
  const checkConflict = useCheckConflict();

  const defaultStart = startOfHour(addHours(new Date(), 1));
  const defaultEnd = addHours(defaultStart, 1);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationStr, setLocationStr] = useState("");
  const [date, setDate] = useState(format(defaultStart, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(format(defaultStart, "HH:mm"));
  const [endTime, setEndTime] = useState(format(defaultEnd, "HH:mm"));
  const [organizerId, setOrganizerId] = useState<number | "">("");
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [conflictError, setConflictError] = useState<{ error: string; conflicts: { employeeName: string; conflictingMeetingTitle: string }[] } | null>(null);
  const [conflictClear, setConflictClear] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleToggleParticipant = (id: number) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
    setConflictError(null);
    setConflictClear(false);
  };

  const getIsoTimes = () => ({
    startISO: new Date(`${date}T${startTime}:00`).toISOString(),
    endISO: new Date(`${date}T${endTime}:00`).toISOString(),
  });

  const runConflictCheck = async (): Promise<boolean> => {
    if (!organizerId || participantIds.length === 0) return true;
    setConflictError(null);
    setConflictClear(false);
    const { startISO, endISO } = getIsoTimes();
    const allParticipants = Array.from(new Set([...participantIds, Number(organizerId)]));
    try {
      const res = await checkConflict.mutateAsync({
        data: { startTime: startISO, endTime: endISO, participantIds: allParticipants },
      });
      if (res.hasConflict && res.conflicts.length > 0) {
        setConflictError({ error: "Конфликт в расписании", conflicts: res.conflicts });
        return false;
      }
      setConflictClear(true);
      return true;
    } catch {
      return false;
    }
  };

  // NOT a form submit — called only from button click
  const handleCreate = async () => {
    setSubmitError(null);
    if (!title.trim()) { setSubmitError("Введите название встречи"); return; }
    if (!organizerId) { setSubmitError("Выберите организатора"); return; }
    if (participantIds.length === 0) { setSubmitError("Выберите хотя бы одного участника"); return; }

    const { startISO, endISO } = getIsoTimes();
    if (new Date(endISO) <= new Date(startISO)) {
      setSubmitError("Время окончания должно быть позже времени начала");
      return;
    }

    createMeeting.mutate(
      {
        data: {
          title: title.trim(),
          description,
          startTime: startISO,
          endTime: endISO,
          organizerId: Number(organizerId),
          participantIds,
          location: locationStr,
        },
      },
      {
        onSuccess: (meeting) => {
          queryClient.invalidateQueries({ queryKey: getGetTodayMeetingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetWeekMeetingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListMeetingsQueryKey() });
          setLocation(`/meetings/${meeting.id}`);
        },
        onError: (error: unknown) => {
          const e = error as { conflicts?: { employeeName: string; conflictingMeetingTitle: string }[]; status?: number };
          if (e?.conflicts) {
            setConflictError({ error: "Конфликт в расписании", conflicts: e.conflicts });
          } else {
            setSubmitError("Не удалось создать встречу. Попробуйте ещё раз.");
          }
        },
      }
    );
  };

  // Prevent Enter key from accidentally triggering anything unexpected
  const blockEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault();
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Новая встреча</h1>
          <p className="text-muted-foreground mt-1 text-sm">Запланируйте встречу и согласуйте время с командой.</p>
        </header>

        {/* This is a div, NOT a form — prevents any browser-native form submission */}
        <div className="space-y-6">

          {/* Conflict / error banners */}
          {conflictError && (
            <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-md">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-destructive">{conflictError.error}</h3>
                  <ul className="mt-2 space-y-1 text-sm text-destructive/90">
                    {conflictError.conflicts.map((c, i) => (
                      <li key={i}>
                        <span className="font-semibold">{c.employeeName}</span> уже занят — «{c.conflictingMeetingTitle}»
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {conflictClear && !conflictError && (
            <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-r-md flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Время свободно — конфликтов нет
            </div>
          )}

          {submitError && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3 rounded-md">
              {submitError}
            </div>
          )}

          {/* Details block */}
          <div className="bg-card border border-border p-5 md:p-6 rounded-lg space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-1.5">
                <Type className="h-4 w-4 text-muted-foreground" />
                Название встречи
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setSubmitError(null); }}
                onKeyDown={blockEnter}
                placeholder="Например: Планёрка по коллекции SS26"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Date + Time row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-1.5">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  Дата
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setConflictError(null); setConflictClear(false); }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Начало
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => { setStartTime(e.target.value); setConflictError(null); setConflictClear(false); }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Конец</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => { setEndTime(e.target.value); setConflictError(null); setConflictClear(false); }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-1.5">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Место (необязательно)
              </label>
              <input
                type="text"
                value={locationStr}
                onChange={(e) => setLocationStr(e.target.value)}
                onKeyDown={blockEnter}
                placeholder="Например: Zoom, Telegram, Переговорная А"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 block">Описание / повестка</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Что обсуждаем, что решаем..."
              />
            </div>
          </div>

          {/* Participants block */}
          <div className="bg-card border border-border p-5 md:p-6 rounded-lg space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Организатор
              </label>
              <select
                value={organizerId}
                onChange={(e) => { setOrganizerId(Number(e.target.value)); setConflictError(null); setConflictClear(false); setSubmitError(null); }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" disabled>Выберите организатора</option>
                {employees?.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name} — {emp.role}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold">
                  Участники
                  {participantIds.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal">выбрано: {participantIds.length}</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={runConflictCheck}
                  disabled={checkConflict.isPending || !organizerId || participantIds.length === 0}
                  className="text-xs font-medium text-primary hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1"
                >
                  {checkConflict.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Проверить доступность
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-1 bg-muted/30 rounded-md border border-border/50">
                {employees?.map((emp) => {
                  const isSelected = participantIds.includes(emp.id);
                  const isOrganizer = organizerId === emp.id;
                  if (isOrganizer) return null;
                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleToggleParticipant(emp.id)}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors border select-none ${
                        isSelected
                          ? "bg-primary/5 border-primary/30 ring-1 ring-primary/30"
                          : "bg-card border-transparent hover:border-border"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-gray-300 text-primary pointer-events-none"
                      />
                      <Avatar employee={emp} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{emp.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{emp.role}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-8">
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={createMeeting.isPending || checkConflict.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {(createMeeting.isPending || checkConflict.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Создать встречу
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
