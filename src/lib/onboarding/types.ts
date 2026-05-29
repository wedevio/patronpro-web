export interface DayHours {
  open: boolean;
  from: string; // "08:00"
  to: string;   // "17:00"
}

export interface HoursOfOperation {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export const DEFAULT_HOURS: HoursOfOperation = {
  monday:    { open: true,  from: "08:00", to: "17:00" },
  tuesday:   { open: true,  from: "08:00", to: "17:00" },
  wednesday: { open: true,  from: "08:00", to: "17:00" },
  thursday:  { open: true,  from: "08:00", to: "17:00" },
  friday:    { open: true,  from: "08:00", to: "17:00" },
  saturday:  { open: false, from: "09:00", to: "13:00" },
  sunday:    { open: false, from: "09:00", to: "13:00" },
};

export interface OnboardingFormData {
  // Step 1: Domain (asked first)
  hasDomain: boolean;
  existingDomain?: string;
  wantNewDomain?: boolean;
  desiredDomain?: string;
  domainRegistrar?: string;
  authorizeDomainPurchase?: boolean; // user authorizes $13.84 domain purchase

  // Step 2: Business Info
  businessName: string;
  legalName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  ein?: string;
  businessLegalStructure?: "llc" | "corporation" | "sole_proprietorship" | "partnership" | "none";
  taxIdStatus?: "ssn" | "itin" | "none"; // personal tax ID situation
  teamSize?: "solo" | "2-5" | "6-15" | "16+";

  // Step 1: Domain (also asked here for grouping convenience)
  hasStripeAccount?: boolean;

  // Step 3: Brand Identity
  logoFile?: File;       // client-side only
  logoSquareFile?: File; // client-side only — AI-generated square version
  logoUrl?: string;      // after upload
  logoSquareUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  complementaryColor: string;
  letUsChooseColors: boolean;

  // Step 3: Services & Description (moved from website step — informs logo + web)
  websiteServices: string[];
  websiteTagline: string; // repurposed as "breve descripción del negocio"

  // Step 4: Hours of Operation
  hoursOfOperation: HoursOfOperation;
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
