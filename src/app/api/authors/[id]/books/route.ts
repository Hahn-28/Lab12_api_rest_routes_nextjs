import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET - Obtener todos los libros de un autor específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: 'ID de autor faltante' },
        { status: 400 }
      )
    }

    // Verificar que el autor existe
    const author = await prisma.author.findUnique({
      where: { id }
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    // Obtener los libros del autor
    const books = await prisma.book.findMany({
      where: { authorId: id },
      orderBy: { publishedYear: 'desc' },
      select: {
        id: true,
        title: true,
        publishedYear: true,
        genre: true,
        pages: true,
      }
    })

    return NextResponse.json({
      author: {
        id: author.id,
        name: author.name,
      },
      totalBooks: books.length,
      books
    })
  } catch (error) {
    console.error('GET /api/authors/[id]/books error:', error)
    return NextResponse.json(
      { error: 'Error al obtener libros del autor' },
      { status: 500 }
    )
  }
}

// POST - Crear un libro para un autor específico (atajo semántico)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: authorId } = await params
    if (!authorId) {
      return NextResponse.json(
        { error: 'ID de autor faltante' },
        { status: 400 }
      )
    }

    // Verificar que el autor existe
    const author = await prisma.author.findUnique({ where: { id: authorId } })
    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    let { title, description, isbn, publishedYear, genre, pages } = body

    // Sanitizar/validar strings
    title = typeof title === 'string' ? title.trim() : ''
    description = typeof description === 'string' ? description.trim() : ''
    isbn = typeof isbn === 'string' ? isbn.trim() : ''
    genre = typeof genre === 'string' ? genre.trim() : ''

    // Validaciones de campos requeridos
    if (!title) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      )
    }

    if (title.length < 3) {
      return NextResponse.json(
        { error: 'El título debe tener al menos 3 caracteres' },
        { status: 400 }
      )
    }

    // ISBN es requerido según el schema
    if (!isbn) {
      return NextResponse.json(
        { error: 'ISBN es requerido' },
        { status: 400 }
      )
    }

    // Validación básica de ISBN (10 o 13 dígitos)
    const cleanedIsbn = isbn.replace(/[-\s]/g, '')
    if (cleanedIsbn.length === 0) {
      return NextResponse.json(
        { error: 'ISBN es requerido' },
        { status: 400 }
      )
    }
    
    const isbnRegex = /^(?:\d{10}|\d{13})$|^(?:\d{9}[\dXx])$/
    if (!isbnRegex.test(cleanedIsbn)) {
      return NextResponse.json(
        { error: 'ISBN inválido. Debe tener 10 o 13 dígitos' },
        { status: 400 }
      )
    }

    // Procesar campos numéricos opcionales
    let parsedPublishedYear: number | null = null
    if (publishedYear !== undefined && publishedYear !== null && publishedYear !== '') {
      const yearNum = typeof publishedYear === 'string' ? parseInt(publishedYear) : publishedYear
      if (!isNaN(yearNum) && yearNum > 0) {
        parsedPublishedYear = yearNum
      }
    }

    let parsedPages: number | null = null
    if (pages !== undefined && pages !== null && pages !== '') {
      const pagesNum = typeof pages === 'string' ? parseInt(pages) : Number(pages)
      if (!isNaN(pagesNum)) {
        if (pagesNum > 0) {
          parsedPages = pagesNum
        } else {
          return NextResponse.json(
            { error: 'El número de páginas debe ser mayor a 0' },
            { status: 400 }
          )
        }
      }
    }

    const created = await prisma.book.create({
      data: {
        title,
        description: description || null,
        isbn: cleanedIsbn, // Usar ISBN limpio sin guiones
        publishedYear: parsedPublishedYear,
        genre: genre || null,
        pages: parsedPages,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear libro:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El ISBN ya existe' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Error al crear libro', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    )
  }
}