import { expect, test } from "@playwright/test";
import {
  ONBOARDING_CONTACT_EMAIL,
  ONBOARDING_CONTACT_PHONE,
  ONBOARDING_CONTACT_VCARD_PATH,
  PAID_ONBOARDING_STEPS,
} from "../src/lib/onboarding/thank-you-content";

test("exposes three paid onboarding steps", () => {
  expect(PAID_ONBOARDING_STEPS).toHaveLength(3);
  expect(PAID_ONBOARDING_STEPS.map((step) => step.title)).toEqual([
    "Revisa tus mensajes y guarda nuestros contactos",
    "Completa tu formulario y agenda tu cita",
    "Prepárate para tu llamada de configuración",
  ]);
});

test("includes support phone, support email, and spam guidance", () => {
  expect(ONBOARDING_CONTACT_PHONE).toBe("+15622625264");
  expect(ONBOARDING_CONTACT_EMAIL).toBe("info@email.getpatronpro.com");
  expect(ONBOARDING_CONTACT_VCARD_PATH).toBe("/patronpro-contact.vcf");
  expect(PAID_ONBOARDING_STEPS[0]?.body).toContain("Spam");
});

test("explains the form-first booking flow and validation expectations", () => {
  expect(PAID_ONBOARDING_STEPS[1]?.body).toContain("completar el formulario");
  expect(PAID_ONBOARDING_STEPS[1]?.body).toContain("agendar");
  expect(PAID_ONBOARDING_STEPS[2]?.body).toContain("validación");
  expect(PAID_ONBOARDING_STEPS[2]?.body).toContain("lista");
});
