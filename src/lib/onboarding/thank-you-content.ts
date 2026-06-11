export const ONBOARDING_CONTACT_PHONE = "+15622625264";
export const ONBOARDING_CONTACT_EMAIL = "info@email.getpatronpro.com";
export const ONBOARDING_CONTACT_VCARD_PATH = "/patronpro-contact.vcf";

export interface PaidOnboardingStep {
  number: string;
  title: string;
  body: string;
}

export const PAID_ONBOARDING_STEPS: PaidOnboardingStep[] = [
  {
    number: "1",
    title: "Revisa tus mensajes y guarda nuestros contactos",
    body:
      "Te enviaremos instrucciones por email y SMS. Si no ves nuestros mensajes, revisa Spam o Promociones y guarda el +15622625264 junto con info@email.getpatronpro.com para no perder ninguna actualización.",
  },
  {
    number: "2",
    title: "Completa tu formulario y agenda tu cita",
    body:
      "Primero debes completar el formulario de onboarding con la información básica de tu negocio. En cuanto lo envíes, te llevaremos a agendar tu cita con un agente de setup.",
  },
  {
    number: "3",
    title: "Prepárate para tu llamada de configuración",
    body:
      "Antes de la cita te diremos qué debes traer preparado. Durante la llamada configuraremos los elementos necesarios y, después, algunos procesos pueden requerir validación adicional antes de que tu cuenta quede completamente lista.",
  },
];
