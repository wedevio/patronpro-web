export interface OnboardingFormData {
  // Step 1: Business Info
  businessName: string;
  legalName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  website: string;
  phone: string;
  email: string;
  ein?: string;

  // Step 2: Brand Identity
  logoFile?: File; // client-side only
  logoUrl?: string; // after upload
  primaryColor: string;
  secondaryColor: string;
  letUsChooseColors: boolean;

  // Step 3: Domain
  hasDomain: boolean;
  existingDomain?: string;
  wantNewDomain?: boolean;
  desiredDomain?: string;
  domainRegistrar?: string; // godaddy, namecheap, other
}

export interface OnboardingSubmission {
  locationId: string;
  contactId: string;
  formData: OnboardingFormData;
}

export interface GHLCustomValue {
  id: string;
  name: string;
  fieldKey: string;
  value: string;
}
