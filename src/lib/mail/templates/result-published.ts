import { detailBox, emailLayout, type EmailContent } from "@/lib/mail/templates/layout";

export interface ResultPublishedProps {
  studentName: string;
  examName: string;
}

export function resultPublishedEmail(props: ResultPublishedProps): EmailContent {
  const { studentName, examName } = props;
  const subject = `¡Tus resultados ya están listos! • ${examName}`;
  const firstName = studentName.split(" ")[0] || studentName;

  const text = `¡Hola ${firstName}!

Tenemos buenas noticias: ¡tus resultados ya están disponibles!

Examen: ${examName}

Entra a tu panel de alumno para revisar tu puntaje y ver si aprobaste. Por seguridad, tus resultados solo se muestran dentro de tu cuenta.

Inicia sesión y revisa tu panel de alumno.

¡Gracias por tu esfuerzo y por confiar en el Centro de Lenguas!`;

  const html = emailLayout(
    "¡Tus resultados ya están listos!",
    `<p>¡Hola ${firstName}!</p>
     <p>Tenemos buenas noticias: <strong>tus resultados ya están disponibles</strong>.</p>
     ${detailBox([["Examen", examName]])}
     <p>Entra a tu <strong>panel de alumno</strong> para revisar tu puntaje y ver si aprobaste. Por seguridad, tus resultados solo se muestran dentro de tu cuenta.</p>
     <p style="color:#6b7280;font-size:13px;">¡Gracias por tu esfuerzo y por confiar en el Centro de Lenguas!</p>`,
  );

  return { subject, html, text };
}
