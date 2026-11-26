import { jsPDF } from 'jspdf';
import { THESIS_STAGES } from '../data/guides';

export interface ThesisReminderSummary {
  stageId: string;
  stageNumber: string;
  stageTitle: string;
  targetDate: string;
  daysLeft: number;
}

export function computeDaysUntil(dateStr: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function getUrgentThesisReminders(
  stageDeadlines: Record<string, string>,
  completedTasks: Record<string, boolean>
): ThesisReminderSummary[] {
  const list: ThesisReminderSummary[] = [];
  for (const stage of THESIS_STAGES) {
    const isComplete = stage.tasks.every((t) => completedTasks[t.id]);
    if (isComplete) continue;
    const targetDate = stageDeadlines[stage.id];
    if (!targetDate) continue;
    const daysLeft = computeDaysUntil(targetDate);
    if (daysLeft === null) continue;
    if (daysLeft <= 3) {
      list.push({
        stageId: stage.id,
        stageNumber: stage.number,
        stageTitle: stage.title,
        targetDate,
        daysLeft,
      });
    }
  }
  return list.sort((a, b) => a.daysLeft - b.daysLeft);
}

export function formatDeadlineRelative(daysLeft: number): string {
  if (daysLeft < 0) return `Terlewat ${Math.abs(daysLeft)} hari`;
  if (daysLeft === 0) return 'Jatuh tempo hari ini';
  if (daysLeft === 1) return 'Jatuh tempo besok';
  return `H-${daysLeft} lagi`;
}

interface GenerateReportParams {
  completedTasks: Record<string, boolean>;
  stageDeadlines: Record<string, string>;
  studentName?: string;
  studentEmail?: string;
}

function formatDateId(date: Date): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function formatTargetDateId(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 'Belum diatur';
  const [y, m, d] = dateStr.split('-').map(Number);
  return formatDateId(new Date(y, m - 1, d));
}

export function exportThesisWeeklyReportPdf({
  completedTasks,
  stageDeadlines,
  studentName,
  studentEmail,
}: GenerateReportParams): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;
  let y = 20;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 18) {
      doc.addPage();
      y = 20;
    }
  };

  const now = new Date();
  const dateSlug = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  const allTasks = THESIS_STAGES.flatMap((s) => s.tasks);
  const doneCount = allTasks.filter((t) => completedTasks[t.id]).length;
  const percent = Math.round((doneCount / allTasks.length) * 100);
  const urgentReminders = getUrgentThesisReminders(stageDeadlines, completedTasks);

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216);
  doc.text('PUSTAKA BANTU MAHASISWA', marginX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(82, 96, 122);
  doc.text(`Tanggal laporan: ${formatDateId(now)}`, pageWidth - marginX, y, {
    align: 'right',
  });

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(17, 28, 51);
  doc.text('Laporan Mingguan Progres Skripsi', marginX, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(74, 88, 115);
  const identityLine = studentName
    ? `Mahasiswa: ${studentName}${studentEmail ? ` (${studentEmail})` : ''}`
    : 'Ringkasan status penyelesaian 6 tahap tugas akhir';
  doc.text(identityLine, marginX, y);

  y += 5;
  doc.setDrawColor(213, 220, 234);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, pageWidth - marginX, y);

  // Summary Box
  y += 7;
  doc.setFillColor(247, 249, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, contentWidth, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 28, 51);
  doc.text('Ringkasan Penyelesaian Keseluruhan', marginX + 5, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(29, 78, 216);
  doc.text(`${percent}% (${doneCount}/${allTasks.length} tugas)`, pageWidth - marginX - 5, y + 8, {
    align: 'right',
  });

  // Progress Bar inside Summary Box
  const barX = marginX + 5;
  const barY = y + 14;
  const barW = contentWidth - 10;
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(barX, barY, barW, 4, 2, 2, 'F');
  if (percent > 0) {
    doc.setFillColor(29, 78, 216);
    doc.roundedRect(barX, barY, Math.max(4, (barW * percent) / 100), 4, 2, 2, 'F');
  }

  y += 31;

  // Urgent Deadlines Box (if any)
  if (urgentReminders.length > 0) {
    const boxHeight = 10 + urgentReminders.length * 5.5;
    ensureSpace(boxHeight + 6);
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(252, 211, 77);
    doc.roundedRect(marginX, y, contentWidth, boxHeight, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(146, 64, 14);
    doc.text(
      `Perhatian Tenggat Dekat (${urgentReminders.length} tahap):`,
      marginX + 5,
      y + 6.5
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    urgentReminders.forEach((item, idx) => {
      const lineY = y + 12 + idx * 5.2;
      doc.text(
        `- Tahap ${item.stageNumber} (${item.stageTitle}): ${formatDeadlineRelative(
          item.daysLeft
        )} [${formatTargetDateId(item.targetDate)}]`,
        marginX + 6,
        lineY
      );
    });

    y += boxHeight + 7;
  }

  // Stage-by-stage Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 28, 51);
  doc.text('Rincian 6 Tahap Skripsi', marginX, y);
  y += 6;

  for (const stage of THESIS_STAGES) {
    const stageDone = stage.tasks.filter((t) => completedTasks[t.id]).length;
    const isComplete = stageDone === stage.tasks.length;
    const targetDate = stageDeadlines[stage.id] || '';
    const daysLeft = targetDate ? computeDaysUntil(targetDate) : null;

    const statusText = isComplete
      ? 'SELESAI'
      : stageDone > 0
        ? `BERJALAN (${stageDone}/${stage.tasks.length})`
        : `BELUM MULAI (0/${stage.tasks.length})`;

    const deadlineText = targetDate
      ? `Target: ${formatTargetDateId(targetDate)}${
          !isComplete && daysLeft !== null ? ` (${formatDeadlineRelative(daysLeft)})` : ''
        }`
      : 'Target tanggal: belum diatur';

    const estimatedBlockHeight = 16 + stage.tasks.length * 6.5;
    ensureSpace(estimatedBlockHeight);

    // Stage Card Header
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, y, contentWidth, 12.5, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(17, 28, 51);
    doc.text(`Tahap ${stage.number} - ${stage.title}`, marginX + 4, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    if (isComplete) {
      doc.setTextColor(5, 150, 105);
    } else if (stageDone > 0) {
      doc.setTextColor(29, 78, 216);
    } else {
      doc.setTextColor(100, 116, 139);
    }
    doc.text(statusText, pageWidth - marginX - 4, y + 5.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(82, 96, 122);
    doc.text(deadlineText, marginX + 4, y + 10.2);

    y += 16;

    // Tasks List
    for (const task of stage.tasks) {
      const checked = Boolean(completedTasks[task.id]);
      const prefix = checked ? '[x]' : '[ ]';
      const wrapped = doc.splitTextToSize(`${prefix}  ${task.label}`, contentWidth - 8);
      ensureSpace(wrapped.length * 4.8 + 2);

      doc.setFont('helvetica', checked ? 'normal' : 'normal');
      doc.setFontSize(9.5);
      if (checked) {
        doc.setTextColor(5, 120, 87);
      } else {
        doc.setTextColor(30, 41, 59);
      }
      doc.text(wrapped, marginX + 4, y);
      y += wrapped.length * 4.8 + 1.5;
    }

    y += 3.5;
  }

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Pustaka Bantu Mahasiswa - Laporan Mingguan Progres Skripsi',
      marginX,
      pageHeight - 8
    );
    doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - marginX, pageHeight - 8, {
      align: 'right',
    });
  }

  doc.save(`laporan-skripsi-${dateSlug}.pdf`);
}
