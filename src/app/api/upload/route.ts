import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file || file.size === 0) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
        }

        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
        }

        // Generate a unique filename to avoid overwrites
        const ext = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'jpg';
        const uniqueFilename = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        // Convert File to Buffer for reliable serverless upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const blob = await put(uniqueFilename, buffer, {
            access: 'public',
            contentType: file.type,
        });

        return NextResponse.json({ url: blob.url });
    } catch (error: any) {
        console.error('Blob upload error:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to upload file' },
            { status: 500 }
        );
    }
}
