import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import TurndownService from 'turndown';

const url = 'https://www.ruanyifeng.com/blog/2025/03/weekly-issue-341.html';
const outputFile = 'weekly-issue-341.md';

async function scrapeBlogToMarkdown() {
  let browser;
  
  try {
    // Launch a browser directly with puppeteer
    console.log('Launching browser...');
    browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox']
    });
    
    console.log(`Scraping content from: ${url}`);
    const page = await browser.newPage();
    
    // Set encoding to UTF-8 to handle Chinese characters correctly
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-CN,zh;q=0.9'
    });
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('Page loaded successfully');
    
    // Extract the blog content directly from the page
    const content = await page.evaluate(() => {
      // Get the blog title
      const titleElement = document.querySelector('.entry-header .entry-title');
      const title = titleElement ? titleElement.textContent.trim() : '';
      
      // Get the main content
      const contentElement = document.querySelector('.entry-content');
      const content = contentElement ? contentElement.innerHTML : '';
      
      return { title, content };
    });
    
    if (!content.content) {
      throw new Error('Failed to extract content from the blog');
    }
    
    // Use turndown to convert HTML to Markdown
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    
    // Convert HTML to Markdown
    let markdown = turndownService.turndown(content.content);
    
    // Add the title at the top
    markdown = `# ${content.title}\n\n${markdown}`;
    
    // Save the markdown to file
    await fs.writeFile(outputFile, markdown, { encoding: 'utf-8' });
    
    console.log(`Blog post has been successfully saved to ${outputFile}`);
    
  } catch (error) {
    console.error('Error scraping blog:', error);
  } finally {
    // Close the browser
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
}

scrapeBlogToMarkdown(); 