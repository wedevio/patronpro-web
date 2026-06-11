interface SuccessScreenProps {
  businessName: string;
  hasLogo: boolean;
  hasColors: boolean;
  hasDomainInfo: boolean;
}

export default function SuccessScreen({
  businessName,
  hasLogo,
  hasColors,
  hasDomainInfo,
}: SuccessScreenProps) {
  const configured: string[] = [];
  if (businessName) configured.push("Información del negocio");
  if (hasLogo) configured.push("Logo subido");
  if (hasColors) configured.push("Colores de marca");
  if (hasDomainInfo) configured.push("Información de dominio");

  return (
    <div className="flex flex-col items-center text-center px-4 py-10 max-w-md mx-auto">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: "#F67D0A" }}
      >
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold mb-3" style={{ color: "#1E2C46" }}>
        ¡Listo! Recibimos tu información
      </h1>

      <p className="text-base mb-6" style={{ color: "#5f6f88" }}>
        Nos vemos en la llamada. Ya configuramos lo que pudimos — solo falta lo
        que haremos juntos.
      </p>

      {configured.length > 0 && (
        <div
          className="w-full rounded-[14px] border p-5 mb-6 text-left"
          style={{ borderColor: "#e5e7eb" }}
        >
          <p className="text-sm font-semibold mb-3" style={{ color: "#1E2C46" }}>
            Lo que ya configuramos:
          </p>
          <ul className="flex flex-col gap-2">
            {configured.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#F67D0A" }}
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                <span style={{ color: "#1E2C46" }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm" style={{ color: "#5f6f88" }}>
        ¿Tienes preguntas?{" "}
        <a
          href="mailto:info@email.getpatronpro.com"
          className="font-semibold underline"
          style={{ color: "#F67D0A" }}
        >
          info@email.getpatronpro.com
        </a>
      </p>
    </div>
  );
}
