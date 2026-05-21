"use client";

import { useEffect } from "react";

interface Props {
  plan: "monthly" | "annual";
  withSetup: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,25,45,0.60)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-[24px] bg-white shadow-2xl"
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

        <iframe
          src="https://api.getpatronpro.com/widget/form/CEL74QjOfO6rg8jUFbos"
          style={{ width: "100%", height: "662px", border: "none", borderRadius: "24px" }}
          id="inline-CEL74QjOfO6rg8jUFbos"
          data-layout='{"id":"INLINE"}'
          data-trigger-type="alwaysShow"
          data-trigger-value=""
          data-activation-type="alwaysActivated"
          data-activation-value=""
          data-deactivation-type="neverDeactivate"
          data-deactivation-value=""
          data-form-name="Home Form"
          data-height="662"
          data-layout-iframe-id="inline-CEL74QjOfO6rg8jUFbos"
          data-form-id="CEL74QjOfO6rg8jUFbos"
          title="Home Form"
        />
      </div>
    </div>
  );
}
