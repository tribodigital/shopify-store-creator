'use server';

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

export async function createShopifyStore(
  email: string,
  password: string,
  storeName: string
) {
  const { default: puppeteer } = await import('puppeteer-extra');
  const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default;
  
  puppeteer.use(StealthPlugin());

  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}&stealth=true`,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    console.log('\ud83d\udd17 Navegando para Shopify...');
    await page.goto(
      'https://www.shopify.com/br/avaliacao-gratuita?irgwc=1&afsrc=1&partner=6709353&affpt=excluded&utm_channel=affiliates&utm_source=6709353-impact&utm_medium=cpa&iradid=1061744',
      { waitUntil: 'networkidle2', timeout: 30000 }
    );

    console.log('\ud83d\udce7 Preenchendo email...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', email, { delay: 50 });

    console.log('\ud83c\udf0d Alterando pa\u00eds...');
    await page.waitForSelector('select[name="country"], button[aria-label*="country"]', { timeout: 10000 });
    
    const countryElement = await page.$('select[name="country"]');
    if (countryElement) {
      await countryElement.click();
      await new Promise(resolve => setTimeout(resolve, 300));
      await page.evaluate(() => {
        const options = document.querySelectorAll('option');
        for (const opt of options) {
          if (opt.textContent?.includes('United Kingdom')) {
            (opt as HTMLOptionElement).selected = true;
          }
        }
        const select = document.querySelector('select[name="country"]') as HTMLSelectElement;
        if (select) select.dispatchEvent(new Event('change', { bubbles: true }));
      });
    } else {
      const button = await page.$('button[aria-label*="country"]');
      if (button) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 300));
        await page.evaluate(() => {
          const options = document.querySelectorAll('[role="option"]');
          for (const opt of options) {
            if (opt.textContent?.includes('United Kingdom')) {
              (opt as HTMLElement).click();
              break;
            }
          }
        });
      }
    }

    console.log('\ud83d\udd10 Preenchendo senha...');
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.type('input[type="password"]', password, { delay: 50 });

    console.log('\u2705 Enviando formul\u00e1rio...');
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
    } else {
      await page.click('button');
    }

    console.log('\u23f3 Aguardando dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => null);

    console.log('\ud83d\udccb Extraindo dados...');
    const storeData = await page.evaluate(() => ({
      url: window.location.href,
      host: window.location.hostname,
    }));

    console.log('\u2705 Sucesso!', storeData);
    return {
      email,
      country: 'United Kingdom',
      storeUrl: storeData.url,
      storeDomain: storeData.host,
    };
  } finally {
    await browser.close();
  }
}
