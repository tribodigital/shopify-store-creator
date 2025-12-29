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
    
    // Aguarda um pouco para garantir que tudo carregou
    await delay(3000);
    
    console.log('📸 Tirando screenshot...');
    const screenshot = await page.screenshot({ encoding: 'base64' });
    
    console.log('🔍 Procurando campo de email...');
    
    // Tenta vários seletores possíveis
    const possibleSelectors = [
      'input[type="email"]',
      'input[name="account[email]"]',
      'input[placeholder*="email" i]',
      'input#account_email',
      '#signup-email',
      '[data-email-input]'
    ];
    
    let emailInput = null;
    let usedSelector = '';
    
    for (const selector of possibleSelectors) {
      try {
        emailInput = await page.$(selector);
        if (emailInput) {
          usedSelector = selector;
          console.log(`✅ Encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!emailInput) {
      console.error('❌ Nenhum campo de email encontrado!');
      console.log('📄 HTML da página:', await page.content());
      
      return {
        success: false,
        storeUrl: '',
        message: 'Campo de email não encontrado. Screenshot: data:image/png;base64,' + screenshot
      };
    }
    
    console.log('📧 Preenchendo email com seletor:', usedSelector);
    await page.type(usedSelector, email);
    
    // Aguarda um pouco
    await delay(1000);
    
    console.log('🔘 Procurando botão submit...');
    
    const buttonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Start")',
      '[data-button-submit]'
    ];
    
    let submitButton = null;
    let usedButtonSelector = '';
    
    for (const selector of buttonSelectors) {
      try {
        submitButton = await page.$(selector);
        if (submitButton) {
          usedButtonSelector = selector;
          console.log(`✅ Botão encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!submitButton) {
      console.error('❌ Botão não encontrado!');
      return {
        success: false,
        storeUrl: '',
        message: 'Botão submit não encontrado'
      };
    }
    
    console.log('🔘 Clicando no botão...');
    await page.click(usedButtonSelector);
    
    // Aguarda navegação
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
    
    const storeUrl = page.url();
    console.log('🎉 Progresso! URL atual:', storeUrl);
    
    return {
      success: true,
      storeUrl,
      message: 'Processo iniciado com sucesso!'
    };
    
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
