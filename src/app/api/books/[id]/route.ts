import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Obtener un libro específico por ID
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const bookId = parseInt(id);
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        author: true,
      },
    })

    if (!book) {
      return NextResponse.json(
        { error: 'Libro no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(book)
  } catch (error) {
    console.error('Error al obtener libro:', error)
    return NextResponse.json(
      { error: 'Error al obtener libro', details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un libro
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const bookId = parseInt(id);
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

    // Construir objeto data solo con los campos que se proporcionan
    const updateData: any = {}
    let cleanedIsbn: string | undefined

    // Validaciones
    if (title !== undefined) {
      if (!title || !title.trim()) {
        return NextResponse.json(
          { error: 'El título no puede estar vacío' },
          { status: 400 }
        )
      }
      if (title.length < 3) {
        return NextResponse.json(
          { error: 'El título debe tener al menos 3 caracteres' },
          { status: 400 }
        )
      }
      updateData.title = title
    }

    if (description !== undefined) {
      updateData.description = description || null
    }

    // Validación básica de ISBN si se actualiza
    if (isbn !== undefined) {
      if (!isbn || !isbn.trim()) {
        return NextResponse.json(
          { error: 'ISBN no puede estar vacío' },
          { status: 400 }
        )
      }
      cleanedIsbn = isbn.replace(/[-\s]/g, '')
      if (cleanedIsbn) {
        const isbnRegex = /^(?:\d{10}|\d{13})$|^(?:\d{9}[\dXx])$/
        if (!isbnRegex.test(cleanedIsbn)) {
          return NextResponse.json(
            { error: 'ISBN inválido. Debe tener 10 o 13 dígitos' },
            { status: 400 }
          )
        }
        updateData.isbn = cleanedIsbn // Actualizar con ISBN limpio
      }
    }

    if (publishedYear !== undefined) {
      updateData.publishedYear = publishedYear ? (isNaN(parseInt(publishedYear)) ? null : parseInt(publishedYear)) : null
    }

    if (genre !== undefined) {
      updateData.genre = genre || null
    }

    if (pages !== undefined && pages !== null) {
      if (isNaN(Number(pages)) || Number(pages) < 1) {
        return NextResponse.json(
          { error: 'El número de páginas debe ser mayor a 0' },
          { status: 400 }
        )
      }
      updateData.pages = pages ? (isNaN(parseInt(pages)) ? null : parseInt(pages)) : null
    }

    // Si se cambia el autor, verificar que existe
    if (authorId !== undefined) {
      const authorExists = await prisma.author.findUnique({
        where: { id: authorId }
      })

      if (!authorExists) {
        return NextResponse.json(
          { error: 'El autor especificado no existe' },
          { status: 404 }
        )
      }
      updateData.authorId = authorId
    }

    // Verificar que hay al menos un campo para actualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron campos para actualizar' },
        { status: 400 }
      )
    }

    const book = await prisma.book.update({
      where: { id: bookId },
      data: updateData,
      include: {
        author: true,
      }
    })

    return NextResponse.json(book)
  } catch (error: any) {
    console.error('Error al actualizar libro:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Libro no encontrado' },
        { status: 404 }
      )
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El ISBN ya existe' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Error al actualizar libro', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un libro
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const bookId = parseInt(id);
    await prisma.book.delete({
      where: { id: bookId },
    })

    return NextResponse.json({
      message: 'Libro eliminado correctamente'
    })
  } catch (error: any) {
    console.error('Error al eliminar libro:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Libro no encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Error al eliminar libro', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    )
  }
}