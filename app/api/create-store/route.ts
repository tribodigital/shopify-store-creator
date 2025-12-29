import { NextRequest, NextResponse } from 'next/server';
import { createShopifyStore } from '@/app/api/shopify-automation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await createShopifyStore(email, password, email.split('@')[0]);

    console.log('🎉 Loja criada com sucesso!');

    return NextResponse.json(
      {
        success: true,
        email: result.email,
        country: result.country,
        storeUrl: result.storeUrl,
        storeDomain: result.storeDomain,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erro:', error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar loja' },
      { status: 500 }
    );
  }
}
