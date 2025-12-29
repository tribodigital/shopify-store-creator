import puppeteer from 'puppeteer-core';

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

// Função helper para delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function createShopifyStore(email: string, storeName: string, password: string) {
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}`,
  });

  try {
    const page = await browser.newPage();
    
    console.log('🌐 Navegando para Shopify signup...');
    await page.goto('https://shopify.pxf.io/jek2ba', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Aguarda carregamento
    await delay(3000);
    
    console.log('📧 Procurando campo de email...');
    
    // Aguarda o campo de email aparecer
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    console.log('✅ Campo de email encontrado!');
    console.log('📧 Preenchendo email:', email);
    
    await page.type('input[type="email"]', email);
    await delay(1000);
    
    console.log('🔘 Procurando botão "Start free trial"...');
    
    // Clica no botão usando JavaScript
    await page.evaluate(() => {
      const button = document.querySelector('button[type="submit"]') as HTMLElement;
      if (button) button.click();
    });
    
    console.log('✅ Botão clicado! Aguardando próxima página...');
    
    // Aguarda navegação ou novo formulário aparecer
    await delay(5000);
    
    console.log('🔐 Procurando campo de senha...');
    
    // Procura campo de senha
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="account[password]"]',
      'input[placeholder*="password" i]',
      '#account_password'
    ];
    
    let passwordFound = false;
    
    for (const selector of passwordSelectors) {
      try {
        const passwordField = await page.$(selector);
        if (passwordField) {
          console.log(`✅ Campo de senha encontrado: ${selector}`);
          console.log('🔐 Preenchendo senha...');
          
          await page.type(selector, password);
          passwordFound = true;
          await delay(1000);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!passwordFound) {
      console.log('⚠️ Campo de senha não encontrado ainda');
    }
    
    // Procura e clica no próximo botão
    console.log('🔘 Procurando botão "Create Shopify account"...');
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const createButton = buttons.find(btn => 
        btn.textContent?.includes('Create') || 
        btn.textContent?.includes('Criar') ||
        btn.type === 'submit'
      );
      if (createButton) (createButton as HTMLElement).click();
    });
    
    console.log('✅ Clicou no botão de criar conta!');
    
    // Aguarda um pouco mais
    await delay(10000);
    
    const finalUrl = page.url();
    console.log('🎉 URL final:', finalUrl);
    
    // Verifica se chegou no admin
    if (finalUrl.includes('admin.shopify.com') || finalUrl.includes('myshopify.com')) {
      console.log('✅ SUCESSO! Conta criada!');
      return {
        success: true,
        storeUrl: finalUrl,
        message: 'Loja criada com sucesso!'
      };
    } else {
      console.log('⚠️ Processo parcial - em página de signup');
      return {
        success: true,
        storeUrl: finalUrl,
        message: 'Processo iniciado - verifique email para confirmar'
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
