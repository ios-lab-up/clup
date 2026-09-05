import { detailBox, emailLayout, formatExamDate, type EmailContent } from "@/lib/mail/templates/layout";

export interface ExamReminderProps {
  studentName: string;
  examName: string;
  examDate: Date;
  info?: string | null;
  instructions?: string | null;
}

export function examReminderEmail(props: ExamReminderProps): EmailContent {
  const { studentName, examName, examDate, info, instructions } = props;
  const subject = `¡Mañana es tu examen! • ${examName}`;
  const formattedDate = formatExamDate(examDate);
  const firstName = studentName.split(" ")[0] || studentName;

  const text = `¡Hola ${firstName}!

Solo un recordatorio cariñoso: mañana es tu examen. Ya casi llegas, y sabemos que lo vas a hacer muy bien.

Examen: ${examName}
Fecha: ${formattedDate}

Antes de mañana:
• Prepara tu identificación oficial vigente.
• Llega 30 minutos antes.
• Duerme bien y desayuna: tu mente lo agradecerá.
${instructions ? `\nInstrucciones: ${instructions}\n` : ""}${info ? `\n${info}\n` : ""}
¡Mucho éxito! Confiamos en ti.`;

  const html = emailLayout(
    "¡Mañana es tu examen!",
    `<p>¡Hola ${firstName}!</p>
     <p>Solo un recordatorio cariñoso: <strong>mañana es tu examen</strong>. Ya casi llegas, y sabemos que lo vas a hacer muy bien.</p>
     ${detailBox([
       ["Examen", examName],
       ["Fecha", formattedDate],
     ])}
     <p style="font-weight:600;margin-bottom:4px;">Antes de mañana:</p>
     <ul style="margin:0 0 12px;padding-left:18px;color:#374151;font-size:14px;">
       <li>Prepara tu identificación oficial vigente.</li>
       <li>Llega 30 minutos antes.</li>
       <li>Duerme bien y desayuna: tu mente lo agradecerá.</li>
     </ul>
     ${instructions ? `<p><strong>Instrucciones:</strong> ${instructions}</p>` : ""}
     ${info ? `<p>${info}</p>` : ""}
     <p style="color:#6b7280;font-size:13px;">¡Mucho éxito! Confiamos en ti.</p>`,
  );

  return { subject, html, text };
}
