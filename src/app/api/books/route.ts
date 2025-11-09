import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET - Obtener todos los libros
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const genre = searchParams.get('genre')
    const authorId = searchParams.get('authorId')
    const search = searchParams.get('search')

    const where = {
      ...(genre && { genre }),
      ...(authorId && { authorId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { genre: { contains: search, mode: 'insensitive' as const } },
          { isbn: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    }

    const books = await prisma.book.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      }
    })

    return NextResponse.json(books)
  } catch (error) {
    console.error('Error al obtener libros:', error)
    return NextResponse.json(
      { error: 'Error al obtener libros', details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo libro
export async function POST(request: Request) {
  try {
    const body = await request.json()
    let {
      title,
      description,
      isbn,
      publishedYear,
      genre,
      pages,
      authorId
    } = body

    // Sanitizar/normalizar
    title = typeof title === 'string' ? title.trim() : title
    description = typeof description === 'string' ? description.trim() : description
    isbn = typeof isbn === 'string' ? isbn.trim() : isbn
    genre = typeof genre === 'string' ? genre.trim() : genre

    // Validaciones
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Título es requerido' },
        { status: 400 }
      )
    }

    if (!authorId || !authorId.trim()) {
      return NextResponse.json(
        { error: 'Autor es requerido' },
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
    if (!isbn || !isbn.trim()) {
      return NextResponse.json(
        { error: 'ISBN es requerido' },
        { status: 400 }
      )
    }

    // Validación básica de ISBN (10 o 13 dígitos)
    const cleanedIsbn = isbn.replace(/[-\s]/g, '')
    const isbnRegex = /^(?:\d{10}|\d{13})$|^(?:\d{9}[\dXx])$/
    if (!isbnRegex.test(cleanedIsbn)) {
      return NextResponse.json(
        { error: 'ISBN inválido. Debe tener 10 o 13 dígitos' },
        { status: 400 }
      )
    }

    if (pages && (isNaN(Number(pages)) || Number(pages) < 1)) {
      return NextResponse.json(
        { error: 'El número de páginas debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Verificar que el autor existe
    const authorExists = await prisma.author.findUnique({
      where: { id: authorId }
    })

    if (!authorExists) {
      return NextResponse.json(
        { error: 'El autor especificado no existe' },
        { status: 404 }
      )
    }

    const book = await prisma.book.create({
      data: {
        title,
        description: description || null,
        isbn: cleanedIsbn, // Usar ISBN limpio sin guiones
        publishedYear: publishedYear ? (isNaN(parseInt(publishedYear)) ? null : parseInt(publishedYear)) : null,
        genre: genre || null,
        pages: pages ? (isNaN(parseInt(pages)) ? null : parseInt(pages)) : null,
        authorId,
      },
      include: {
        author: true,
      },
    })

    return NextResponse.json(book, { status: 201 })
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