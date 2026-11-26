export interface ThesisCalendarEvent {
  stageId: string;
  stageNumber: string;
  stageTitle: string;
  stageSubtitle: string;
  targetDate: string; // YYYY-MM-DD
  tasks: Array<{ label: string; done: boolean }>;
}

function parseYmd(dateStr: string): { year: number; month: number; day: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(dt.getTime())) return null;
  return { year, month, day };
}

function formatCompactYmd(year: number, month: number, day: number): string {
  return `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
}

function getAllDayDateRange(dateStr: string): { start: string; end: string } | null {
  const parsed = parseYmd(dateStr);
  if (!parsed) return null;
  const start = formatCompactYmd(parsed.year, parsed.month, parsed.day);
  const nextDay = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + 1));
  const end = formatCompactYmd(
    nextDay.getUTCFullYear(),
    nextDay.getUTCMonth() + 1,
    nextDay.getUTCDate()
  );
  return { start, end };
}

function buildEventSummary(event: ThesisCalendarEvent): string {
  return `Tenggat Skripsi Tahap ${event.stageNumber}: ${event.stageTitle}`;
}

function buildEventDescription(event: ThesisCalendarEvent): string {
  const doneCount = event.tasks.filter((t) => t.done).length;
  const checklist = event.tasks
    .map((t) => `${t.done ? '[x]' : '[ ]'} ${t.label}`)
    .join('\n');

  return [
    event.stageSubtitle,
    `Progres saat ekspor: ${doneCount}/${event.tasks.length} tugas selesai.`,
    '',
    'Daftar tonggak:',
    checklist,
    '',
    'Dibuat dari Pustaka Bantu Mahasiswa',
  ].join('\n');
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatUtcStamp(date: Date): string {
  return (
    `${date.getUTCFullYear()}` +
    `${String(date.getUTCMonth() + 1).padStart(2, '0')}` +
    `${String(date.getUTCDate()).padStart(2, '0')}T` +
    `${String(date.getUTCHours()).padStart(2, '0')}` +
    `${String(date.getUTCMinutes()).padStart(2, '0')}` +
    `${String(date.getUTCSeconds()).padStart(2, '0')}Z`
  );
}

function buildVEventBlock(event: ThesisCalendarEvent, stamp: string): string | null {
  const range = getAllDayDateRange(event.targetDate);
  if (!range) return null;

  const summary = escapeIcsText(buildEventSummary(event));
  const description = escapeIcsText(buildEventDescription(event));
  const uid = `pustaka-skripsi-${event.stageId}-${range.start}@pustakabantu`;

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${range.start}`,
    `DTEND;VALUE=DATE:${range.end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(`Pengingat H-1: ${buildEventSummary(event)}`)}`,
    'END:VALARM',
    'END:VEVENT',
  ].join('\r\n');
}

export function buildGoogleCalendarUrl(event: ThesisCalendarEvent): string {
  const range = getAllDayDateRange(event.targetDate);
  if (!range) return 'https://calendar.google.com/';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: buildEventSummary(event),
    dates: `${range.start}/${range.end}`,
    details: buildEventDescription(event),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function triggerIcsDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadThesisStageIcs(event: ThesisCalendarEvent): boolean {
  const stamp = formatUtcStamp(new Date());
  const block = buildVEventBlock(event, stamp);
  if (!block) return false;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pustaka Bantu Mahasiswa//Pelacak Skripsi//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    block,
    'END:VCALENDAR',
    '',
  ].join('\r\n');

  triggerIcsDownload(`tenggat-skripsi-tahap-${event.stageNumber}-${event.targetDate}.ics`, ics);
  return true;
}

export function downloadAllThesisDeadlinesIcs(events: ThesisCalendarEvent[]): boolean {
  const stamp = formatUtcStamp(new Date());
  const blocks = events
    .map((ev) => buildVEventBlock(ev, stamp))
    .filter((block): block is string => Boolean(block));
  if (blocks.length === 0) return false;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pustaka Bantu Mahasiswa//Pelacak Skripsi//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...blocks,
    'END:VCALENDAR',
    '',
  ].join('\r\n');

  triggerIcsDownload('jadwal-tenggat-skripsi.ics', ics);
  return true;
}
