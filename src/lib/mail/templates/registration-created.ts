import { detailBox, emailLayout, formatExamDate, type EmailContent } from "@/lib/mail/templates/layout";

export interface RegistrationCreatedProps {
  studentName: string;
  examName: string;
  termName: string;
  examDate: Date;
}

export function registrationCreatedEmail(props: RegistrationCreatedProps): EmailContent {
  const { studentName, examName, termName, examDate } = props;
  const subject = `¡Recibimos tu inscripción! • ${examName}`;
  const formattedDate = formatExamDate(examDate);
  const firstName = studentName.split(" ")[0] || studentName;

  const text = `¡Hola ${firstName}!

Recibimos tu inscripción y ya está en revisión.

Ahora solo necesitas esperar: nuestro equipo revisará tus documentos y, en cuanto todo esté en orden, te enviaremos un correo confirmando tu lugar. No necesitas hacer nada más por ahora.

Examen: ${examName}
Term: ${termName}
Fecha: ${formattedDate}

Gracias por elegir al Centro de Lenguas. ¡Estamos emocionados de acompañarte en este paso!`;

  const html = emailLayout(
    "¡Recibimos tu inscripción!",
    `<p>¡Hola ${firstName}!</p>
     <p>Recibimos tu inscripción y ya está <strong>en revisión</strong>.</p>
     <p>Ahora solo necesitas <strong>esperar</strong>: nuestro equipo revisará tus documentos y, en cuanto todo esté en orden, te enviaremos un correo <strong>confirmando tu lugar</strong>. No necesitas hacer nada más por ahora.</p>
     ${detailBox([
       ["Examen", examName],
       ["Term", termName],
       ["Fecha", formattedDate],
     ])}
     <p style="color:#6b7280;font-size:13px;">Gracias por elegir al Centro de Lenguas. ¡Estamos emocionados de acompañarte en este paso!</p>`,
  );

  return { subject, html, text };
}
