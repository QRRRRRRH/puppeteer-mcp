import fs from 'fs/promises';
import path from 'path';
import { getBrowser } from './launch.js';

/**
 * Scrape content from a webpage
 */
export async function scrapeWebpage({ url, selector, output }) {
  if (!url) {
    throw new Error('URL is required for scraping');
  }

  console.log(`Scraping content from: ${url}`);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('Page loaded successfully');

    // Extract content based on selector or default to entire page
    let content;
    if (selector) {
      // Wait for the selector to be available
      await page.waitForSelector(selector, { timeout: 5000 });
      
      // Extract content from the selected elements
      content = await page.evaluate((sel) => {
        const elements = Array.from(document.querySelectorAll(sel));
        return elements.map(el => {
          return {
            text: el.innerText,
            html: el.innerHTML,
            href: el.tagName === 'A' ? el.href : null
          };
        });
      }, selector);
      
      console.log(`Extracted ${content.length} elements matching selector: ${selector}`);
    } else {
      // Extract entire page content
      content = await page.evaluate(() => {
        return {
          title: document.title,
          text: document.body.innerText,
          html: document.documentElement.outerHTML
        };
      });
      
      console.log('Extracted full page content');
    }

    // Save content to file if output is specified
    if (output) {
      const outputPath = path.isAbsolute(output) ? output : path.join(process.cwd(), output);
      await fs.writeFile(outputPath, JSON.stringify(content, null, 2), 'utf8');
      console.log(`Content saved to: ${outputPath}`);
    } else {
      // Display content in console
      console.log('Scraped content:');
      console.log(JSON.stringify(content, null, 2));
    }

    return content;
  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  } finally {
    await page.close();
    console.log('Page closed');
  }
} 