import { expect, test } from "@playwright/test";
import {
  ONBOARDING_EMAIL_HTML,
  ONBOARDING_SMS_TEXT,
  interpolate,
} from "../src/lib/onboarding/message-templates";

test("preserves onboarding interpolation placeholders in email HTML", () => {
  expect(ONBOARDING_EMAIL_HTML).toContain("{{firstName}}");
  expect(ONBOARDING_EMAIL_HTML).toContain("{{businessName}}");
  expect(ONBOARDING_EMAIL_HTML).toContain("{{link}}");
});

test("renders the approved form-first onboarding email copy", () => {
  const rendered = interpolate(ONBOARDING_EMAIL_HTML, {
    firstName: "Ada",
    businessName: "Lovelace Builders",
    link: "https://example.com/onboarding",
  });

  expect(rendered).toContain("Gracias por registrarse con PatronPro");
  expect(rendered).toContain("El primer paso es completar su formulario de onboarding");
  expect(rendered).toContain("Lovelace Builders");
  expect(rendered).toContain("podrá reservar su cita");
});

test("keeps the SMS form-first flow without changing placeholder ownership", () => {
  expect(ONBOARDING_SMS_TEXT).toContain("{{firstName}}");
  expect(ONBOARDING_SMS_TEXT).toContain("{{businessName}}");
  expect(ONBOARDING_SMS_TEXT).toContain("{{link}}");
  expect(ONBOARDING_SMS_TEXT).toContain("primer paso");
  expect(ONBOARDING_SMS_TEXT).toContain("Después podrá reservar su cita");
});
