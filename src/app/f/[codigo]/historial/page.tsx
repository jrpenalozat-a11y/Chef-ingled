import { notFound } from 'next/navigation'
import { esCodigoValido, normalizar } from '@/lib/acceso'
import VistaHistorial from '@/components/VistaHistorial'

export default async function PaginaHistorial({
  params,
}: {
  params: Promise<{ codigo: string }>
}) {
  const { codigo } = await params
  if (!esCodigoValido(codigo)) notFound()
  return <VistaHistorial codigo={normalizar(codigo)} />
}
