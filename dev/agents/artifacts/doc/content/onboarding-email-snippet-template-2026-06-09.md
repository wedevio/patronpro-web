# PatronPro Onboarding Welcome Snippet

Channel: Email
Purpose: Welcome a new PatronPro client and request the short onboarding form before the onboarding call.

Subject:

Bienvenida a PatronPro y formulario de onboarding

Reusable body:

```text
Hola {{contact.first_name}},

Bienvenida a PatronPro. Soy Oscar Betancourt y voy a estar a tu disposicion para cualquier duda que tengas durante el setup de tu cuenta.

Antes de nuestra cita, te pido por favor que completes el formulario corto de onboarding. De preferencia, si puedes llenarlo manana {{preferred_due_day}}, me dara tiempo de hacer las configuraciones pertinentes y avanzar con el setup antes de nuestra llamada.

Formulario de onboarding:
{{onboarding_form_link}}

Si tienes cualquier pregunta mientras lo completas, puedes responder directamente a este correo o escribirme y con gusto te ayudo.

Saludos,
Oscar Betancourt
PatronPro
```

Implementation note:

`{{onboarding_form_link}}` is not confirmed as a native GHL custom value. Replace it with the signed short-form URL found in the contact's conversation history, or wire it to a future PatronPro/GHL custom value before using this as a fully automated snippet.
