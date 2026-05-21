"use client";

import { useEffect } from "react";

interface Props {
  plan: "monthly" | "annual";
  withSetup: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ plan, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const formId = plan === "annual"
    ? "ymVCkxugIO4xA1dVFfu4"
    : "CEL74QjOfO6rg8jUFbos";

  const selectedPlan = plan === "annual" ? "anual" : "monthly";
  const iframeSrc = `https://api.getpatronpro.com/widget/form/${formId}?selected_plan=${selectedPlan}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,25,45,0.60)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-[650px] max-h-[90vh] overflow-y-auto rounded-[24px] bg-white shadow-2xl"
        style={{ boxShadow: "0 32px 80px rgba(15,25,45,0.28)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-[20px] font-light transition-colors hover:bg-[#f0f0f0] z-10"
          style={{ color: "#5f6f88" }}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="px-8 pt-8 pb-4">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wide mb-3"
            style={{ background: "rgba(246,125,10,0.10)", color: "#1E2C46" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#F67D0A]" />
            {plan === "monthly" ? "Plan Mensual — $99/mes + Setup Fee $199" : "Plan Anual — $999/año + Setup Fee $199"}
          </span>
          <h2 className="text-[26px] font-black leading-[1.1] tracking-[-0.02em]" style={{ color: "#1E2C46" }}>
            Create your PatronPro account
          </h2>
          <p className="text-[14px] mt-1" style={{ color: "#5f6f88" }}>
            Enter your details before continuing to secure checkout.
          </p>
        </div>

        <iframe
          src={iframeSrc}
          style={{ width: "100%", height: "662px", border: "none", borderRadius: "24px" }}
          id={`inline-${formId}`}
          data-layout='{"id":"INLINE"}'
          data-trigger-type="alwaysShow"
          data-trigger-value=""
          data-activation-type="alwaysActivated"
          data-activation-value=""
          data-deactivation-type="neverDeactivate"
          data-deactivation-value=""
          data-form-name={plan === "annual" ? "Home Form Checkout- Yearly" : "Home Form"}
          data-height="662"
          data-layout-iframe-id={`inline-${formId}`}
          data-form-id={formId}
          title={plan === "annual" ? "Home Form Checkout- Yearly" : "Home Form"}
        />
      </div>
    </div>
  );
}
