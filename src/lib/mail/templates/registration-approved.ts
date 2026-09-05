import { detailBox, emailLayout, formatExamDate, type EmailContent } from "@/lib/mail/templates/layout";

export interface RegistrationApprovedProps {
  studentName: string;
  examName: string;
  termName: string;
  examDate: Date;
  info?: string | null;
}

export function registrationApprovedEmail(props: RegistrationApprovedProps): EmailContent {
  const { studentName, examName, termName, examDate, info } = props;
  const subject = `¡Tu lugar está confirmado! • ${examName}`;
  const formattedDate = formatExamDate(examDate);
  const firstName = studentName.split(" ")[0] || studentName;

  const text = `¡Felicidades, ${firstName}!

¡Tu inscripción quedó confirmada y todo está listo! Ya tienes tu lugar apartado para presentar tu examen.

Examen: ${examName}
Term: ${termName}
Fecha: ${formattedDate}

¿Cómo prepararte?
• Llega al menos 30 minutos antes.
• Trae una identificación oficial vigente.
• Descansa bien la noche anterior: estás listo.
${info ? `\n${info}\n` : ""}
Te enviaremos un recordatorio un día antes. ¡Mucho éxito, confiamos en ti!`;

  const html = emailLayout(
    "¡Tu lugar está confirmado!",
    `<p>¡Felicidades, ${firstName}!</p>
     <p>Tu inscripción quedó <strong>confirmada</strong> y <strong>todo está listo</strong>. Ya tienes tu lugar apartado para presentar tu examen.</p>
     ${detailBox([
       ["Examen", examName],
       ["Term", termName],
       ["Fecha", formattedDate],
     ])}
     <p style="font-weight:600;margin-bottom:4px;">¿Cómo prepararte?</p>
     <ul style="margin:0 0 12px;padding-left:18px;color:#374151;font-size:14px;">
       <li>Llega al menos 30 minutos antes.</li>
       <li>Trae una identificación oficial vigente.</li>
       <li>Descansa bien la noche anterior: estás listo.</li>
     </ul>
     ${info ? `<p>${info}</p>` : ""}
     <p style="color:#6b7280;font-size:13px;">Te enviaremos un recordatorio un día antes. ¡Mucho éxito, confiamos en ti!</p>`,
  );

  return { subject, html, text };
}
