const puppeteer = require('puppeteer');

async function test() {
    console.log('Starting dummy scrape...');
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto('https://www.google.com/maps/search/book+store+near+bhubaneswar/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));
    const results = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('div[role="article"]')).slice(0, 5);
        return els.map(el => {
            return {
                aria: el.getAttribute('aria-label') || 'NO LABEL',
                text: el.innerText.replace(/\n/g, ' | ')
            };
        });
    });
    console.log(JSON.stringify(results, null, 2));
    await browser.close();
}

test().catch(console.error);
