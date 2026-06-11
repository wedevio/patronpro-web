# Liverpool Digital Manual QA + Agent QA Walkthrough

Date: 2026-06-11
Location ID: `4cPIvLND9hFAIzWQ1ZbL`
Source artifacts:
- `qc-agent-supabase-ghl-2026-06-11.json`
- `export-docs-agent-supabase-2026-06-11.json`
- `doc-pages/doc-pages.md`

Guardrail: Supabase/GHL checks were read-only. No Supabase DB writes, GHL writes, account approvals, Twilio/Stripe actions, or publish actions were performed in this pass.

Status key:
- Manual: Pending means Oscar still needs to verify in the UI/process.
- Agent: Done means current read-only evidence or prior approved automation proves it.
- Agent: Failed means current evidence says the item is not ready.
- Agent: Pending means it is client-gated, UI-only, or still needs a human/manual pass.

## Fase 1 - Alta y Captura

1. Pre-registro/contacto creado en PatronPro/GHL. Manual: Pending. Agent: Done.
   Evidence: GHL location exists and panel contact ID is known: `KwxtqWZxAc1OJQ39zjGg`.

2. Pago inicial / alta comercial confirmada. Manual: Pending. Agent: Pending.
   Evidence: current QC does not prove the initial sale/payment. Transaction count is `0`, but that is not enough to prove or disprove the original PatronPro subscription payment.

3. Cita de onboarding agendada. Manual: Pending. Agent: Pending.
   Evidence: no current Supabase/GHL QC row proves appointment existence.

4. Cuenta en pausa / no activada todavía. Manual: Pending. Agent: Done.
   Evidence: `approved_at` is `null`; account is not approved in panel state.

5. Formulario de onboarding recibido. Manual: Pending. Agent: Done.
   Evidence: `form` passed; submitted at `2026-06-09T19:20:55.779+00:00`; business name `Picturelle`.

6. Email de preparación de la cita enviado. Manual: Pending. Agent: Pending.
   Evidence: not proven by current QC.

7. Portal interno / Supabase panel state readable. Manual: Pending. Agent: Done.
   Evidence: Supabase env passed, `export-docs` passed with `pageCount=2`, and account/checklist/website state is readable.

## Fase 2 - Configuración Previa

8. Snapshot base verificado: pipelines, workflows, forms, snippets, dashboard, legal pages. Manual: Pending. Agent: Pending.
   Evidence: not fully covered by current QC. Onboarding workflow evidence is failing.

9. Vista Add Contact: `Language` obligatorio y DND removido. Manual: Pending. Agent: Done.
   Evidence: prior WSL Profile 9 QA verified `Language *` present and DND/DnD absent.

10. Calendarios asignados al usuario principal. Manual: Pending. Agent: Done.
    Evidence: `calendar_owner_assignment` passed.

11. Calendarios activados. Manual: Pending. Agent: Done.
    Evidence: `calendar_activation` and `calendar` passed.

12. Disponibilidad/free-slots de calendarios. Manual: Pending. Agent: Done.
    Evidence: prior free-slot QA passed for both onboarding calendars. Manual should still confirm desired hours and same-day booking preference.

13. Dominio/DNS conectado en GHL. Manual: Pending. Agent: Failed.
    Evidence: `domain` failed; `customDomain` is empty while `dominio_web` is `build.picturelle.com`.

14. Website HTML/images generados en PatronPro. Manual: Pending. Agent: Done.
    Evidence: `website_generated_assets` passed; status `ready`, images `ready`, current HTML length `30271`.

15. Website HTML publicado/guardado en GHL con versión actual. Manual: Pending. Agent: Failed.
    Evidence: `landing` failed; `publicationEvidence` is empty. Also current PatronPro HTML hash differs from the older GHL-saved block hash.

16. `landing_form` retenido hasta aprobación Twilio. Manual: Pending. Agent: Done.
    Evidence: `landing_form_gate` passed; Twilio inactive and `landing_form` absent/deferred.

