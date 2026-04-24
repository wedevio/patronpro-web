"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const PAYMENT_LINKS = {
  monthly: "https://api.getpatronpro.com/payment-link/69eb33827dd3512d92079777",
  annual:  "https://api.getpatronpro.com/payment-link/69eb339d557558e89e5231c8",
};

interface Props {
  plan: "monthly" | "annual";
  onClose: () => void;
}

const inputCls =
  "min-h-[52px] rounded-[14px] border px-4 text-[15px] font-medium bg-white outline-none transition-colors w-full focus:border-[#F67D0A]";
const inputStyle = { borderColor: "rgba(30,44,70,0.12)", color: "#24324a" };

export default function CheckoutModal({ plan, onClose }: Props) {
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "", business_name: "",
  });
  const [legalChecked, setLegalChecked] = useState(false);
  const [smsChecked, setSmsChecked]     = useState(false);
  const [legalError, setLegalError]     = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errors, setErrors]             = useState<Record<string, string>>({});

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.first_name.trim()) e.first_name = "El nombre es obligatorio.";
    if (!form.last_name.trim())  e.last_name  = "El apellido es obligatorio.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Introduce un email válido.";
    if (!form.phone.trim()) e.phone = "El teléfono es obligatorio.";
    if (!legalChecked) setLegalError(true); else setLegalError(false);
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0 || !legalChecked) {
      setErrors(errs);
      return;
    }

    setLoading(true);

    const payload = {
      ...form,
      selected_plan:         plan,
      terms_accepted:        true,
      privacy_accepted:      true,
      cookies_accepted:      true,
      sms_marketing_consent:   smsChecked,
      email_marketing_consent: smsChecked,
      consent_text_version:  "2026-04-24",
      consent_source_url:    typeof window !== "undefined" ? window.location.href : "",
      consent_timestamp:     new Date().toISOString(),
      user_agent:            typeof navigator !== "undefined" ? navigator.userAgent : "",
    };

    // Optional webhook — fire and forget
    const webhookUrl = process.env.NEXT_PUBLIC_PRECHECKOUT_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("Precheckout webhook error:", err);
      }
    }

    // Build redirect URL — only GHL-supported prefill params
    const base = PAYMENT_LINKS[plan];
    const params = new URLSearchParams({
      firstName: form.first_name.trim(),
      lastName:  form.last_name.trim(),
      email:     form.email.trim(),
    });

    window.location.href = `${base}?${params.toString()}`;
  }

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
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-[20px] font-light transition-colors hover:bg-[#f0f0f0]"
          style={{ color: "#5f6f88" }}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wide mb-3"
              style={{ background: "rgba(246,125,10,0.10)", color: "#1E2C46" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#F67D0A]" />
              {plan === "monthly" ? "Plan Mensual — $99/mes" : "Plan Anual — $999/año"}
            </span>
            <h2 className="text-[26px] font-black leading-[1.1] tracking-[-0.02em]" style={{ color: "#1E2C46" }}>
              Create your PatronPro account
            </h2>
            <p className="text-[14px] mt-1" style={{ color: "#5f6f88" }}>
              Enter your details before continuing to secure checkout.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="grid gap-3">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="First Name *"
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                  className={inputCls}
                  style={{ ...inputStyle, borderColor: errors.first_name ? "#e03131" : inputStyle.borderColor }}
                />
                {errors.first_name && <p className="text-[12px] mt-1" style={{ color: "#e03131" }}>{errors.first_name}</p>}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Last Name *"
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                  className={inputCls}
                  style={{ ...inputStyle, borderColor: errors.last_name ? "#e03131" : inputStyle.borderColor }}
                />
                {errors.last_name && <p className="text-[12px] mt-1" style={{ color: "#e03131" }}>{errors.last_name}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Email *"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputCls}
                style={{ ...inputStyle, borderColor: errors.email ? "#e03131" : inputStyle.borderColor }}
              />
              {errors.email && <p className="text-[12px] mt-1" style={{ color: "#e03131" }}>{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <input
                type="tel"
                placeholder="Phone Number *"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={inputCls}
                style={{ ...inputStyle, borderColor: errors.phone ? "#e03131" : inputStyle.borderColor }}
              />
              {errors.phone && <p className="text-[12px] mt-1" style={{ color: "#e03131" }}>{errors.phone}</p>}
            </div>

            {/* Business */}
            <input
              type="text"
              placeholder="Business Name"
              value={form.business_name}
              onChange={(e) => set("business_name", e.target.value)}
              className={inputCls}
              style={inputStyle}
            />

            {/* Required legal checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                id="modal-legal"
                type="checkbox"
                checked={legalChecked}
                onChange={(e) => { setLegalChecked(e.target.checked); if (e.target.checked) setLegalError(false); }}
                className="mt-[3px] w-4 h-4 flex-shrink-0 accent-[#F67D0A] cursor-pointer"
              />
              <label htmlFor="modal-legal" className="text-[13px] leading-[1.55] cursor-pointer" style={{ color: "#3d4f68" }}>
                I agree to PatronPro&apos;s{" "}
                <Link href="/terms" target="_blank" className="font-semibold underline" style={{ color: "#F67D0A" }}>Terms</Link>,{" "}
                <Link href="/privacy" target="_blank" className="font-semibold underline" style={{ color: "#F67D0A" }}>Privacy Policy</Link>{" "}
                and{" "}
                <Link href="/cookies" target="_blank" className="font-semibold underline" style={{ color: "#F67D0A" }}>Cookies Policy</Link>.
              </label>
            </div>
            {legalError && (
              <p className="text-[12px] -mt-1" style={{ color: "#e03131" }}>
                Please accept PatronPro&apos;s Terms, Privacy Policy and Cookies Policy to continue.
              </p>
            )}

            {/* Optional SMS/marketing checkbox */}
            <div
              className="flex items-start gap-3 pt-3 mt-1 border-t"
              style={{ borderColor: "rgba(30,44,70,0.07)" }}
            >
              <input
                id="modal-sms"
                type="checkbox"
                checked={smsChecked}
                onChange={(e) => setSmsChecked(e.target.checked)}
                className="mt-[3px] w-4 h-4 flex-shrink-0 accent-[#F67D0A] cursor-pointer"
              />
              <label htmlFor="modal-sms" className="text-[12px] leading-[1.55] cursor-pointer" style={{ color: "#5f6f88" }}>
                I agree to receive promotional SMS/text messages and emails from PatronPro about its services, offers, onboarding resources and updates. Message frequency may vary. Message and data rates may apply. Reply STOP to unsubscribe from SMS or HELP for help. Consent is not required to purchase PatronPro.
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 min-h-[56px] rounded-[16px] font-bold text-[16px] text-white w-full transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#F67D0A", boxShadow: "0 12px 30px rgba(246,125,10,0.28)" }}
            >
              {loading ? "Redirecting…" : "Continue to secure checkout →"}
            </button>

            {/* Operational disclosure */}
            <p className="text-[11px] leading-[1.5] text-center" style={{ color: "#8491a7" }}>
              PatronPro may send account, onboarding, billing, support, security and service-related
              communications by email, SMS or phone as described in our{" "}
              <Link href="/terms" target="_blank" className="underline">Terms</Link> and{" "}
              <Link href="/privacy" target="_blank" className="underline">Privacy Policy</Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
