'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Author {
  id: string
  name: string
  email: string
  bio?: string
  nationality?: string
  birthYear?: number | null
  _count?: { books: number }
}

export default function HomePage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form crear autor (modal)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    bio: '',
    nationality: '',
    birthYear: ''
  })

  useEffect(() => {
    fetchAuthors()
  }, [])

  const fetchAuthors = async (q?: string) => {
    try {
      setError(null)
      const url = q && q.trim().length > 0 ? `/api/authors?search=${encodeURIComponent(q)}` : '/api/authors'
      const response = await fetch(url)
      if (!response.ok) {
        console.error('Error HTTP al obtener autores:', response.status)
        setAuthors([])
        setError('No se pudieron cargar los autores.')
        return
      }
      const data = await response.json()
      const list: Author[] = Array.isArray(data) ? data : (data?.authors ?? [])
      setAuthors(list)
    } catch (err) {
      console.error('Error fetching authors:', err)
      setError('Ocurrió un error al cargar autores.')
    } finally {
      setLoading(false)
    }
  }

  // Búsqueda dinámica con debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      fetchAuthors(query)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const createAuthor = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'No se pudo crear el autor')
      }
      setForm({ name: '', email: '', bio: '', nationality: '', birthYear: '' })
      fetchAuthors(query)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Biblioteca Digital</h1>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Búsqueda y botón de creación */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Autores</h2>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    Agregar autor
                  </button>
                </div>
                <div className="flex gap-3">
                  <input
                    className="flex-1 p-2 border rounded"
                    placeholder="Escribe para buscar (nombre, email, bio, nacionalidad)"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                  <button
                    type="button"
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                    onClick={() => { setQuery(''); setLoading(true); fetchAuthors('') }}
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Resultados</h2>
            </div>
            {error && (
              <div className="m-4 rounded border border-red-200 bg-red-50 text-red-700 p-3">
                {error}
                <button
                  onClick={() => { setLoading(true); fetchAuthors(query); }}
                  className="ml-3 inline-flex items-center rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                >
                  Reintentar
                </button>
              </div>
            )}
            <ul className="divide-y divide-gray-200">
              {Array.isArray(authors) && authors.map((author) => (
                <li key={author.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-blue-600 truncate">{author.name}</h3>
                      {author.bio && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{author.bio}</p>}
                      <p className="mt-1 text-sm text-gray-400">{author._count?.books ?? 0} libros publicados</p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <Link
                        href={`/authors/${author.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        Ver Perfil
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
              {Array.isArray(authors) && authors.length === 0 && (
                <li className="px-4 py-6 text-gray-500">No se encontraron autores.</li>
              )}
            </ul>
          </div>
        </div>
      </main>

      {/* Modal crear autor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Nuevo autor</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={async (e) => { await createAuthor(e); if (!error) setIsModalOpen(false) }} className="space-y-3">
              <input className="w-full p-2 border rounded" placeholder="Nombre" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="w-full p-2 border rounded" placeholder="Email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input className="w-full p-2 border rounded" placeholder="Nacionalidad" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} />
              <input className="w-full p-2 border rounded" placeholder="Año de nacimiento" type="number" value={form.birthYear} onChange={e => setForm({ ...form, birthYear: e.target.value })} />
              <textarea className="w-full p-2 border rounded" placeholder="Biografía" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-100">Cancelar</button>
                <button disabled={creating} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                  {creating ? 'Creando...' : 'Crear autor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
