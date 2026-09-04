import { NOTA_PIE } from '@config/app'

export const metadata = { title: 'Medicación' }

/**
 * Raíz pública. No muestra nada del registro: la app vive en /f/<codigo>.
 */
export default function Inicio() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
      <h1 className="font-[family-name:var(--font-hora)] text-[28px] leading-tight text-ink">
        Control de medicación
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        Abre el enlace que tienes guardado. La app vive en una dirección con tu código,
        no en esta página.
      </p>
      <p className="mt-8 border-t border-line pt-4 text-[12px] leading-relaxed text-muted">
        {NOTA_PIE}
      </p>
    </main>
  )
}
