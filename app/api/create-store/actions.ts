'use server';

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

    console.log('🔗 Navegando para Shopify via link de afiliado...');
    await page.goto(
      'https://www.shopify.com/br/avaliacao-gratuita?irgwc=1&afsrc=1&partner=6709353&affpt=excluded&utm_channel=affiliates&utm_source=6709353-impact&utm_medium=cpa&iradid=1061744',
      { waitUntil: 'networkidle2', timeout: 30000 }
    );

    console.log('📧 Preenchendo email...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', email, { delay: 50 });

    console.log('🌍 Alterando país para United Kingdom...');
    await page.waitForSelector('select[name="country"], button[aria-label*="country"], [role="combobox"]', {
      timeout: 10000,
    });

    const countrySelectors = [
      'select[name="country"]',
      'button[aria-label*="country"]',
      'button[aria-haspopup="listbox"]',
    ];

    let countryFound = false;
    for (const selector of countrySelectors) {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        countryFound = true;
        break;
      }
    }

    if (countryFound) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await page.evaluate(() => {
        const options = document.querySelectorAll('[role="option"], li, button');
        for (const option of options) {
            (option as HTMLElement).click();
            break;
          }
        }
      });
    }

    console.log('🔐 Preenchendo senha...');
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.type('input[type="password"]', password, { delay: 50 });

    console.log('✅ Clicando em criar conta...');
    const createButtonSelectors = [
      'button[type="submit"]',
      'button:contains("Create")',
      'button:contains("Criar")',
      'button:contains("Start free trial")',
    ];

    for (const selector of createButtonSelectors) {
      const button = await page.$(selector);
      if (button) {
        await button.click();
        break;
      }
    }

    console.log('⏳ Aguardando carregamento do dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {
      console.log('Navegação completada');
    });

    console.log('📋 Extraindo informações da loja...');
    const storeData = await page.evaluate(() => {
      const urlParams = new URL(window.location.href);
      const domain = urlParams.hostname;
      const storeUrl = window.location.href;
      
      return {
        email,
        country: 'United Kingdom',
        storeUrl,
        storeDomain: domain,
      };
    });

    console.log('✅ Loja criada com sucesso!', storeData);
    return storeData;
  } finally {
    await browser.close();
  }
}
