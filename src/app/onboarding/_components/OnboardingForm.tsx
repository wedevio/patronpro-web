"use client";

import { useState } from "react";
import type { OnboardingFormData } from "@/lib/onboarding/types";
import {
  validateStep1,
  validateStep2,
  validateStep3,
} from "@/lib/onboarding/validation";
import ProgressBar from "./ProgressBar";
import Step1Business from "./Step1Business";
import Step2Brand from "./Step2Brand";
import Step3Domain from "./Step3Domain";
import StepReview from "./StepReview";
import SuccessScreen from "./SuccessScreen";

interface OnboardingFormProps {
  locationId: string;
  contactId: string;
}

type FieldValue = string | boolean | File | undefined;

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
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof OnboardingFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function updateField(
    field: keyof OnboardingFormData,
    value: FieldValue
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function goNext() {
    let stepErrors: Partial<Record<keyof OnboardingFormData, string>> = {};
    if (currentStep === 1) stepErrors = validateStep1(formData);
    if (currentStep === 2) stepErrors = validateStep2(formData);
    if (currentStep === 3) stepErrors = validateStep3(formData);

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
        "website",
        "phone",
        "email",
        "ein",
        "primaryColor",
        "secondaryColor",
        "existingDomain",
        "desiredDomain",
        "domainRegistrar",
      ];

      for (const key of stringFields) {
        const v = formData[key];
        if (v !== undefined && typeof v === "string") fd.append(key, v);
      }

      fd.append(
        "letUsChooseColors",
        String(formData.letUsChooseColors ?? false)
      );
      fd.append("hasDomain", String(formData.hasDomain ?? false));
      fd.append("wantNewDomain", String(formData.wantNewDomain ?? false));

      if (formData.logoFile instanceof File) {
        fd.append("logoFile", formData.logoFile);
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
        hasLogo={!!formData.logoFile}
        hasColors={
          !formData.letUsChooseColors && !!formData.primaryColor
        }
        hasDomainInfo={
          !!(formData.existingDomain || formData.desiredDomain)
        }
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <ProgressBar currentStep={currentStep} />

      <div
        className="bg-white rounded-[24px] shadow-sm p-6 sm:p-8"
        style={{ border: "1px solid #e5e7eb" }}
      >
        {currentStep === 1 && (
          <Step1Business
            data={formData}
            errors={errors}
            onChange={(field, value) =>
              updateField(field as keyof OnboardingFormData, value)
            }
          />
        )}
        {currentStep === 2 && (
          <Step2Brand
            data={formData}
            errors={errors}
            onChange={(field, value) =>
              updateField(field as keyof OnboardingFormData, value as FieldValue)
            }
          />
        )}
        {currentStep === 3 && (
          <Step3Domain
            data={formData}
            errors={errors}
            onChange={(field, value) =>
              updateField(field as keyof OnboardingFormData, value as FieldValue)
            }
          />
        )}
        {currentStep === 4 && (
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

        {currentStep < 4 && (
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
              {currentStep === 3 ? "Revisar" : "Siguiente"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
