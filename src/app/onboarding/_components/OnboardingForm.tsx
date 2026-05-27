"use client";

import { useState } from "react";
import type { OnboardingFormData, HoursOfOperation } from "@/lib/onboarding/types";
import { DEFAULT_HOURS } from "@/lib/onboarding/types";
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
} from "@/lib/onboarding/validation";
import ProgressBar from "./ProgressBar";
import Step1Domain from "./Step1Domain";
import Step2Business from "./Step2Business";
import Step3Brand from "./Step3Brand";
import Step4Hours from "./Step4Hours";
import StepReview from "./StepReview";
import SuccessScreen from "./SuccessScreen";

interface OnboardingFormProps {
  locationId: string;
  contactId: string;
}

type FieldValue = string | boolean | File | HoursOfOperation | undefined;

export default function OnboardingForm({
  locationId,
  contactId,
}: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<OnboardingFormData>>({
    country: "US",
    letUsChooseColors: false,
    hasDomain: false,
    wantNewDomain: false,
    hoursOfOperation: DEFAULT_HOURS,
    primaryColor: "#1E2C46",
    secondaryColor: "#F67D0A",
    complementaryColor: "#FFFFFF",
    websiteServices: [],
    websiteTagline: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof OnboardingFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function updateField(field: keyof OnboardingFormData, value: FieldValue) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function goNext() {
    let stepErrors: Partial<Record<keyof OnboardingFormData, string>> = {};
    if (currentStep === 1) stepErrors = validateStep2(formData);
    if (currentStep === 2) stepErrors = validateStep3(formData);
    if (currentStep === 3) stepErrors = validateStep4(formData);
    if (currentStep === 4) stepErrors = validateStep1(formData);

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setCurrentStep((s) => s + 1);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const fd = new FormData();
      fd.append("locationId", locationId);
      fd.append("contactId", contactId);

      const stringFields: Array<keyof OnboardingFormData> = [
        "businessName",
        "legalName",
        "address",
        "city",
        "state",
        "zip",
        "country",
        "phone",
        "email",
        "ein",
        "primaryColor",
        "secondaryColor",
        "complementaryColor",
        "existingDomain",
        "desiredDomain",
        "domainRegistrar",
        "websiteTagline",
      ];

      for (const key of stringFields) {
        const v = formData[key];
        if (v !== undefined && typeof v === "string") fd.append(key, v);
      }

      fd.append("letUsChooseColors", String(formData.letUsChooseColors ?? false));
      fd.append("hasDomain", String(formData.hasDomain ?? false));
      fd.append("wantNewDomain", String(formData.wantNewDomain ?? false));
      fd.append("authorizeDomainPurchase", String(formData.authorizeDomainPurchase ?? false));

      if (formData.businessLegalStructure) {
        fd.append("businessLegalStructure", formData.businessLegalStructure);
      }
      if (formData.teamSize) {
        fd.append("teamSize", formData.teamSize);
      }
      if (formData.taxIdStatus) {
        fd.append("taxIdStatus", formData.taxIdStatus);
      }
      if (formData.hasStripeAccount !== undefined) {
        fd.append("hasStripeAccount", String(formData.hasStripeAccount));
      }

      if (formData.hoursOfOperation) {
        fd.append("hoursOfOperation", JSON.stringify(formData.hoursOfOperation));
      }

      if (formData.websiteServices?.length) {
        fd.append("websiteServices", JSON.stringify(formData.websiteServices));
      }

      if (formData.logoFile instanceof File) {
        fd.append("logoFile", formData.logoFile);
      }

      if (formData.logoSquareFile instanceof File) {
        fd.append("logoSquareFile", formData.logoSquareFile);
      }

      const res = await fetch("/api/onboarding", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Error al enviar");
      }

      setSuccess(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Error desconocido"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <SuccessScreen
        businessName={formData.businessName ?? ""}
        hasLogo={!!(formData.logoFile || formData.logoSquareFile)}
        hasColors={!formData.letUsChooseColors && !!formData.primaryColor}
        hasDomainInfo={!!(formData.existingDomain || formData.desiredDomain)}
      />
    );
  }

  const TOTAL_STEPS = 5;

  return (
    <div className="max-w-2xl mx-auto">
      <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      <div
        className="bg-white rounded-[24px] shadow-sm p-6 sm:p-8"
        style={{ border: "1px solid #e5e7eb" }}
      >
        {currentStep === 1 && (
          <Step2Business
            data={formData}
            errors={errors}
            onChange={(field, value) =>
              updateField(field as keyof OnboardingFormData, value)
            }
          />
        )}
        {currentStep === 2 && (
          <Step3Brand
            data={formData}
            errors={errors}
            onChange={(field, value) =>
              updateField(field as keyof OnboardingFormData, value as FieldValue)
            }
          />
        )}
        {currentStep === 3 && (
          <Step4Hours
            data={formData}
            onChange={(field, value) =>
              updateField(field as keyof OnboardingFormData, value as FieldValue)
            }
          />
        )}
        {currentStep === 4 && (
          <Step1Domain
            data={formData}
            errors={errors}
            onChange={(field, value) =>
              updateField(field as keyof OnboardingFormData, value as FieldValue)
            }
          />
        )}
        {currentStep === 5 && (
          <StepReview
            data={formData}
            onEdit={(step) => setCurrentStep(step)}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {submitError && (
          <p className="mt-4 text-sm text-center" style={{ color: "#ef4444" }}>
            {submitError}
          </p>
        )}

        {currentStep < 5 && (
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s - 1)}
                className="rounded-[14px] border px-6 py-3 text-sm font-medium transition-colors hover:border-[#1E2C46]"
                style={{ borderColor: "#e5e7eb", color: "#1E2C46" }}
              >
                Atrás
              </button>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={goNext}
              className="rounded-[14px] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#F67D0A" }}
            >
              {currentStep === 4 ? "Revisar" : "Siguiente"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
