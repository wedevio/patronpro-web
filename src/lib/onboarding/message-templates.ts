/**
 * Onboarding invite message templates
 *
 * Edit SUBJECT, EMAIL_HTML and SMS_TEXT to customize what the client receives.
 * Available variables (replaced at send time):
 *   {{firstName}}     — client's first name
 *   {{businessName}}  — client's business name
 *   {{link}}          — full onboarding URL with pre-filled locationId + contactId
 */

export const ONBOARDING_EMAIL_SUBJECT =
  "Complete su formulario de onboarding de PatronPro";

/**
 * EMAIL — HTML completo.
 * Usa las variables {{firstName}}, {{businessName}}, {{link}}.
 */
export const ONBOARDING_EMAIL_HTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a PatronPro</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1E2C46;padding:32px 40px;text-align:center;">
              <span style="color:#F67D0A;font-size:22px;font-weight:700;letter-spacing:-0.5px;">PatronPro</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#1E2C46;">
                Hola {{firstName}} 👋
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
                Gracias por registrarse con PatronPro.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                El primer paso es completar su formulario de onboarding para {{businessName}}. Este enlace nos permitirá reunir la información básica de su negocio y preparar su configuración inicial:
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#F67D0A;border-radius:10px;">
                    <a href="{{link}}"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
                      Completar formulario →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:15px;color:#374151;line-height:1.6;">
                Cuando termine el formulario, podrá reservar su cita con nuestro equipo de setup para continuar con la siguiente etapa.
              </p>

              <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
                Si el botón no abre, copie este enlace en su navegador:<br/>
                <a href="{{link}}" style="color:#1E2C46;word-break:break-all;">{{link}}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                PatronPro — El sistema de negocios para contratistas hispanos.<br/>
                Si tiene alguna pregunta, responda este correo o escríbanos por SMS.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

/**
 * SMS — Texto plano, máx 160 caracteres por segmento.
 * Usa las variables {{firstName}}, {{businessName}}, {{link}}.
 */
export const ONBOARDING_SMS_TEXT =
  `Hola {{firstName}}, gracias por registrarse con PatronPro. ` +
  `El primer paso para {{businessName}} es completar su formulario: {{link}} ` +
  `Después podrá reservar su cita de onboarding.`;

// ─── Interpolation helper ─────────────────────────────────────────────────────

export interface TemplateVars {
  firstName:    string;
  businessName: string;
  link:         string;
}

export function interpolate(template: string, vars: TemplateVars): string {
  return template
    .replace(/\{\{firstName\}\}/g,    vars.firstName)
    .replace(/\{\{businessName\}\}/g, vars.businessName)
    .replace(/\{\{link\}\}/g,         vars.link);
}
