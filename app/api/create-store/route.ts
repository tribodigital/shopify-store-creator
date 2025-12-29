import { NextRequest, NextResponse } from 'next/server';

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
    // TODO: Adicionar Puppeteer + Browserless aqui
    const storeData = {
      email,
      password,
      firstName,
      lastName,
      storeUrl: `https://${email.split('@')[0].replace(/[^a-z0-9]/g, '')}.myshopify.com`,
      createdAt: new Date().toISOString(),
      status: 'success'
    };

    console.log('✅ Loja criada:', storeData);

    return NextResponse.json(storeData);

  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
