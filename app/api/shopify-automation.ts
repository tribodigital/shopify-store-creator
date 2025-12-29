import puppeteer from 'puppeteer-core';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

// Função helper para delay aleatório (mais humano)
const randomDelay = (min: number, max: number) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Função para digitar como humano
async function humanType(page: any, selector: string, text: string) {
  const element = await page.$(selector);
  if (!element) return false;
  
  await element.click();
  await randomDelay(100, 300);
  
  for (const char of text) {
    await element.type(char);
    await randomDelay(50, 150); // Delay entre cada caractere
  }
  
  return true;
}

export async function createShopifyStore(email: string, storeName: string, password: string) {
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}&stealth=true`,
  });

  try {
    const page = await browser.newPage();
    
    // Configurar user agent real
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    
    // Configurar viewport como desktop real
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🌐 Navegando para Shopify signup...');
    await page.goto('https://shopify.pxf.io/jek2ba', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Aguarda como humano
    await randomDelay(2000, 4000);
    
    console.log('📧 Procurando campo de email...');
    
    // Aguarda o campo de email aparecer
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 15000 });
      console.log('✅ Campo de email encontrado!');
    } catch (e) {
      console.log('❌ Campo de email não encontrado');
      const html = await page.content();
      console.log('📄 HTML:', html.substring(0, 500));
      throw new Error('Campo de email não encontrado');
    }
    
    console.log('📧 Digitando email como humano:', email);
    
    // Digita como humano
    const emailTyped = await humanType(page, 'input[type="email"]', email);
    
    if (!emailTyped) {
      throw new Error('Não conseguiu digitar no campo de email');
    }
    
    await randomDelay(1000, 2000);
    
    console.log('🔘 Procurando botão submit...');
    
    // Aguarda botão estar visível e clicável
    await page.waitForSelector('button[type="submit"]', { visible: true, timeout: 10000 });
    
    // Move mouse até o botão (mais humano)
    const button = await page.$('button[type="submit"]');
    if (button) {
      const box = await button.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
        await randomDelay(200, 500);
      }
    }
    
    console.log('🖱️ Clicando no botão...');
    
    // Clica no botão
    await page.click('button[type="submit"]');
    
    console.log('⏳ Aguardando navegação...');
    
    // Aguarda navegação ou mudança na página
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
      randomDelay(10000, 15000)
    ]);
    
    const currentUrl = page.url();
    console.log('📍 URL atual:', currentUrl);
    
    // Aguarda mais um pouco
    await randomDelay(3000, 5000);
    
    console.log('🔐 Procurando campo de senha...');
    
    // Tenta encontrar campo de senha
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="account[password]"]',
      'input[placeholder*="password" i]',
      'input[placeholder*="senha" i]',
      '#account_password'
    ];
    
    let passwordField = null;
    let passwordSelector = '';
    
    for (const selector of passwordSelectors) {
      try {
        passwordField = await page.$(selector);
        if (passwordField) {
          passwordSelector = selector;
          console.log(`✅ Campo de senha encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (passwordField) {
      console.log('🔐 Digitando senha como humano...');
      await humanType(page, passwordSelector, password);
      await randomDelay(1000, 2000);
      
      console.log('🔘 Procurando botão criar conta...');
      
      // Procura botão de criar conta
      const createButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => 
          btn.textContent?.toLowerCase().includes('create') ||
          btn.textContent?.toLowerCase().includes('criar') ||
          btn.type === 'submit'
        );
      });
      
      if (createButton) {
        console.log('✅ Botão criar conta encontrado!');
        
        // Move mouse e clica
        const box = await createButton.asElement()?.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
          await randomDelay(200, 500);
        }
        
        await createButton.asElement()?.click();
        console.log('🖱️ Clicou no botão criar conta!');
        
        // Aguarda mais navegação
        await randomDelay(10000, 15000);
      }
    } else {
      console.log('⚠️ Campo de senha não encontrado - pode estar em outra etapa');
    }
    
    const finalUrl = page.url();
    console.log('🎉 URL final:', finalUrl);
    
    // Tira screenshot final
    const screenshot = await page.screenshot({ encoding: 'base64', fullPage: false });
    console.log('📸 Screenshot capturado');
    
    // Verifica se chegou no admin ou myshopify
    if (finalUrl.includes('admin.shopify.com') && !finalUrl.includes('signup')) {
      console.log('✅ SUCESSO TOTAL! Conta criada e logada!');
      return {
        success: true,
        storeUrl: finalUrl,
        message: 'Loja criada com sucesso!'
      };
    } else if (finalUrl.includes('myshopify.com')) {
      console.log('✅ Loja criada! Redirecionado para myshopify');
      return {
        success: true,
        storeUrl: finalUrl,
        message: 'Loja criada com sucesso!'
      };
    } else {
      console.log('⚠️ Processo parcial - ainda em signup');
      return {
        success: false,
        storeUrl: finalUrl,
        message: 'Processo iniciado mas não completou - possível captcha ou verificação necessária'
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
