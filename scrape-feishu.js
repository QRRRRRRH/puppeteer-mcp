import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import TurndownService from 'turndown';

const url = 'https://y03l2iufsbl.feishu.cn/docx/XfL4di0YNosjoGxjfMtcGKKPnkg';
const outputFile = 'feishu-document.md';
const screenshotsDir = 'screenshots';

// Helper function for timeout
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeFeishuDocument() {
  let browser;
  
  try {
    // Create screenshots directory if it doesn't exist
    await fs.mkdir(screenshotsDir, { recursive: true });
    
    // Launch a browser directly with puppeteer
    console.log('Launching browser...');
    browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--window-size=1280,1600', '--disable-web-security'],
      defaultViewport: null
    });
    
    console.log(`Accessing Feishu document: ${url}`);
    const page = await browser.newPage();
    
    // Set viewport for better rendering
    await page.setViewport({ width: 1280, height: 1600 });
    
    // Set headers for Chinese content
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    });
    
    // Navigate to the URL with a longer timeout for Feishu to load
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    
    console.log('Page loaded, waiting for content to render...');
    
    // Wait a bit longer for dynamic content to load fully
    await sleep(8000);
    
    // Try to click on any "read more" or expand buttons
    try {
      await page.evaluate(() => {
        // Find and click on any expand buttons
        const expandButtons = Array.from(document.querySelectorAll('button, [role="button"]')).filter(el => {
          const text = el.textContent.toLowerCase();
          return text.includes('expand') || text.includes('read more') || text.includes('展开') || text.includes('更多');
        });
        
        expandButtons.forEach(button => button.click());
      });
      
      // Give time for expanded content to load
      await sleep(2000);
    } catch (error) {
      console.log('No expand buttons found or could not click them');
    }
    
    // Try to handle login prompt or other overlays
    try {
      await page.evaluate(() => {
        // Try to remove any login prompts or overlays
        const overlays = document.querySelectorAll('.overlay, .login-prompt, .modal');
        overlays.forEach(overlay => {
          if (overlay) overlay.remove();
        });
      });
    } catch (error) {
      console.log('Could not handle overlays');
    }
    
    let markdownContent = '';
    let screenshotsTaken = false;
    
    try {
      // Try to get the document title and content
      const content = await page.evaluate(() => {
        // Get document title - try different selectors for Feishu
        const titleSelectors = ['.docx-title-editor', '.title-editor', 'h1.lark-doc-title', '.doc-title'];
        let title = 'Feishu Document';
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent.trim()) {
            title = element.textContent.trim();
            break;
          }
        }
        
        // Get document content - try different selectors for Feishu
        const contentSelectors = [
          '.ne-doc-major-content', 
          '.lark-doc-content',
          '.feishu-doc-content',
          'main .content',
          '.workspace'
        ];
        
        let content = '';
        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element && element.innerHTML) {
            content = element.innerHTML;
            break;
          }
        }
        
        return { title, content };
      });
      
      if (content.content && content.content.length > 100) {
        console.log('Successfully extracted content');
        
        // Use turndown to convert HTML to Markdown
        const turndownService = new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced'
        });
        
        // Convert HTML to Markdown
        markdownContent = turndownService.turndown(content.content);
        
        // Add the title at the top
        markdownContent = `# ${content.title}\n\n${markdownContent}`;
        
        // Save the markdown to file
        await fs.writeFile(outputFile, markdownContent, { encoding: 'utf-8' });
        console.log(`Document has been successfully saved to ${outputFile}`);
      } else {
        throw new Error('Could not extract document content');
      }
    } catch (error) {
      console.log('Failed to extract content, taking screenshots instead...');
      
      // Take full-page screenshot
      await takeFullPageScreenshots(page);
      screenshotsTaken = true;
    }
    
    // If we couldn't extract content properly, take screenshots as fallback
    if (!markdownContent && !screenshotsTaken) {
      console.log('Taking screenshots as fallback...');
      await takeFullPageScreenshots(page);
    }
    
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    // Close the browser
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
}

// Function to take full page screenshots by scrolling
async function takeFullPageScreenshots(page) {
  try {
    console.log('Taking full page screenshot...');
    
    // First try to take a full page screenshot
    const fullPageScreenshotPath = path.join(screenshotsDir, 'full-page-screenshot.png');
    await page.screenshot({ 
      path: fullPageScreenshotPath, 
      fullPage: true 
    });
    console.log(`Saved full page screenshot: ${fullPageScreenshotPath}`);
    
    // Now take individual screenshots by scrolling down
    // Get the total height of the page
    const totalHeight = await page.evaluate(() => {
      return document.body.scrollHeight;
    });
    
    const viewportHeight = page.viewport().height;
    let screenshotCount = 0;
    
    console.log(`Document height: ${totalHeight}px, viewport height: ${viewportHeight}px`);
    console.log('Taking individual screenshots by scrolling...');
    
    // Scroll through the page and take screenshots
    for (let scrollPosition = 0; scrollPosition < totalHeight; scrollPosition += Math.floor(viewportHeight * 0.8)) {
      await page.evaluate((scrollPos) => {
        window.scrollTo(0, scrollPos);
      }, scrollPosition);
      
      // Wait for any lazy-loaded content to appear
      await sleep(1000);
      
      // Take screenshot
      const screenshotPath = path.join(screenshotsDir, `screenshot-${screenshotCount}.png`);
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: false // Just capture the viewport
      });
      
      console.log(`Saved screenshot: ${screenshotPath}`);
      screenshotCount++;
    }
    
    console.log(`Took ${screenshotCount} screenshots of the document`);
  } catch (error) {
    console.error('Error taking screenshots:', error);
    
    // As a last resort, try one simple full page screenshot
    try {
      const fallbackScreenshotPath = path.join(screenshotsDir, 'fallback-screenshot.png');
      await page.screenshot({ 
        path: fallbackScreenshotPath,
        fullPage: true
      });
      console.log(`Saved fallback screenshot: ${fallbackScreenshotPath}`);
    } catch (lastError) {
      console.error('Failed to take even a fallback screenshot:', lastError);
    }
  }
}

scrapeFeishuDocument(); 