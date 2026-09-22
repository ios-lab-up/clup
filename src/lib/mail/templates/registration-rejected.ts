import { detailBox, emailLayout, formatExamDate, type EmailContent } from "@/lib/mail/templates/layout";

export interface RegistrationRejectedProps {
  studentName: string;
  examName: string;
  termName: string;
  examDate: Date;
  reason?: string | null;
}

export function registrationRejectedEmail(props: RegistrationRejectedProps): EmailContent {
  const { studentName, examName, termName, examDate, reason } = props;
  const subject = `Hay un problema con tu inscripción • ${examName}`;
  const formattedDate = formatExamDate(examDate);
  const firstName = studentName.split(" ")[0] || studentName;

  const text = `¡Hola ${firstName}!

Revisamos tu inscripción y encontramos un problema con los documentos que enviaste, así que por ahora no pudimos aprobarla.
${reason ? `\nMotivo: ${reason}\n` : ""}
Buenas noticias: no necesitas volver a empezar. Entra a tu panel de alumno y sube de nuevo los documentos desde el mismo registro.

Examen: ${examName}
Term: ${termName}
Fecha: ${formattedDate}

Cualquier duda, contáctanos.`;

  const html = emailLayout(
    "Hay un problema con tu inscripción",
    `<p>¡Hola ${firstName}!</p>
     <p>Revisamos tu inscripción y encontramos un problema con los documentos que enviaste, así que por ahora <strong>no pudimos aprobarla</strong>.</p>
     ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ""}
     <p>Buenas noticias: no necesitas volver a empezar. Entra a tu panel de alumno y sube de nuevo los documentos desde el mismo registro.</p>
     ${detailBox([
       ["Examen", examName],
       ["Term", termName],
       ["Fecha", formattedDate],
     ])}
     <p style="color:#6b7280;font-size:13px;">Cualquier duda, contáctanos.</p>`,
  );

  return { subject, html, text };
}
