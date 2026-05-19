export default function InvalidLink() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: "#1E2C46" }}
      >
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>
      <h1
        className="text-2xl font-bold mb-3"
        style={{ color: "#1E2C46" }}
      >
        Este enlace no es válido o ha expirado
      </h1>
      <p className="text-base mb-6" style={{ color: "#5f6f88" }}>
        El enlace que usaste no es correcto o ya no está disponible.
      </p>
      <p className="text-sm" style={{ color: "#5f6f88" }}>
        ¿Necesitás ayuda? Escribinos a{" "}
        <a
          href="mailto:info@getpatronpro.com"
          className="font-semibold underline"
          style={{ color: "#F67D0A" }}
        >
          info@getpatronpro.com
        </a>
      </p>
    </div>
  );
}
