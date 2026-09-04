import type { Metadata } from 'next'
import { codigosValidos, normalizar } from '@/lib/acceso'
import RegistrarServiceWorker from '@/components/RegistrarServiceWorker'

/** Prerrenderiza una app por código válido; cualquier otro código da 404. */
export function generateStaticParams() {
  return codigosValidos().map((codigo) => ({ codigo }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>
}): Promise<Metadata> {
  const { codigo } = await params
  // Next no le añade el basePath a una ruta absoluta de manifest, así que va aquí.
  const base = process.env.BASE_PATH ?? ''
  return {
    title: 'Medicación',
    robots: { index: false, follow: false, nocache: true },
    manifest: `${base}/f/${normalizar(codigo)}/manifest.webmanifest`,
  }
}

export default async function LayoutFamilia({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ codigo: string }>
}) {
  const { codigo } = await params
  return (
    <>
      {children}
      <RegistrarServiceWorker codigo={normalizar(codigo)} />
    </>
  )
}
