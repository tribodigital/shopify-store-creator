import puppeteer from 'puppeteer-core';

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

const randomDelay = (min: number, max: number) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

export async function createShopifyStore(email: string, storeName: string, password: string) {
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}&stealth=true`,
  });

  try {
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // ===== ETAPA 1: PREENCHER EMAIL E AVANÇAR =====
    console.log('🌐 ETAPA 1: Navegando para Shopify...');
    await page.goto('https://shopify.pxf.io/jek2ba', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    console.log('✅ Página inicial carregada!');
    await randomDelay(3000, 4000);
    
    console.log('📧 Esperando campo de email...');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    console.log('✅ Campo de email pronto!');
    
    console.log('📧 Digitando email:', email);
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.click();
      await randomDelay(200, 400);
      await page.keyboard.type(email, { delay: 50 });
      await randomDelay(500, 1000);
    }
    
    console.log('🖱️ Clicando botão para avançar...');
    await page.click('button[type="submit"]');
    await randomDelay(2000, 3000);
    
    console.log('⏳ Aguardando página de signup carregar completamente...');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
    await randomDelay(3000, 5000);
    
    console.log('✅ Página de signup carregada!');
    
    // ===== ETAPA 2: MUDAR PARA UNITED KINGDOM =====
    console.log('🌍 ETAPA 2: MUDANDO PARA UNITED KINGDOM');
    
    // Aguarda a página estabilizar
    await randomDelay(2000, 3000);
    
    // Encontra TODOS os botões e procura pelo de país
    const allButtons = await page.$$('button');
    console.log(`🔍 Encontrou ${allButtons.length} botões`);
    
    let countryButtonIndex = -1;
    for (let i = 0; i < allButtons.length; i++) {
      const text = await page.evaluate((el: any) => el.textContent?.toLowerCase(), allButtons[i]);
      console.log(`  Botão ${i}: ${text?.substring(0, 30)}`);
      
      if (text?.includes('brazil') || text?.includes('brasil') || 
          text?.includes('united') || text?.includes('kingdom') ||
          text?.includes('vietnam')) {
        countryButtonIndex = i;
        console.log(`✅ Botão de país encontrado no índice ${i}: ${text}`);
        break;
      }
    }
    
    if (countryButtonIndex >= 0) {
      console.log('🔘 Clicando no botão de país...');
      await allButtons[countryButtonIndex].click();
      await randomDelay(1500, 2500);
      
      // Aguarda dropdown aparecer
      const dropdownItems = await page.waitForSelector('[role="option"], li', { timeout: 5000 }).catch(() => null);
      if (dropdownItems) {
        console.log('✅ Dropdown aberto!');
        await randomDelay(500, 1000);
      }
      
      // Procura por United Kingdom no dropdown
      console.log('🇬🇧 Procurando United Kingdom...');
      const ukFound = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('[role="option"], li, div, span, button'));
        for (const item of items) {
          const text = item.textContent?.toLowerCase() || '';
          if (text.includes('united kingdom') && text.length < 50) {
            console.log('Encontrou UK, clicando...');
            (item as HTMLElement).click();
            return true;
          }
        }
        return false;
      });
      
      if (ukFound) {
        console.log('✅ United Kingdom selecionado!');
        await randomDelay(1500, 2500);
      } else {
        console.log('⚠️ UK não encontrado no dropdown');
      }
    } else {
      console.log('⚠️ Botão de país não encontrado');
    }
    
    // ===== ETAPA 3: PREENCHER SENHA =====
    console.log('🔐 ETAPA 3: Procurando campo de senha...');
    
    try {
      await page.waitForSelector('input[type="password"]', { timeout: 15000 });
      console.log('✅ Campo de senha encontrado!');
      
      const passwordInput = await page.$('input[type="password"]');
      if (passwordInput) {
        await passwordInput.click();
        await randomDelay(200, 400);
        await page.keyboard.type(password, { delay: 50 });
        console.log('✅ Senha digitada!');
        await randomDelay(1000, 2000);
      }
    } catch (e) {
      console.error('❌ Campo de senha não encontrado após seleção de país');
      throw new Error('Campo de senha nunca apareceu - página pode estar com problema');
    }
    
    // ===== ETAPA 4: CRIAR CONTA =====
    console.log('🔘 ETAPA 4: Clicando em Criar Conta...');
    
    const createButton = await page.$('button[type="submit"]');
    if (createButton) {
      await createButton.click();
      console.log('✅ Botão clicado!');
      await randomDelay(2000, 3000);
    }
    
    // ===== ETAPA 5: AGUARDAR CHECKOUT =====
    console.log('⏳ ETAPA 5: Aguardando redirecionamento...');
    
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }),
        randomDelay(30000, 40000)
      ]);
    } catch (e) {
      console.log('⚠️ Timeout na navegação');
    }
    
    const finalUrl = page.url();
    console.log('🎉 URL FINAL:', finalUrl);
    
    if (finalUrl.includes('country=GB')) {
      console.log('✅✅✅ SUCESSO! Country=GB na URL!');
      return {
        success: true,
        storeUrl: finalUrl,
        message: 'Loja criada! Bandeira em United Kingdom (GB)!'
      };
    } else if (finalUrl.includes('checkout') || finalUrl.includes('extend-trial')) {
      return {
        success: true,
        storeUrl: finalUrl,
        message: 'Em página de checkout'
      };
    } else if (finalUrl.includes('admin.shopify.com')) {
      return {
        success: true,
        storeUrl: finalUrl,
        message: 'Conta criada no admin'
      };
    } else {
      return {
        success: false,
        storeUrl: finalUrl,
        message: 'URL inesperada'
      };
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error);
    return {
      success: false,
      storeUrl: '',
      message: 'Erro: ' + (error as Error).message
    };
  } finally {
    await browser.close();
  }
}
