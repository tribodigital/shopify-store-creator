import puppeteer from 'puppeteer-core';

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

export async function createShopifyStore(email: string, storeName: string, password: string) {
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}`,
  });

  try {
    const page = await browser.newPage();
    
    console.log('🌐 Navegando para Shopify signup...');
    await page.goto('https://www.shopify.com/signup', { waitUntil: 'networkidle2' });
    
    console.log('📧 Preenchendo email...');
    await page.type('input[name="email"]', email);
    
    console.log('🔘 Clicando em Start free trial...');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log('🏪 Preenchendo nome da loja...');
    await page.type('input[name="storeName"]', storeName);
    
    console.log('🔐 Definindo senha...');
    await page.type('input[name="password"]', password);
    
    console.log('✅ Submetendo formulário...');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
    
    const storeUrl = page.url();
    
    console.log('🎉 Loja criada! URL:', storeUrl);
    
    return {
      success: true,
      storeUrl,
      message: 'Loja criada com sucesso!'
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
