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
    
    // ===== ETAPA 1: NAVEGAR E PREENCHER EMAIL =====
    console.log('🌐 ETAPA 1: Navegando para Shopify...');
    await page.goto('https://shopify.pxf.io/jek2ba', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    console.log('✅ Página carregada!');
    await randomDelay(2000, 3000);
    
    console.log('📧 Procurando campo de email...');
    await page.waitForSelector('input[type="email"]', { timeout: 20000 });
    console.log('✅ Campo de email encontrado!');
    
    console.log('📧 Digitando email:', email);
    await humanType(page, 'input[type="email"]', email);
    await randomDelay(1000, 2000);
    
    console.log('🖱️ Clicando no botão para avançar...');
    await page.waitForSelector('button[type="submit"]', { visible: true, timeout: 10000 });
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 });
      console.log('✅ Navegou para página de signup!');
    } catch (navError) {
      console.log('⚠️ Navegação demorou, continuando...');
    }
    
    await randomDelay(2000, 3000);
    
    // ===== ETAPA 2: MUDAR PARA UNITED KINGDOM =====
    console.log('🌍 ETAPA 2: SELECIONANDO UNITED KINGDOM');
    console.log('⚠️ CRÍTICO: Procurando select element ou combobox...');
    
    await randomDelay(2000, 3000);
    
    // Procura por um select element
    const hasSelect = await page.evaluate(() => {
      return !!document.querySelector('select');
    });
    
    console.log('🔍 Procurando elemento SELECT...');
    
    if (hasSelect) {
      console.log('✅ Encontrou <select>!');
      try {
        // Tenta encontrar a opção correta no select
        const options = await page.evaluate(() => {
          const select = document.querySelector('select');
          if (!select) return [];
          
          return Array.from(select.querySelectorAll('option')).map((opt: any) => ({
            value: opt.value,
            text: opt.textContent
          }));
        });
        
        console.log('📋 Opções encontradas:', options.length);
        
        // Procura por GB, United Kingdom ou similares
        let gbValue = '';
        for (const opt of options) {
          console.log(`  - ${opt.text} (value: ${opt.value})`);
          if (opt.text?.includes('United Kingdom') || opt.value?.includes('GB') || opt.text?.includes('UK')) {
            gbValue = opt.value;
            console.log(`✅ Encontrado: ${opt.text}`);
            break;
          }
        }
        
        if (gbValue) {
          console.log(`🔧 Selecionando GB com value: ${gbValue}`);
          await page.select('select', gbValue);
          console.log('✅ GB selecionado via select()!');
        } else {
          console.log('⚠️ GB não encontrado nas opções!');
        }
      } catch (selectError) {
        console.error('❌ Erro ao usar select():', selectError);
      }
    } else {
      console.log('❌ Nenhum <select> encontrado - pode ser um combobox customizado');
      console.log('🎯 Tentando clicar e usar keyboard navigation...');
      
      // Se não for select puro, tenta com keyboard
      try {
        // Encontra e clica no botão dropdown
        const buttons = await page.$$('button');
        let clicked = false;
        
        for (const btn of buttons) {
          const text = await page.evaluate((el: any) => el.textContent?.toLowerCase(), btn);
          
          if (text?.includes('brazil') || text?.includes('brasil') || 
              text?.includes('vietnam') || text?.includes('united kingdom')) {
            console.log('🔘 Encontrou botão de país:', text);
            await btn.click();
            clicked = true;
            await randomDelay(800, 1200);
            break;
          }
        }
        
        if (clicked) {
          console.log('⌨️ Abrindo dropdown com keyboard...');
          
          // Tenta abrir com arrow down
          await page.keyboard.press('ArrowDown');
          await randomDelay(300, 500);
          
          // Navega até UK (vai para Z depois sobe 5)
          await page.keyboard.press('End');
          await randomDelay(200, 300);
          
          for (let i = 0; i < 5; i++) {
            await page.keyboard.press('ArrowUp');
            await randomDelay(100, 150);
          }
          
          console.log('🇬🇧 Confirmando seleção...');
          await page.keyboard.press('Enter');
          await randomDelay(800, 1200);
          
          console.log('✅ Seleção concluída!');
        }
      } catch (keyboardError) {
        console.error('❌ Erro com keyboard navigation:', keyboardError);
      }
    }
    
    // Verifica país final
    const currentCountry = await page.evaluate(() => {
      // Procura em select
      const select = document.querySelector('select') as HTMLSelectElement;
      if (select) {
        const selectedOption = select.querySelector('option:checked');
        return selectedOption?.textContent || 'DESCONHECIDO';
      }
      
      // Procura em botão
      const buttons = Array.from(document.querySelectorAll('button'));
      const countryBtn = buttons.find((btn: any) => 
        btn.textContent?.toLowerCase().includes('united') ||
        btn.textContent?.toLowerCase().includes('kingdom') ||
        btn.textContent?.toLowerCase().includes('brasil') ||
        btn.textContent?.toLowerCase().includes('vietnam')
      );
      return countryBtn?.textContent || 'DESCONHECIDO';
    });
    
    console.log('📍 País final:', currentCountry);
    
    if (currentCountry.toLowerCase().includes('brasil') || 
        currentCountry.toLowerCase().includes('brazil') ||
        currentCountry.toLowerCase().includes('vietnam') ||
        currentCountry.toLowerCase().includes('desconhecido')) {
      console.warn('⚠️ País não é UK:', currentCountry);
      console.log('ℹ️ Continuando mesmo assim (página pode estar em estado intermediário)');
    } else if (currentCountry.includes('United Kingdom')) {
      console.log('✅ United Kingdom confirmado!');
    }
    
    await randomDelay(2000, 3000);
    
    // ===== ETAPA 3: PREENCHER SENHA =====
    console.log('🔐 ETAPA 3: Preenchendo senha...');
    
    await randomDelay(1000, 2000);
    
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });
    console.log('✅ Campo de senha encontrado!');
    
    console.log('🔐 Digitando senha...');
    await humanType(page, 'input[type="password"]', password);
    await randomDelay(1000, 2000);
    
    // ===== ETAPA 4: CLICAR EM CRIAR CONTA =====
    console.log('🔘 ETAPA 4: Clicando em "Crie uma conta da Shopify"...');
    
    await randomDelay(500, 1000);
    
    const buttonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const createBtn = buttons.find((btn: any) => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('crie') && text.includes('conta') && text.includes('shopify');
      });
      
      if (createBtn) {
        (createBtn as HTMLElement).click();
        return true;
      }
      return false;
    });
    
    if (!buttonClicked) {
      console.log('⚠️ Botão "Crie uma conta" não encontrado, tentando submit genérico...');
      await page.click('button[type="submit"]');
    } else {
      console.log('✅ Botão clicado!');
    }
    
    // ===== ETAPA 5: AGUARDAR CHECKOUT COM GARANTIA DE UK =====
    console.log('⏳ ETAPA 5: Aguardando redirecionamento para checkout...');
    
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }),
        randomDelay(25000, 35000)
      ]);
    } catch (e) {
      console.log('⚠️ Timeout na navegação, continuando...');
    }
    
    await randomDelay(3000, 5000);
    
    const finalUrl = page.url();
    console.log('🎉 URL final:', finalUrl);
    
    // VERIFICAÇÃO CRÍTICA: Garantir que country=GB está na URL
    if (finalUrl.includes('country=GB')) {
      console.log('✅ ✅ ✅ SUCESSO GARANTIDO! Country=GB confirmado na URL!');
      console.log('🇬🇧 BANDEIRA CORRETAMENTE ALTERADA PARA UNITED KINGDOM!');
      
      return {
        success: true,
        storeUrl: finalUrl,
        message: 'Conta criada com sucesso! BANDEIRA GARANTIDAMENTE EM UNITED KINGDOM (GB)!'
      };
    } else if (finalUrl.includes('country=BR')) {
      console.error('❌ ERRO CRÍTICO: Bandeira voltou para Brasil (BR)!');
      throw new Error('Falha crítica: bandeira em Brasil, não UK!');
    } else if (finalUrl.includes('checkout') || finalUrl.includes('extend-trial') || finalUrl.includes('admin.shopify.com')) {
      console.log('✅ Em página de checkout/admin');
      
      return {
        success: true,
        storeUrl: finalUrl,
        message: 'Processo em andamento - verificar URL'
      };
    } else {
      return {
        success: false,
        storeUrl: finalUrl,
        message: 'URL inesperada, processo pode estar incompleto'
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
