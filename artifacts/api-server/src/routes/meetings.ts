import { Router, type IRouter } from "express";
import { and, eq, inArray, lt, gt, ne, gte, lte, sql } from "drizzle-orm";
import { db, employeesTable, meetingsTable, meetingParticipantsTable } from "@workspace/db";
import {
  CreateMeetingBody,
  CheckConflictBody,
  GetMeetingParams,
  DeleteMeetingParams,
  ListMeetingsResponse,
  GetMeetingResponse,
  GetTodayMeetingsResponse,
  GetWeekMeetingsResponse,
  CheckConflictResponse,
  CreateMeetingResponse,
} from "@workspace/api-zod";
const router: IRouter = Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseListMeetingsQuery(q: Record<string, unknown>) {
  const from = typeof q.from === "string" && DATE_RE.test(q.from) ? q.from : undefined;
  const to = typeof q.to === "string" && DATE_RE.test(q.to) ? q.to : undefined;
  const rawEid = q.employeeId;
  const employeeId = rawEid != null && rawEid !== "" ? Number(rawEid) : undefined;
  if (employeeId !== undefined && (!Number.isFinite(employeeId) || employeeId <= 0)) {
    return { error: "Некорректный employeeId" };
  }
  if (q.from && !from) return { error: "Некорректный формат from (YYYY-MM-DD)" };
  if (q.to && !to) return { error: "Некорректный формат to (YYYY-MM-DD)" };
  return { data: { from, to, employeeId } };
}

// Helper: build a full meeting object with organizer + participants
async function buildMeeting(meetingId: number) {
  const meeting = await db
    .select()
    .from(meetingsTable)
    .where(eq(meetingsTable.id, meetingId))
    .then((rows) => rows[0]);

  if (!meeting) return null;

  const [organizer, participantLinks] = await Promise.all([
    db.select().from(employeesTable).where(eq(employeesTable.id, meeting.organizerId)).then((r) => r[0]),
    db.select().from(meetingParticipantsTable).where(eq(meetingParticipantsTable.meetingId, meetingId)),
  ]);

  const participants =
    participantLinks.length > 0
      ? await db
          .select()
          .from(employeesTable)
          .where(inArray(employeesTable.id, participantLinks.map((p) => p.employeeId)))
      : [];

  return { ...meeting, organizer, participants };
}

async function buildManyMeetings(meetingIds: number[]) {
  if (meetingIds.length === 0) return [];
  const results = await Promise.all(meetingIds.map((id) => buildMeeting(id)));
  return results.filter((m) => m != null);
}

// Find conflicts for given participants in a time window, optionally excluding a meeting
async function findConflicts(
  startTime: Date,
  endTime: Date,
  participantIds: number[],
  excludeMeetingId?: number | null
) {
  if (participantIds.length === 0) return [];

  const overlappingLinks = await db
    .select({
      meetingId: meetingParticipantsTable.meetingId,
      employeeId: meetingParticipantsTable.employeeId,
    })
    .from(meetingParticipantsTable)
    .innerJoin(meetingsTable, eq(meetingParticipantsTable.meetingId, meetingsTable.id))
    .where(
      and(
        inArray(meetingParticipantsTable.employeeId, participantIds),
        lt(meetingsTable.startTime, endTime),
        gt(meetingsTable.endTime, startTime),
        excludeMeetingId != null ? ne(meetingsTable.id, excludeMeetingId) : undefined
      )
    );

  if (overlappingLinks.length === 0) return [];

  const uniqueEmpIds = [...new Set(overlappingLinks.map((l) => l.employeeId))];
  const uniqueMeetingIds = [...new Set(overlappingLinks.map((l) => l.meetingId))];

  const [employees, conflictingMeetings] = await Promise.all([
    db.select().from(employeesTable).where(inArray(employeesTable.id, uniqueEmpIds)),
    db.select().from(meetingsTable).where(inArray(meetingsTable.id, uniqueMeetingIds)),
  ]);

  const empMap = new Map(employees.map((e) => [e.id, e]));
  const meetMap = new Map(conflictingMeetings.map((m) => [m.id, m]));

  return overlappingLinks
    .map((link) => {
      const emp = empMap.get(link.employeeId);
      const mtg = meetMap.get(link.meetingId);
      if (!emp || !mtg) return null;
      return {
        employeeId: link.employeeId,
        employeeName: emp.name,
        conflictingMeetingId: link.meetingId,
        conflictingMeetingTitle: mtg.title,
      };
    })
    .filter((c) => c != null);
}

