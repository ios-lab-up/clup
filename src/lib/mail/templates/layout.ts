export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function formatExamDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(date);
}

interface LayoutOptions {
  /** Color del acento (default wine). */
  accent?: string;
}

/** Envoltura visual compartida por todos los templates. Marca institucional CLUP. */
export function emailLayout(title: string, bodyHtml: string, options: LayoutOptions = {}): string {
  const accent = options.accent ?? "#8c1f3d";

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #eee;">
            <tr>
              <td style="background-color:${accent};padding:20px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;">CLUP</span>
                <span style="color:#f4a8b8;font-size:13px;display:block;">Centro de Lenguas • Universidad Panamericana</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#171717;line-height:1.55;">
                <h1 style="font-size:20px;margin:0 0 16px;color:#111;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background-color:#f9fafb;color:#6b7280;font-size:12px;">
                Este es un mensaje automático del Centro de Lenguas de la Universidad Panamericana.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Caja destacada con los datos del examen. */
export function detailBox(rows: Array<[string, string]>): string {
  const items = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">${label}</td>` +
        `<td style="padding:4px 0;color:#111;font-size:13px;font-weight:600;text-align:right;">${value}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" style="background-color:#faf6ee;border:1px solid #e8d5a8;border-radius:10px;padding:12px 16px;margin:16px 0;">${items}</table>`;
}
