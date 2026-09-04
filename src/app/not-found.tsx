export default function NoEncontrado() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
      <h1 className="font-[family-name:var(--font-hora)] text-[26px] text-ink">
        Ese enlace no es
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        Revisa el código de la dirección, o abre la app desde el ícono que instalaste en la
        pantalla de inicio.
      </p>
    </main>
  )
}
