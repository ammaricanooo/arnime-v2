import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
    const client = await clientPromise;
    const db = client.db();

    const comments = await db
        .collection("comments")
        .find()
        .sort({ createdAt: 1 })
        .toArray();

    return NextResponse.json(comments);
}

export async function POST(req: Request) {
    const body = await req.json();
    const { name, text, parentId } = body;

    if (!text) {
        return NextResponse.json(
            { message: "Komentar kosong" },
            { status: 400 }
        );
    }

    const client = await clientPromise;
    const db = client.db();

    await db.collection("comments").insertOne({
        name: name || "Anonymous",
        text,
        parentId: parentId ? new ObjectId(parentId) : null,
        createdAt: new Date(),
    });

    return NextResponse.json({ message: "OK" });
}
