const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer-core');

const app = express();
const PORT = 8080;

const SBR_WS_ENDPOINT = 'wss://brd-customer-hl_70f130d9-zone-scraping_browser:bchwu157c1di@brd.superproxy.io:9222';

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

// Serving ai-plugin.json
app.get('/.well-known/ai-plugin.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'ai-plugin.json'));
});

// Serving openapi.yaml
app.get('/.well-known/openapi.yaml', (req, res) => {
  res.sendFile(path.join(__dirname, 'openapi.yaml'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
