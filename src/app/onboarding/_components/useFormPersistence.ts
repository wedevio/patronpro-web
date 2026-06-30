import { useEffect, useRef } from "react";
import type { OnboardingFormData } from "@/lib/onboarding/types";

let debounceTimer: NodeJS.Timeout | null = null;

/**
 * Hook para persistir el estado del formulario en Supabase
 * Guarda automáticamente cada cambio (con debounce de 1s)
 * Nota: Los archivos (Files) se excluyen, el usuario deberá re-seleccionar si es necesario
 */
export function useFormPersistence(
  locationId: string,
  contactId: string,
  currentStep: number,
  formData: Partial<OnboardingFormData>
) {
  const isSavingRef = useRef(false);

  useEffect(() => {
    // Cancelar timer anterior si existe
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Crear timer para guardar con debounce (1 segundo)
    debounceTimer = setTimeout(async () => {
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;

        // No serializar File objects
         const dataToSave: Partial<OnboardingFormData> = {};

         for (const [key, value] of Object.entries(formData)) {
           // Ignorar File objects and undefined values
           if (value instanceof File || value === undefined) {
             continue;
           }
           (dataToSave as Record<string, unknown>)[key] = value;
         }

        const response = await fetch("/api/onboarding/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locationId,
            contactId,
            currentStep,
            formData: dataToSave,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("[useFormPersistence] Save failed:", error);
        }
      } catch (err) {
        console.error("[useFormPersistence] Save error:", err);
      } finally {
        isSavingRef.current = false;
      }
    }, 1000);

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [currentStep, formData, locationId, contactId]);
}

interface LoadedProgress {
  step: number;
  formData: Partial<OnboardingFormData>;
}

/**
 * Carga datos persistidos del servidor para un locationId + contactId
 * Retorna null si no hay datos guardados
 */
export async function loadPersistedFormData(
  locationId: string,
  contactId: string
): Promise<LoadedProgress | null> {
  try {
    const response = await fetch(
      `/api/onboarding/progress?locationId=${encodeURIComponent(
        locationId
      )}&contactId=${encodeURIComponent(contactId)}`
    );

    if (!response.ok) {
      console.error("[loadPersistedFormData] HTTP error:", response.status);
      return null;
    }

    const json = (await response.json()) as {
      success: boolean;
      data?: { currentStep: number; formData: Partial<OnboardingFormData> } | null;
      error?: string;
    };

    if (!json.success || !json.data) {
      return null;
    }

    // Asegurarse de que el paso sea válido (1-5)
    const step = Math.max(1, Math.min(5, json.data.currentStep));

    return {
      step,
      formData: json.data.formData,
    };
  } catch (err) {
    console.error("[loadPersistedFormData] Error:", err);
    return null;
  }
}

/**
 * Limpia los datos persistidos para este link
 */
export async function clearPersistedFormData(
  locationId: string,
  contactId: string
): Promise<void> {
  try {
    await fetch("/api/onboarding/progress/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locationId,
        contactId,
      }),
    });
  } catch (err) {
    console.error("[clearPersistedFormData] Error:", err);
  }
}
