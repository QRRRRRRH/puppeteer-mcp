import fs from 'fs/promises';
import path from 'path';
import { getBrowser } from './launch.js';

/**
 * Take a screenshot of a webpage
 */
export async function takeScreenshot({ url, output, fullPage = false, selector }) {
  if (!url) {
    throw new Error('URL is required for taking a screenshot');
  }

  console.log(`Taking screenshot of: ${url}`);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('Page loaded successfully');

    // Wait for a moment to ensure all content is rendered
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Determine the output file path
    const defaultFilename = `screenshot-${Date.now()}.png`;
    const outputPath = output 
      ? (path.isAbsolute(output) ? output : path.join(process.cwd(), output))
      : path.join(process.cwd(), defaultFilename);

    // Take screenshot based on options
    if (selector) {
      // Wait for the selector to be available
      await page.waitForSelector(selector, { timeout: 5000 });
      
      // Take screenshot of specific element
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element not found with selector: ${selector}`);
      }
      
      await element.screenshot({
        path: outputPath,
        type: 'png'
      });
      
      console.log(`Took screenshot of element with selector: ${selector}`);
    } else {
      // Take screenshot of entire page or viewport
      await page.screenshot({
        path: outputPath,
        fullPage: fullPage,
        type: 'png'
      });
      
      console.log(`Took screenshot of ${fullPage ? 'full page' : 'viewport'}`);
    }

    console.log(`Screenshot saved to: ${outputPath}`);
    return { success: true, path: outputPath };
  } catch (error) {
    console.error('Error taking screenshot:', error);
    throw error;
  } finally {
    await page.close();
    console.log('Page closed');
  }
} 