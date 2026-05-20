import type { OnboardingFormData } from "./types";

type ValidationErrors = Partial<Record<keyof OnboardingFormData, string>>;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Step 1: Domain
export function validateStep1(
  data: Partial<OnboardingFormData>
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (data.hasDomain && !data.existingDomain?.trim()) {
    errors.existingDomain = "Ingresá tu dominio existente";
  }
  if (data.wantNewDomain && !data.desiredDomain?.trim()) {
    errors.desiredDomain = "Ingresá el dominio que te gustaría";
  }

  return errors;
}

// Step 2: Business Info
export function validateStep2(
  data: Partial<OnboardingFormData>
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.businessName?.trim())
    errors.businessName = "El nombre del negocio es requerido";
  if (!data.legalName?.trim())
    errors.legalName = "El nombre legal es requerido";
  if (!data.address?.trim()) errors.address = "La dirección es requerida";
  if (!data.city?.trim()) errors.city = "La ciudad es requerida";
  if (!data.state?.trim()) errors.state = "El estado es requerido";
  if (!data.zip?.trim()) errors.zip = "El código postal es requerido";
  if (!data.phone?.trim()) errors.phone = "El teléfono es requerido";
  if (!data.email?.trim()) {
    errors.email = "El email es requerido";
  } else if (!isValidEmail(data.email)) {
    errors.email = "El email no es válido";
  }

  return errors;
}

// Step 3: Brand Identity
export function validateStep3(
  data: Partial<OnboardingFormData>
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.letUsChooseColors) {
    if (!data.primaryColor?.trim())
      errors.primaryColor = "El color principal es requerido";
  }

  return errors;
}

// Step 4: Hours — no required fields (has defaults)
export function validateStep4(
  _data: Partial<OnboardingFormData>
): ValidationErrors {
  return {};
}
