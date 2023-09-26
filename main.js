const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const tesseract = require('node-tesseract-ocr');

const app = express();
const PORT = 8080;

const SBR_WS_ENDPOINT = 'wss://brd-customer-hl_70f130d9-zone-scraping_browser:bchwu157c1di@brd.superproxy.io:9222';

app.get('/search-product', async (req, res) => {
    const query = req.query.product;

    if (!query) {
        return res.status(400).json({ error: 'Product parameter is missing.' });
    }

    try {
        const searchUrl = `https://www.amazon.com/s?k=${query}&crid=ENR7IKM1S0BG&sprefix=${query}%2Caps%2C158&ref=nb_sb_noss_1`;

        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        await page.goto(searchUrl, { timeout: 60000 });

        const screenshotPath = path.join(__dirname, 'screenshot.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });

        const tesseractConfig = {
            lang: "eng",
            oem: 1,
            psm: 3,
        };

        const extractedText = await tesseract.recognize(screenshotPath, tesseractConfig);

        res.json({ extractedText: extractedText });

    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (browser && browser.isConnected()) {
            await browser.close();
        }
    }
});

app.get('/scrape', async (req, res) => {
    const targetURL = req.query.url;

    if (!targetURL) {
        return res.status(400).json({ error: 'URL parameter is missing.' });
    }

    try {
        const browser = await puppeteer.connect({
            browserWSEndpoint: SBR_WS_ENDPOINT,
        });

        const page = await browser.newPage();
        await page.goto(targetURL);
        const html = await page.content();

        await browser.close();

        res.json({ content: html });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/.well-known/ai-plugin.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'ai-plugin.json'));
});

app.get('/.well-known/openapi.yaml', (req, res) => {
    res.sendFile(path.join(__dirname, 'openapi.yaml'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
