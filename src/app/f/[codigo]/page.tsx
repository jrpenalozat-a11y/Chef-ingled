import { notFound } from 'next/navigation'
import { esCodigoValido, normalizar } from '@/lib/acceso'
import VistaDia from '@/components/VistaDia'

export default async function PaginaDia({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params
  if (!esCodigoValido(codigo)) notFound()
  return <VistaDia codigo={normalizar(codigo)} />
}
