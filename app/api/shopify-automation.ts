import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

export async function createShopifyStore(
  email: string,
  password: string,
  storeName: string
) {
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}&stealth=true`,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );

    console.log('🚀 INICIANDO CRIACAO DA LOJA');
    console.log(`📧 Email: ${email}`);

    // ETAPA 1: Navegar para página inicial da Shopify pelo link de afiliado
    console.log('🌐 ETAPA 1: Navegando para Shopify via link de afiliado...');
    await page.goto(
      'https://www.shopify.com/br/avaliacao-gratuita?irgwc=1&afsrc=1&partner=6709353&affpt=excluded&utm_channel=affiliates&utm_source=6709353-impact&utm_medium=cpa&iradid=1061744',
      { waitUntil: 'networkidle2', timeout: 30000 }
    );
    console.log('✅ Página de avaliação carregada!');

    // ETAPA 2: Preencher email e continuar
    console.log('📧 ETAPA 2: Preenchendo email...');
    await page.waitForSelector('#ctaemail', { timeout: 10000 });
    await page.type('#ctaemail', email, { delay: 50 });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
      page.click('a[type="submit"]'),
    ]);

    // ETAPA 3: Aguardar página de signup carregar (ainda mantém afiliado)
    console.log('⏳ ETAPA 3: Aguardando página de signup...');
    
    // Esperar o combobox de país aparecer (isto confirma que entrou no formulário correto)
    await page.waitForSelector('#country_code', { timeout: 15000 });
    
    console.log('✅ Página de signup carregada!');

    // ETAPA 4: MUDAR PAÍS PARA UNITED KINGDOM
    console.log('🌍 ETAPA 4: Mudando para United Kingdom...');
    await page.evaluate(() => {
      const combobox = document.getElementById('country_code') as HTMLSelectElement;
      if (combobox) {
        combobox.value = 'United Kingdom';
        combobox.dispatchEvent(new Event('change', { bubbles: true }));
        combobox.dispatchEvent(new Event('input', { bubbles: true }));
        combobox.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    });

    await page.waitForTimeout(2000);

    const countryValue = await page.evaluate(() => {
      return (document.getElementById('country_code') as HTMLSelectElement).value;
    });

    console.log(`✅ País selecionado: ${countryValue}`);

    if (countryValue !== 'United Kingdom' && countryValue !== 'GB') {
      throw new Error(`País não mudou corretamente: ${countryValue}`);
    }

    // ETAPA 5: Preencher senha
    console.log('🔐 ETAPA 5: Preenchendo senha...');
    await page.waitForSelector('#account_password', { timeout: 10000 });
    await page.type('#account_password', password, { delay: 50 });
    console.log('✅ Senha digitada!');

    await page.waitForTimeout(1000);

    // ETAPA 6: Aguardar botão ficar habilitado
    console.log('⏳ ETAPA 6: Aguardando botão...');
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        return btn && !btn.disabled;
      },
      { timeout: 10000 }
    );
    console.log('✅ Botão habilitado!');

    // ETAPA 7: Criar conta
    console.log('📝 ETAPA 7: Criando conta...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);

    console.log('✅ Conta criada!');

    // ETAPA 8: Extrair dados finais
    const finalUrl = page.url();
    const urlParams = new URL(finalUrl);
    const countryParam = urlParams.searchParams.get('country');
    const emailParam = urlParams.searchParams.get('ctaemail');
    const shopDomain = urlParams.searchParams.get('shopPermanentDomain');

    console.log('🎉 SUCESSO COMPLETO!');
    console.log(`URL Final: ${finalUrl}`);
    console.log(`Country: ${countryParam}`);

    if (countryParam !== 'GB') {
      throw new Error(`País final não é GB: ${countryParam}`);
    }

    return {
      success: true,
      email: emailParam || email,
      country: 'GB',
      storeUrl: finalUrl,
      storeDomain: shopDomain,
      storeName,
    };
  } catch (error: any) {
    console.error('❌ ERRO:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}
