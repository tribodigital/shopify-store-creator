import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    console.log('📦 Criando loja para:', email);

    // Simular criação (por enquanto)
    const storeUrl = `https://${email.split('@')[0].replace(/[^a-z0-9]/g, '')}.myshopify.com`;
    
    // Salvar no Supabase
    const { data, error } = await supabase
      .from('stores')
      .insert([
        {
          email,
          first_name: firstName,
          last_name: lastName,
          password,
          store_url: storeUrl,
          status: 'success'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro Supabase:', error);
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
      storeUrl,
      createdAt: new Date().toISOString(),
      status: 'success'
    };

    return NextResponse.json(storeData);

  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