// GET /meetings/today
router.get("/meetings/today", async (_req, res): Promise<void> => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const rows = await db
    .select()
    .from(meetingsTable)
    .where(and(gte(meetingsTable.startTime, startOfDay), lte(meetingsTable.startTime, endOfDay)))
    .orderBy(meetingsTable.startTime);

  const meetings = await buildManyMeetings(rows.map((r) => r.id));
  res.json(GetTodayMeetingsResponse.parse(meetings));
});

// GET /meetings/week
router.get("/meetings/week", async (_req, res): Promise<void> => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const rows = await db
    .select()
    .from(meetingsTable)
    .where(and(gte(meetingsTable.startTime, monday), lte(meetingsTable.startTime, sunday)))
    .orderBy(meetingsTable.startTime);

  const meetings = await buildManyMeetings(rows.map((r) => r.id));
  res.json(GetWeekMeetingsResponse.parse(meetings));
});

// POST /meetings/check-conflict
router.post("/meetings/check-conflict", async (req, res): Promise<void> => {
  const parsed = CheckConflictBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { startTime, endTime, participantIds, excludeMeetingId } = parsed.data;

  if (new Date(endTime) <= new Date(startTime)) {
    res.status(400).json({ error: "Время окончания должно быть позже времени начала" });
    return;
  }

  const conflicts = await findConflicts(
    new Date(startTime),
    new Date(endTime),
    participantIds,
    excludeMeetingId
  );

  res.json(CheckConflictResponse.parse({ hasConflict: conflicts.length > 0, conflicts }));
});

// GET /meetings
router.get("/meetings", async (req, res): Promise<void> => {
  const parsed = parseListMeetingsQuery(req.query as Record<string, unknown>);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const { from, to, employeeId } = parsed.data;
  const conditions = [];

  if (from) conditions.push(gte(meetingsTable.startTime, new Date(`${from}T00:00:00Z`)));
  if (to) {
    const toDate = new Date(`${to}T23:59:59Z`);
    conditions.push(lte(meetingsTable.startTime, toDate));
  }

  let rows = await db
    .select()
    .from(meetingsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(meetingsTable.startTime);

  if (employeeId != null) {
    const participantLinks = await db
      .select()
      .from(meetingParticipantsTable)
      .where(eq(meetingParticipantsTable.employeeId, employeeId));
    const meetingIds = new Set(participantLinks.map((l) => l.meetingId));
    rows = rows.filter((r) => r.organizerId === employeeId || meetingIds.has(r.id));
  }

  const meetings = await buildManyMeetings(rows.map((r) => r.id));
  res.json(ListMeetingsResponse.parse(meetings));
});

// POST /meetings — atomic conflict check + insert
router.post("/meetings", async (req, res): Promise<void> => {
  const parsed = CreateMeetingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, startTime, endTime, organizerId, participantIds, location } = parsed.data;

  if (new Date(endTime) <= new Date(startTime)) {
    res.status(400).json({ error: "Время окончания должно быть позже времени начала" });
    return;
  }

  const allParticipantIds = Array.from(new Set([organizerId, ...participantIds]));

  // Use a transaction with advisory lock per participant set to prevent race conditions
  const result = await db.transaction(async (tx) => {
    // Lock rows for affected participants to prevent concurrent conflict bypass
    if (allParticipantIds.length > 0) {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(${sql.join(allParticipantIds.map((id) => sql`${id}`), sql`, `)})`
      );
    }

    const conflicts = await findConflicts(new Date(startTime), new Date(endTime), allParticipantIds);
    if (conflicts.length > 0) {
      return { conflict: true, conflicts };
    }

    const [meeting] = await tx
      .insert(meetingsTable)
      .values({
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        organizerId,
        location,
      })
      .returning();

    await tx.insert(meetingParticipantsTable).values(
      allParticipantIds.map((eid) => ({ meetingId: meeting.id, employeeId: eid }))
    );

    return { conflict: false, meetingId: meeting.id };
  });

  if (result.conflict) {
    res.status(409).json({ error: "Конфликт расписания", conflicts: result.conflicts });
    return;
  }

  const full = await buildMeeting(result.meetingId!);
  res.status(201).json(CreateMeetingResponse.parse(full));
});

// GET /meetings/:id
router.get("/meetings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetMeetingParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректный ID встречи" });
    return;
  }

  const meeting = await buildMeeting(parsed.data.id);
  if (!meeting) {
    res.status(404).json({ error: "Встреча не найдена" });
    return;
  }

  res.json(GetMeetingResponse.parse(meeting));
});

// DELETE /meetings/:id
router.delete("/meetings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DeleteMeetingParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректный ID встречи" });
    return;
  }

  const [deleted] = await db
    .delete(meetingsTable)
    .where(eq(meetingsTable.id, parsed.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Встреча не найдена" });
    return;
  }

  res.sendStatus(204);
});

export default router;
