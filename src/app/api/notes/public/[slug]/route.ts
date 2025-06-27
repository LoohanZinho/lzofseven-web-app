import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
// App Hosting provides Application Default Credentials, so no need to pass any config.
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
    const slug = params.slug;

    if (!slug) {
        return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    try {
        const notesRef = db.collection('notes');
        const q = notesRef.where('publicSlug', '==', slug).limit(1);
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        const noteDoc = querySnapshot.docs[0];
        const noteData = noteDoc.data();

        if (noteData.isPrivate) {
            return NextResponse.json({ error: 'This note is private' }, { status: 403 });
        }
        
        // Firestore Timestamps need to be converted for JSON serialization
        const note = {
            title: noteData.title,
            content: noteData.content,
            updatedAt: noteData.updatedAt.toDate().toISOString(),
        }

        return NextResponse.json(note, { status: 200 });

    } catch (error) {
        console.error("Error fetching public note via API:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
