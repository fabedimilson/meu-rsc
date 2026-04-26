import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/app/user-actions';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Temporariamente removendo check de sessão para isolar o problema do Token
        return {
          allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          tokenPayload: JSON.stringify({ timestamp: Date.now() }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload concluído:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error("ERRO NO SERVER-SIDE UPLOAD:", error.message);
    return NextResponse.json(
      { error: "Erro no Servidor: " + error.message },
      { status: 400 }
    );
  }
}
