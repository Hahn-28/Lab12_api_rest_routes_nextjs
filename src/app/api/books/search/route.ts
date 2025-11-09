import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // Obtener los query parameters
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get("search") || "";
        const genre = searchParams.get("genre");
        const authorName = searchParams.get("authorName") || "";
        const page = Math.max(1, Number(searchParams.get("page")) || 1);
        const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const order = (searchParams.get("order")?.toLowerCase() === "asc") ? "asc" : "desc";

        // Validar el campo de ordenamiento
        const validSortFields = ["title", "publishedYear", "createdAt"];
        if (!validSortFields.includes(sortBy)) {
            return NextResponse.json(
                { error: "Campo de ordenamiento inválido" },
                { status: 400 }
            );
        }

        // Construir la consulta base
        const where: any = {
            ...(search && {
                OR: [
                    { title: { contains: search, mode: "insensitive" as const } },
                    { description: { contains: search, mode: "insensitive" as const } },
                    { isbn: { contains: search, mode: "insensitive" as const } }
                ]
            }),
            ...(genre && { genre: genre }),
            ...(authorName && {
                author: {
                    name: {
                        contains: authorName,
                        mode: "insensitive" as const,
                    }
                }
            }),
        };

        // Obtener el total de registros
        const total = await prisma.book.count({ where });

        // Calcular la paginación
        const skip = (page - 1) * limit;
        const totalPages = Math.ceil(total / limit);

        // Obtener los libros
        const books = await prisma.book.findMany({
            where,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                [sortBy]: order
            },
            skip,
            take: limit,
        });

        // Preparar la respuesta
        const response = {
            data: books,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error("Error en la búsqueda de libros:", error);
        return NextResponse.json(
            { error: "Error al buscar libros" },
            { status: 500 }
        );
    }
}