import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        let finalUrl = url;

        // Automatically convert Google Drive view links to direct download links
        // Example: https://drive.google.com/file/d/1B-abcdEFG/view?usp=sharing
        const driveRegex = /drive\.google\.com\/file\/d\/([^/]+)\/view/;
        const driveMatch = url.match(driveRegex);

        // Automatically convert Google Docs/Sheets/Slides view links to PDF export
        // Example: https://docs.google.com/document/d/ID/edit?usp=sharing
        const docsRegex = /docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/]+)\//;
        const docsMatch = url.match(docsRegex);

        if (driveMatch && driveMatch[1]) {
            const fileId = driveMatch[1];
            finalUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        } else if (docsMatch && docsMatch[2]) {
            const docType = docsMatch[1]; // document, spreadsheets, presentation
            const fileId = docsMatch[2];
            finalUrl = `https://docs.google.com/${docType}/d/${fileId}/export?format=pdf`;
        }

        const response = await fetch(finalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Access-Control-Allow-Origin': '*', // Permissive for local viewer
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        console.error('Proxy Error:', error);
        return new NextResponse('Error fetching document', { status: 500 });
    }
}
