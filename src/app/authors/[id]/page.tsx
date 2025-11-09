import { AuthorDetails } from '@/components/AuthorDetails'

interface ParamsPromise {
  params: Promise<{ id: string }>
}

export default async function AuthorPage({ params }: ParamsPromise) {
  const { id } = await params
  // Guard simple por si faltara id
  if (!id) {
    return <div className="p-6">ID de autor faltante</div>
  }
  return <AuthorDetails authorId={id} />
}
