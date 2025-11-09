import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    const authors = await prisma.author.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
          { nationality: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        _count: {
          select: { books: true }
        }
      }
    })

    return NextResponse.json(authors)
  } catch (error) {
    return new NextResponse('Error al buscar autores', { status: 500 })
  }
}