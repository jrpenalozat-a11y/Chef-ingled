import { NOTA_PIE } from '@config/app'

/** Quién manda sobre las dosis, y dónde viven los datos. */
export default function Pie() {
  return (
    <footer className="mt-6 border-t border-line pt-4 text-[12px] leading-relaxed text-muted">
      <p>{NOTA_PIE}</p>
      <p className="mt-1.5">
        El registro se guarda solo en este teléfono. Nada se envía a internet.
      </p>
    </footer>
  )
}
