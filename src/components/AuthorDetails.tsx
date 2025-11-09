"use client"

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Author {
	id: string
	name: string
	email: string
	bio?: string
	nationality?: string
	birthYear?: number | null
}

interface Book {
	id: number
	title: string
	publishedYear?: number | null
	genre?: string | null
	pages?: number | null
}

interface AuthorStats {
	authorId: string
	authorName: string
	totalBooks: number
	firstBook?: { title: string; year: number } | null
	latestBook?: { title: string; year: number } | null
	averagePages?: number
	genres?: string[]
	longestBook?: { title: string; pages: number } | null
	shortestBook?: { title: string; pages: number } | null
}

interface AuthorDetailsProps {
	authorId: string
}

export function AuthorDetails({ authorId }: AuthorDetailsProps) {
	const [author, setAuthor] = useState<Author | null>(null)
	const [stats, setStats] = useState<AuthorStats | null>(null)
	const [books, setBooks] = useState<Book[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [editing, setEditing] = useState(false)
	const [showCreateBook, setShowCreateBook] = useState(false)
	const [editForm, setEditForm] = useState<Partial<Author>>({})
	const [newBook, setNewBook] = useState({
		title: '',
		description: '',
		isbn: '',
		publishedYear: '',
		genre: '',
		pages: ''
	})
	const [creatingBook, setCreatingBook] = useState(false)
	const [updatingAuthor, setUpdatingAuthor] = useState(false)

	useEffect(() => {
		if (!authorId) return
		fetchAll()
	}, [authorId])

	const fetchAll = async () => {
		try {
			setLoading(true)
			setError(null)
			const [authorRes, statsRes, booksRes] = await Promise.all([
				fetch(`/api/authors/${authorId}`),
				fetch(`/api/authors/${authorId}/stats`),
				fetch(`/api/authors/${authorId}/books`)
			])

			if (!authorRes.ok) throw new Error('Error cargando autor')
			// Aceptar 404 de stats o books como "sin datos" en lugar de error duro
			if (!statsRes.ok && statsRes.status !== 404) throw new Error('Error cargando estadísticas')
			if (!booksRes.ok && booksRes.status !== 404) throw new Error('Error cargando libros del autor')

			const authorData = await authorRes.json()
			const statsData = statsRes.status === 404 ? null : await statsRes.json()
			const booksPayload = booksRes.status === 404 ? null : await booksRes.json()
			const booksArray: Book[] = booksPayload ? (Array.isArray(booksPayload) ? booksPayload : (booksPayload?.books ?? [])) : []

			setAuthor(authorData)
			setStats(statsData)
			setBooks(booksArray)
			setEditForm(authorData)
		} catch (e: any) {
			console.error(e)
			setError(e.message || 'Error desconocido al cargar datos')
		} finally {
			setLoading(false)
		}
	}

	const handleUpdateAuthor = async (e: React.FormEvent) => {
		e.preventDefault()
		setUpdatingAuthor(true)
		try {
			const res = await fetch(`/api/authors/${authorId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editForm)
			})
			if (!res.ok) throw new Error('Error actualizando autor')
			setEditing(false)
			fetchAll()
		} catch (e: any) {
			setError(e.message)
		} finally {
			setUpdatingAuthor(false)
		}
	}

	const handleCreateBook = async (e: React.FormEvent) => {
		e.preventDefault()
		setCreatingBook(true)
		setError(null) // Limpiar errores anteriores
		try {
			// Preparar los datos, convirtiendo strings vacíos a null/undefined para campos opcionales
			const bookData = {
				title: newBook.title.trim(),
				description: newBook.description.trim() || undefined,
				isbn: newBook.isbn.trim(),
				publishedYear: newBook.publishedYear ? newBook.publishedYear : undefined,
				genre: newBook.genre.trim() || undefined,
				pages: newBook.pages ? newBook.pages : undefined
			}

			const res = await fetch(`/api/authors/${authorId}/books`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(bookData)
			})
			
			if (!res.ok) {
				const errorData = await res.json()
				throw new Error(errorData.error || 'Error creando libro')
			}
			
			setShowCreateBook(false)
			setNewBook({ title: '', description: '', isbn: '', publishedYear: '', genre: '', pages: '' })
			fetchAll()
		} catch (e: any) {
			setError(e.message)
		} finally {
			setCreatingBook(false)
		}
	}

	if (loading) return <div className='flex justify-center py-16'><LoadingSpinner /></div>
	if (error && !author) return (
		<div className='p-6'>
			<p className='text-red-600 mb-4'>{error}</p>
			<button onClick={fetchAll} className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'>Reintentar</button>
		</div>
	)
	if (!author) return <div className='p-6'>Autor no encontrado</div>

	return (
		<div className='container mx-auto px-4 py-8'>
			<Link href='/' className='text-blue-500 hover:text-blue-600 mb-4 inline-block'>← Volver al Dashboard</Link>

			<div className='bg-white rounded-lg shadow p-6 mb-8'>
				{error && (
					<div className='mb-4 rounded border border-red-200 bg-red-50 text-red-700 p-3 flex justify-between items-start'>
						<span>{error}</span>
						<button onClick={fetchAll} className='ml-3 inline-flex items-center rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700'>Reintentar</button>
					</div>
				)}
				{editing ? (
					<form onSubmit={handleUpdateAuthor} className='space-y-4'>
						<div>
							<label className='block mb-1'>Nombre</label>
							<input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className='w-full p-2 border rounded' required />
						</div>
						<div>
							<label className='block mb-1'>Email</label>
							<input type='email' value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className='w-full p-2 border rounded' required />
						</div>
						<div>
							<label className='block mb-1'>Biografía</label>
							<textarea value={editForm.bio || ''} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} className='w-full p-2 border rounded' rows={4} />
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<label className='block mb-1'>Nacionalidad</label>
								<input value={editForm.nationality || ''} onChange={e => setEditForm({ ...editForm, nationality: e.target.value })} className='w-full p-2 border rounded' />
							</div>
							<div>
								<label className='block mb-1'>Año de Nacimiento</label>
								<input type='number' value={editForm.birthYear ?? ''} onChange={e => setEditForm({ ...editForm, birthYear: parseInt(e.target.value) })} className='w-full p-2 border rounded' />
							</div>
						</div>
						<div className='flex justify-end space-x-2'>
							<button type='button' onClick={() => setEditing(false)} className='px-4 py-2 border rounded hover:bg-gray-100'>Cancelar</button>
							<button type='submit' disabled={updatingAuthor} className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'>{updatingAuthor ? 'Guardando...' : 'Guardar'}</button>
						</div>
					</form>
				) : (
					<>
						<div className='flex justify-between items-start mb-4'>
							<h1 className='text-3xl font-bold'>{author.name}</h1>
							<button onClick={() => setEditing(true)} className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'>Editar Autor</button>
						</div>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<div>
								<p className='text-gray-600 mb-2'>{author.email}</p>
								{author.bio && <p className='text-gray-700 mb-4'>{author.bio}</p>}
								{author.nationality && <p className='text-gray-600'>Nacionalidad: {author.nationality}</p>}
								{author.birthYear && <p className='text-gray-600'>Año de nacimiento: {author.birthYear}</p>}
							</div>
							{stats && (
								<div className='bg-gray-50 p-4 rounded-lg'>
									<h2 className='text-xl font-semibold mb-4'>Estadísticas</h2>
									<div className='space-y-2 text-sm'>
										<p>Total de libros: {stats.totalBooks ?? 0}</p>
										<p>Promedio de páginas: {stats.totalBooks ? stats.averagePages ?? 0 : '—'}</p>
										<p>Géneros: {stats.genres && stats.genres.length ? stats.genres.join(', ') : '—'}</p>
										<p>Primer libro: {stats.firstBook ? `${stats.firstBook.title} (${stats.firstBook.year})` : '—'}</p>
										<p>Último libro: {stats.latestBook ? `${stats.latestBook.title} (${stats.latestBook.year})` : '—'}</p>
										<p>Más largo: {stats.longestBook ? `${stats.longestBook.title} (${stats.longestBook.pages} pág.)` : '—'}</p>
										<p>Más corto: {stats.shortestBook ? `${stats.shortestBook.title} (${stats.shortestBook.pages} pág.)` : '—'}</p>
									</div>
								</div>
							)}
						</div>
					</>
				)}
			</div>
			<div className='mb-8'>
				<div className='flex justify-between items-center mb-4'>
					<h2 className='text-2xl font-bold'>Libros</h2>
					<button 
						onClick={() => {
							setError(null)
							setShowCreateBook(true)
						}} 
						className='bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700'
					>
						Agregar Libro
					</button>
				</div>
				{showCreateBook && (
					<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
						<div className='bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto'>
							<h3 className='text-xl font-semibold mb-4'>Nuevo Libro</h3>
							{error && (
								<div className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm'>
									{error}
								</div>
							)}
							<form onSubmit={handleCreateBook} className='space-y-4'>
								<div>
									<label className='block mb-1'>Título <span className='text-red-500'>*</span></label>
									<input 
										value={newBook.title} 
										onChange={e => setNewBook({ ...newBook, title: e.target.value })} 
										required 
										className='w-full p-2 border rounded'
										minLength={3}
									/>
								</div>
								<div>
									<label className='block mb-1'>Descripción</label>
									<textarea value={newBook.description} onChange={e => setNewBook({ ...newBook, description: e.target.value })} className='w-full p-2 border rounded' rows={3} />
								</div>
								<div className='grid grid-cols-2 gap-4'>
									<div>
										<label className='block mb-1'>ISBN <span className='text-red-500'>*</span></label>
										<input 
											value={newBook.isbn} 
											onChange={e => setNewBook({ ...newBook, isbn: e.target.value })} 
											className='w-full p-2 border rounded' 
											required
											placeholder='9781234567890'
										/>
										<p className='text-xs text-gray-500 mt-1'>10 o 13 dígitos</p>
									</div>
									<div>
										<label className='block mb-1'>Año de Publicación</label>
										<input 
											type='number' 
											value={newBook.publishedYear} 
											onChange={e => setNewBook({ ...newBook, publishedYear: e.target.value })} 
											className='w-full p-2 border rounded'
											min='1000'
											max={new Date().getFullYear()}
										/>
									</div>
								</div>
								<div className='grid grid-cols-2 gap-4'>
									<div>
										<label className='block mb-1'>Género</label>
										<input value={newBook.genre} onChange={e => setNewBook({ ...newBook, genre: e.target.value })} className='w-full p-2 border rounded' />
									</div>
									<div>
										<label className='block mb-1'>Páginas</label>
										<input type='number' value={newBook.pages} onChange={e => setNewBook({ ...newBook, pages: e.target.value })} className='w-full p-2 border rounded' />
									</div>
								</div>
								<div className='flex justify-end space-x-2'>
									<button 
										type='button' 
										onClick={() => {
											setShowCreateBook(false)
											setError(null)
											setNewBook({ title: '', description: '', isbn: '', publishedYear: '', genre: '', pages: '' })
										}} 
										className='px-4 py-2 border rounded hover:bg-gray-100'
									>
										Cancelar
									</button>
									<button 
										type='submit' 
										disabled={creatingBook} 
										className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
									>
										{creatingBook ? 'Creando...' : 'Crear'}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
				{books.length === 0 ? (
					<p className='text-gray-500'>Este autor aún no tiene libros.</p>
				) : (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{books.map(book => (
							<div key={book.id} className='bg-white p-4 rounded-lg shadow'>
								<h3 className='text-lg font-semibold mb-1'>{book.title}</h3>
								{book.publishedYear && <p className='text-xs text-gray-500 mb-1'>Año: {book.publishedYear}</p>}
								{book.genre && <p className='text-xs text-gray-500 mb-1'>Género: {book.genre}</p>}
								{book.pages && <p className='text-xs text-gray-500'>Páginas: {book.pages}</p>}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}