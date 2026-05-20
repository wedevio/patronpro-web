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

  // Step 3: Brand Identity
  logoFile?: File; // client-side only
  logoUrl?: string; // after upload
  primaryColor: string;
  secondaryColor: string;
  complementaryColor: string;
  letUsChooseColors: boolean;

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
