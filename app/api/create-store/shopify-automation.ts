import puppeteer from 'puppeteer-core';

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

export async function createShopifyStore(email: string, storeName: string, password: string) {
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}`,
  });

  try {
    const page = await browser.newPage();
    
    // Vai para página de signup do Shopify
    await page.goto('https://www.shopify.com/signup', { waitUntil: 'networkidle2' });
    
    // Preenche email
    await page.type('input[name="email"]', email);
    
    // Clica em "Start free trial"
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Preenche nome da loja
    await page.type('input[name="storeName"]', storeName);
    
    // Define senha
    await page.type('input[name="password"]', password);
    
    // Submete formulário
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
    
    // Pega URL final da loja
    const storeUrl = page.url();
    
    return {
      success: true,
      storeUrl,
      message: 'Loja criada com sucesso!'
    };
    
  } catch (error) {
    console.error('Erro ao criar loja:', error);
    return {
      success: false,
      message: 'Erro ao criar loja: ' + (error as Error).message
    };
  } finally {
    await browser.close();
  }
}
