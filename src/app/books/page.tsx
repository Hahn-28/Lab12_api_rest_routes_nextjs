'use client'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

interface Book {
  id: number
  title: string
  description: string
  publishedYear: number
  genre: string
  pages: number
  author: {
    id: string
    name: string
  }
}

interface Author {
  id: string
  name: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

function BooksContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [books, setBooks] = useState<Book[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  
  // Filtros
  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  
  // Estado para el formulario de crear libro
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newBook, setNewBook] = useState({
    title: '',
    description: '',
    isbn: '',
    publishedYear: '',
    genre: '',
    pages: '',
    authorId: ''
  })

  useEffect(() => {
    fetchAuthors()
    fetchGenres()
  }, [])

  useEffect(() => {
    if (searchParams) {
      const page = searchParams.get('page') || '1'
      fetchBooks(parseInt(page))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedGenre, selectedAuthor, sortBy, order, searchParams])

  const fetchBooks = async (page: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '9',
        ...(search && { search }),
        ...(selectedGenre && { genre: selectedGenre }),
        ...(selectedAuthor && { authorName: selectedAuthor }),
        sortBy,
        order
      })

      const response = await fetch(`/api/books/search?${params}`)
      const data = await response.json()
      setBooks(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAuthors = async () => {
    try {
      const response = await fetch('/api/authors')
      const data = await response.json()
      setAuthors(data)
    } catch (error) {
      console.error('Error fetching authors:', error)
    }
  }

  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/books')
      const data = await response.json()
      const uniqueGenres = Array.from(new Set(data.map((book: Book) => book.genre)))
      setGenres(uniqueGenres as string[])
    } catch (error) {
      console.error('Error fetching genres:', error)
    }
  }

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBook)
      })

      if (response.ok) {
        setShowCreateForm(false)
        setNewBook({
          title: '',
          description: '',
          isbn: '',
          publishedYear: '',
          genre: '',
          pages: '',
          authorId: ''
        })
        fetchBooks(1)
      }
    } catch (error) {
      console.error('Error creating book:', error)
    }
  }

  const handleDeleteBook = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este libro?')) return

    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchBooks(pagination?.page || 1)
      }
    } catch (error) {
      console.error('Error deleting book:', error)
    }
  }

  const handlePageChange = (newPage: number) => {
    router.push(`/books?page=${newPage}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Biblioteca de Libros</h1>

        {/* Filtros y Búsqueda */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded"
          />
          
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Todos los géneros</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>

          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Todos los autores</option>
            {authors.map(author => (
              <option key={author.id} value={author.name}>{author.name}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="createdAt">Fecha de creación</option>
            <option value="title">Título</option>
            <option value="publishedYear">Año de publicación</option>
          </select>

          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
          </select>
        </div>

        {/* Botón Crear Libro */}
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-6"
        >
          Crear Nuevo Libro
        </button>

        {/* Formulario Crear Libro */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Crear Nuevo Libro</h2>
              <form onSubmit={handleCreateBook} className="space-y-4">
                <div>
                  <label className="block mb-1">Título</label>
                  <input
                    type="text"
                    value={newBook.title}
                    onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Descripción</label>
                  <textarea
                    value={newBook.description}
                    onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1">ISBN</label>
                  <input
                    type="text"
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Año de Publicación</label>
                  <input
                    type="number"
                    value={newBook.publishedYear}
                    onChange={(e) => setNewBook({...newBook, publishedYear: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Género</label>
                  <input
                    type="text"
                    value={newBook.genre}
                    onChange={(e) => setNewBook({...newBook, genre: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Páginas</label>
                  <input
                    type="number"
                    value={newBook.pages}
                    onChange={(e) => setNewBook({...newBook, pages: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Autor</label>
                  <select
                    value={newBook.authorId}
                    onChange={(e) => setNewBook({...newBook, authorId: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Seleccionar autor</option>
                    {authors.map(author => (
                      <option key={author.id} value={author.id}>
                        {author.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Lista de Libros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div key={book.id} className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">{book.title}</h3>
                <p className="text-gray-600 mb-2">Por {book.author.name}</p>
                <p className="text-sm text-gray-500 mb-2">
                  {book.description?.substring(0, 100)}
                  {book.description?.length > 100 ? '...' : ''}
                </p>
                <p className="text-sm mb-2">Género: {book.genre}</p>
                <p className="text-sm mb-4">
                  Año: {book.publishedYear} | Páginas: {book.pages}
                </p>
                <div className="flex space-x-2">
                  <Link
                    href={`/books/${book.id}`}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Ver Detalles
                  </Link>
                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {pagination && (
            <div className="mt-8 flex justify-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className={`px-4 py-2 rounded ${
                  pagination.hasPrev
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Anterior
              </button>
              <span className="px-4 py-2">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className={`px-4 py-2 rounded ${
                  pagination.hasNext
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Siguiente
              </button>
            </div>
          )}

          {/* Total de resultados */}
          {pagination && (
            <div className="mt-4 text-center text-gray-600">
              Total: {pagination.total} libros encontrados
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function BooksPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    }>
      <BooksContent />
    </Suspense>
  )
}