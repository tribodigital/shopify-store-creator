import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createShopifyStore } from '@/app/api/shopify-automation';

// Inicializar Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Função para gerar senha aleatória
function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Função para extrair nomes do email
function extractNames(email: string): { firstName: string; lastName: string } {
  const localPart = email.split('@')[0];
  const parts = localPart.split(/[._-]/);
  
  const capitalize = (str: string) => 
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  
  return {
    firstName: parts[0] ? capitalize(parts[0]) : 'User',
    lastName: parts[1] ? capitalize(parts[1]) : 'Shopify',
  };
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validação
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Gerar dados
    const password = generatePassword();
    const { firstName, lastName } = extractNames(email);
    const storeName = email.split('@')[0].replace(/[^a-z0-9]/g, '');

    console.log('🚀 Iniciando criação da loja no Shopify...');
    console.log('📧 Email:', email);
    console.log('🏪 Nome da loja:', storeName);

    // CRIAR LOJA REAL NO SHOPIFY COM PUPPETEER
    const result = await createShopifyStore(email, storeName, password);

    if (!result.success) {
      console.error('❌ Erro ao criar loja:', result.error);      
      // Salvar erro no Supabase
      await supabase.from('stores').insert([
        {
          email,
          error: result.error,
          status: 'error'
        }
      ]);
      
          email,
          first_name: firstName,
          last_name: lastName,
          password,
          store_url: null,
          status: 'error'
        }
      ]);

      return NextResponse.json(
        { error: 'Erro ao criar loja no Shopify', details: result.message },
        { status: 500 }
      );
    }

    console.log('✅ Loja criada com sucesso no Shopify!');
    console.log('🔗 URL:', result.storeUrl);

    // Salvar no Supabase
    const { data, error } = await supabase
      .from('stores')
      .insert([
        {
          email,
          first_name: firstName,
          last_name: lastName,
          password,
          store_url: result.storeUrl,
          status: 'success'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar no Supabase:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar no banco de dados' },
        { status: 500 }
      );
    }

    console.log('✅ Loja salva no Supabase:', data);

    const storeData = {
      email,
      password,
      firstName,
      lastName,
      storeUrl: result.storeUrl,
      createdAt: new Date().toISOString(),
      status: 'success'
    };

    return NextResponse.json(storeData);

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
