import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const search = searchParams.get('search')

        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
                { bio: { contains: search, mode: 'insensitive' as const } },
                { nationality: { contains: search, mode: 'insensitive' as const } }
            ]
        } : {}

        const authors = await prisma.author.findMany({
            where,
            include: { 
                books: true,
                _count : {
                    select : {
                        books:true
                    }
                }
            },
            orderBy : {
                name: 'asc'
            }
        });
        return NextResponse.json(authors)
    } catch (error){
        console.error('Error al obtener autores:', error)
        return NextResponse.json (
            {error: 'Error al obtener autores', details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined},
            {status:500}
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json ()
    let {name, email, bio, nationality, birthYear} = body

    // Sanitizar strings
    name = typeof name === 'string' ? name.trim() : name
    email = typeof email === 'string' ? email.trim() : email
    bio = typeof bio === 'string' ? bio.trim() : bio
    nationality = typeof nationality === 'string' ? nationality.trim() : nationality

        if (!name || !name.trim()){
            return NextResponse.json (
                {error: 'Nombre es requerido'},
                {status : 400}
            )
        }

        if (!email || !email.trim()){
            return NextResponse.json (
                {error: 'Email es requerido'},
                {status : 400}
            )
        }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)){
            return NextResponse.json (
            {error: 'Email invalido'},
            {status: 400}
            )
        }
        const author = await prisma.author.create({
            data: {
                name,
                email,
                bio: bio || null,
                nationality: nationality || null,
                birthYear: birthYear ? (isNaN(parseInt(birthYear)) ? null : parseInt(birthYear)) : null,
            },
            include :{
                books: true,
            }
        })
        return NextResponse.json(author, {status:201})
    } catch (error: any){
        console.error('Error al crear autor:', error)
        if (error.code === 'P2002'){
            return NextResponse.json (
                {error: 'El email ya esta registrado'},
                { status: 409 }
            )
        }
        return NextResponse.json (
            {error : 'Error al crear autor', details: process.env.NODE_ENV === 'development' ? error.message : undefined},
            {status : 500}
        )
    }
    
}

