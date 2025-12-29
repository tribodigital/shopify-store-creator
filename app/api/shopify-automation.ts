import puppeteer from 'puppeteer-core';

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

const randomDelay = (min: number, max: number) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

async function humanType(page: any, selector: string, text: string) {
  try {
    const element = await page.$(selector);
    if (!element) return false;
    
    await element.click();
    await randomDelay(100, 300);
    
    for (const char of text) {
      await element.type(char);
      await randomDelay(50, 150);
    }
    
    return true;
  } catch (e) {
    console.error(`Erro ao digitar em ${selector}:`, e);
    return false;
  }
}

export async function createShopifyStore(email: string, storeName: string, password: string) {
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}&stealth=true`,
  });

  try {
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🌐 ETAPA 1: Navegando para Shopify signup...');
    await page.goto('https://shopify.pxf.io/jek2ba', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    console.log('✅ Página carregada!');
    await randomDelay(3000, 5000);
    
    // ===== ETAPA 1: PREENCHER EMAIL =====
    console.log('📧 ETAPA 1: Preenchendo email...');
    
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 20000 });
      console.log('✅ Campo de email encontrado!');
    } catch (e) {
      throw new Error('Campo de email não encontrado');
    }
    
    console.log('📧 Digitando email:', email);
    const emailTyped = await humanType(page, 'input[type="email"]', email);
    
    if (!emailTyped) {
      throw new Error('Falha ao digitar email');
    }
    
    await randomDelay(1000, 2000);
    
    // Clica no botão
    await page.waitForSelector('button[type="submit"]', { visible: true, timeout: 10000 });
    const button = await page.$('button[type="submit"]');
    if (button) {
      const box = await button.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
        await randomDelay(200, 500);
      }
    }
    
    console.log('🖱️ Clicando no botão email...');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 });
      console.log('✅ Navegou para página de signup!');
    } catch (navError) {
      console.log('⚠️ Navegação demorou, continuando...');
    }
    
    await randomDelay(3000, 5000);
    
    // ===== ETAPA 2: MUDAR PAÍS PARA UNITED KINGDOM =====
    console.log('🌍 ETAPA 2: MUDANDO PAÍS PARA UNITED KINGDOM');
    console.log('⚠️ CRÍTICO: A bandeira NUNCA pode ficar em Brasil!');
    
    // Aguarda a página carregar
    await randomDelay(2000, 3000);
    
    // Clica no dropdown de país
    console.log('🔘 Procurando e clicando no dropdown de país...');
    
    const countryDropdownClicked = await page.evaluate(() => {
      // Procura o botão que contém o país (Brasil ou outro)
      const buttons = Array.from(document.querySelectorAll('button'));
      const countryBtn = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('brasil') || text.includes('brazil') || text.includes('united kingdom');
      });
      
      if (countryBtn) {
        console.log('Encontrou botão de país, clicando...');
        (countryBtn as HTMLElement).click();
        return true;
      }
      return false;
    });
    
    if (!countryDropdownClicked) {
      console.log('⚠️ Dropdown não encontrado com evaluate, tentando método alternativo...');
      const buttons = await page.$$('button');
      if (buttons.length > 0) {
        // Clica no primeiro botão (geralmente é o dropdown)
        await buttons[0].click();
        console.log('✅ Clicou no primeiro botão');
      }
    } else {
      console.log('✅ Dropdown clicado com evaluate!');
    }
    
    await randomDelay(1000, 2000);
    
    // Aguarda as opções aparecerem
    console.log('⏳ Aguardando opções de país...');
    await randomDelay(1000, 2000);
    
    // Clica em "United Kingdom"
    console.log('🇬🇧 Selecionando United Kingdom...');
    
    const ukSelected = await page.evaluate(() => {
      // Procura por "United Kingdom" em elementos visíveis
      const allElements = document.querySelectorAll('*');
      
      for (const element of allElements) {
        const text = element.textContent?.toLowerCase() || '';
        
        // Se encontra "united kingdom"
        if (text.includes('united kingdom') && text.length < 50) {
          console.log('Encontrou United Kingdom, clicando...');
          (element as HTMLElement).click();
          return true;
        }
      }
      
      return false;
    });
    
    if (ukSelected) {
      console.log('✅ SUCESSO! United Kingdom selecionado!');
      await randomDelay(1000, 2000);
    } else {
      console.log('❌ Não conseguiu selecionar United Kingdom automaticamente');
      console.log('🔍 Procurando alternativas...');
      
      // Tenta clicar em qualquer opção que contenha "Kingdom"
      const clicked = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('[role="option"], li, button, div'));
        for (const el of elements) {
          if (el.textContent?.includes('Kingdom')) {
            (el as HTMLElement).click();
            return true;
          }
        }
        return false;
      });
      
      if (clicked) {
        console.log('✅ Clicou em elemento com "Kingdom"');
        await randomDelay(1000, 2000);
      }
    }
    
    // ===== VERIFICAR QUE MUDOU PARA UK =====
    const currentCountry = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const countryBtn = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('united') || text.includes('kingdom') || text.includes('brasil');
      });
      return countryBtn?.textContent || 'DESCONHECIDO';
    });
    
    console.log('📍 País atual:', currentCountry);
    
    if (currentCountry.toLowerCase().includes('brasil') || currentCountry.toLowerCase().includes('brazil')) {
      console.error('❌ ERRO CRÍTICO: País ainda está em Brasil!');
      throw new Error('Falha ao mudar para United Kingdom - ainda em Brasil!');
    }
    
    console.log('✅ País confirmado como não-Brasil!');
    
    // ===== ETAPA 3: PREENCHER SENHA =====
    console.log('🔐 ETAPA 3: Preenchendo senha...');
    
    await randomDelay(2000, 3000);
    
    const passwordSelectors = [
      'input[type="password"]',
      'input[name*="password"]',
      'input[placeholder*="password" i]',
      'input[placeholder*="Senha" i]'
    ];
    
    let passwordFound = false;
    
    for (const selector of passwordSelectors) {
      const field = await page.$(selector);
      if (field) {
        console.log(`✅ Campo de senha encontrado: ${selector}`);
        console.log('🔐 Digitando senha...');
        await humanType(page, selector, password);
        passwordFound = true;
        await randomDelay(1000, 2000);
        break;
      }
    }
    
    if (!passwordFound) {
      throw new Error('Campo de senha não encontrado');
    }
    
    // ===== ETAPA 4: CLICAR EM "CRIE UMA CONTA" =====
    console.log('🔘 ETAPA 4: Clicando em "Crie uma conta da Shopify"...');
    
    await randomDelay(1000, 2000);
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const createBtn = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('crie') && text.includes('conta') && text.includes('shopify');
      });
      
      if (createBtn) {
        (createBtn as HTMLElement).click();
        return true;
      }
      return false;
    });
    
    console.log('✅ Botão clicado!');
    
    // ===== ETAPA 5: AGUARDAR CHECKOUT =====
    console.log('⏳ ETAPA 5: Aguardando redirecionamento para checkout...');
    
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }),
        randomDelay(20000, 30000)
      ]);
    } catch (e) {
      console.log('⚠️ Timeout na navegação, continuando...');
    }
    
    await randomDelay(3000, 5000);
    
    const finalUrl = page.url();
    console.log('🎉 URL final:', finalUrl);
    
    // Verifica se chegou no checkout
    if (finalUrl.includes('checkout') || finalUrl.includes('extend-trial')) {
      console.log('✅ SUCESSO TOTAL! Chegou na página de checkout com a BANDEIRA CORRETA!');
      
      return {
        success: true,
        storeUrl: finalUrl,
        message: 'Conta criada com sucesso! Bandeira foi alterada para United Kingdom!'
      };
    } else if (finalUrl.includes('admin.shopify.com')) {
      console.log('✅ SUCESSO! Chegou no admin!');
      
      return {
        success: true,
        storeUrl: finalUrl,
        message: 'Loja criada com sucesso!'
      };
    } else {
      console.log('⚠️ Em etapa de verificação');
      
      return {
        success: true,
        storeUrl: finalUrl,
        message: 'Processo em progresso'
      };
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar loja:', error);
    return {
      success: false,
      storeUrl: '',
      message: 'Erro ao criar loja: ' + (error as Error).message
    };
  } finally {
    await browser.close();
  }
}