17. Brand Board / colores aplicados. Manual: Pending. Agent: Done.
    Evidence: `brand_board` passed with expected palette.

18. Logo y custom values base. Manual: Pending. Agent: Failed.
    Evidence: `core_custom_values` failed because `domain_purchase_authorized` is missing.

19. Custom values de landing no diferidos. Manual: Pending. Agent: Failed.
    Evidence: missing `company_phone`, `automation_sender_email`, `website_social_image`, and responsive image srcset/fallback custom values.

20. Idioma de plataforma del usuario. Manual: Pending. Agent: Pending.
    Evidence: not covered by current API QC; likely UI-only.

21. Notificaciones de invoices/estimates/documents/contracts en idioma correcto. Manual: Pending. Agent: Pending.
    Evidence: not covered by current API QC; likely UI/manual verification.

22. Workflows / automatizaciones del snapshot activos y correctamente mapeados. Manual: Pending. Agent: Failed.
    Evidence: `onboarding_workflow` failed; expected onboarding trigger/workflow evidence was not found by QC.

## Fase 3 - Cita de Onboarding

23. Twilio A2P / Trust Center / número comprado. Manual: Pending. Agent: Failed.
    Evidence: `phone` failed; no phone numbers and `twilioActive=false`.

24. Shaken/Stir, CNAM, Voice Integrity. Manual: Pending. Agent: Pending.
    Evidence: not proven by current QC and likely gated by Twilio setup.

25. Inbound calls asignadas al usuario. Manual: Pending. Agent: Pending.
    Evidence: not proven; no phone number exists yet.

26. Dominio existente conectado durante cita, si aplica. Manual: Pending. Agent: Failed.
    Evidence: domain failed; no `customDomain`.

27. Stripe conectado. Manual: Pending. Agent: Failed.
    Evidence: `stripe` failed; `transactionCount=0`.

28. Staff/usuarios y permisos. Manual: Pending. Agent: Done.
    Evidence: `staff_permissions` passed. Manual should still confirm whether client needs additional staff.

29. Horarios definitivos de calendarios. Manual: Pending. Agent: Pending.
    Evidence: activation/free-slots passed, but final business hours and booking rules still need human confirmation.

30. App móvil descargada y acceso del cliente confirmado. Manual: Pending. Agent: Pending.
    Evidence: not proven by current QC.

## Fase 4 - Verificación y Acceso

31. Espera/aprobación Twilio completada. Manual: Pending. Agent: Pending.
    Evidence: Twilio not active.

32. Formulario/calendario insertado en website después de Twilio. Manual: Pending. Agent: Pending.
    Evidence: deferred intentionally; do not insert until Twilio approval.

33. QA final de website publicada. Manual: Pending. Agent: Failed.
    Evidence: generated assets pass, but current generated HTML is not proven saved into GHL and no publication evidence custom value exists.

34. Cuenta aprobada/activada en panel. Manual: Pending. Agent: Failed.
    Evidence: `account_approved` failed; `approved_at=null`.

35. Gate final de activación. Manual: Pending. Agent: Failed.
    Evidence: `account_activation_gate` failed. Critical failed items: domain, phone, email, landing, Stripe, client sign-off. Calendar and landing form gate passed.

36. Bienvenida/acceso final enviado al cliente. Manual: Pending. Agent: Pending.
    Evidence: not proven by current QC.

## Current Agent Summary

- Supabase access: Agent: Done.
- GHL read access: Agent: Done.
- Panel docs export: Agent: Done.
- Onboarding form received: Agent: Done.
- Calendars owner/active/free-slots: Agent: Done.
- Contact form Language/DND: Agent: Done.
- Brand Board: Agent: Done.
- Domain/phone/email/Stripe/publication/account activation: Agent: Failed.
- Platform language, notification templates, app download, final client sign-off: Agent: Pending.
