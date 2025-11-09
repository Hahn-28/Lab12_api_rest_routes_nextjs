import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Obtener un autor específico por ID
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        books: {
          orderBy: {
            publishedYear: 'desc'
          }
        },
        _count: {
          select: { books: true }
        }
      },
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(author)
  } catch (error) {
    console.error('Error al obtener autor:', error)
    return NextResponse.json(
      { error: 'Error al obtener autor', details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
  const body = await request.json()
  let { name, email, bio, nationality, birthYear } = body

  // Sanitizar
  name = typeof name === 'string' ? name.trim() : name
  email = typeof email === 'string' ? email.trim() : email
  bio = typeof bio === 'string' ? bio.trim() : bio
  nationality = typeof nationality === 'string' ? nationality.trim() : nationality

    if (email) {
      const emailRegex = /^[\w.-]+@[\w.-]+\.[\w.-]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Email inválido' },
          { status: 400 }
        )
      }
    }

    // Construir objeto data solo con los campos que se proporcionan
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (bio !== undefined) updateData.bio = bio
    if (nationality !== undefined) updateData.nationality = nationality
    if (birthYear !== undefined) updateData.birthYear = birthYear ? parseInt(birthYear) : null

    // Verificar que hay al menos un campo para actualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron campos para actualizar' },
        { status: 400 }
      )
    }

    const author = await prisma.author.update({
      where: { id },
      data: updateData,
      include: {
        books: true,
      }
    })

    return NextResponse.json(author)
  } catch (error: any) {
    console.error('Error al actualizar autor:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Error al actualizar autor', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await prisma.author.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Autor eliminado correctamente'
    })
  } catch (error: any) {
    console.error('Error al eliminar autor:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Error al eliminar autor', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    )
  }
}