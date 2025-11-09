import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: authorId } = await params;
        if (!authorId) {
            return NextResponse.json({ error: 'ID de autor faltante' }, { status: 400 });
        }

        // Verificar que el autor existe
        const author = await prisma.author.findUnique({
            where: { id: authorId },
            select: { name: true }
        });

        if (!author) {
            return NextResponse.json(
                { error: "Autor no encontrado" },
                { status: 404 }
            );
        }

        // Obtener todos los libros del autor
        const books = await prisma.book.findMany({
            where: { authorId },
            orderBy: { publishedYear: 'asc' }
        });

        if (books.length === 0) {
            return NextResponse.json({
                authorId,
                authorName: author.name,
                totalBooks: 0,
                firstBook: null,
                latestBook: null,
                averagePages: 0,
                genres: [],
                longestBook: null,
                shortestBook: null
            });
        }

        // Calcular estadísticas
        const totalBooks = books.length;
        
        // Primer y último libro
        const firstBook = books[0];
        const latestBook = books[books.length - 1];

        // Promedio de páginas - FIX: manejar posibles null
        const totalPages = books.reduce((sum: number, book) => sum + (book.pages ?? 0), 0);
        const averagePages = Math.round(totalPages / totalBooks);

        // Libro con más páginas - FIX: manejar posibles null
        const longestBook = books.reduce((max, book) => 
            (book.pages ?? 0) > (max.pages ?? 0) ? book : max
        , books[0]);

        // Libro con menos páginas - FIX: manejar posibles null
        const shortestBook = books.reduce((min, book) => 
            (book.pages ?? 0) < (min.pages ?? 0) ? book : min
        , books[0]);

        // Construir respuesta
        const response = {
            authorId,
            authorName: author.name,
            totalBooks,
            firstBook: {
                title: firstBook.title,
                year: firstBook.publishedYear
            },
            latestBook: {
                title: latestBook.title,
                year: latestBook.publishedYear
            },
            averagePages,
            genres: Array.from(new Set(books.map(book => book.genre).filter(genre => genre !== null))),
            longestBook: {
                title: longestBook.title,
                pages: longestBook.pages
            },
            shortestBook: {
                title: shortestBook.title,
                pages: shortestBook.pages
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error("Error al obtener estadísticas del autor:", error);
        return NextResponse.json(
            { error: "Error al obtener estadísticas del autor" },
            { status: 500 }
        );
    }
}