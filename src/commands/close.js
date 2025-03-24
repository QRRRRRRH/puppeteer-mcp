import fs from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';

const STATE_FILE = path.join(process.cwd(), '.browser-state.json');

/**
 * Close any open browser instances
 */
export async function closeBrowser() {
  try {
    // Check if there's a saved browser state
    let state;
    try {
      const data = await fs.readFile(STATE_FILE, 'utf8');
      state = JSON.parse(data);
    } catch (error) {
      console.log('No browser state file found or it is invalid.');
      return { success: false, message: 'No active browser found' };
    }

    if (state && state.wsEndpoint) {
      try {
        console.log(`Connecting to browser at ${state.wsEndpoint}...`);
        const browser = await puppeteer.connect({
          browserWSEndpoint: state.wsEndpoint,
          defaultViewport: null
        });
        
        // Close the browser
        console.log('Closing browser...');
        await browser.close();
        console.log('Browser closed successfully');
        
        // Clear the browser state
        await fs.writeFile(STATE_FILE, JSON.stringify({ wsEndpoint: null }, null, 2));
        
        return { success: true, message: 'Browser closed successfully' };
      } catch (error) {
        console.error('Failed to connect to browser:', error.message);
        
        // If we can't connect, clear the state file anyway
        await fs.writeFile(STATE_FILE, JSON.stringify({ wsEndpoint: null }, null, 2));
        
        return { 
          success: false, 
          message: 'Browser connection failed, possibly already closed. State cleared.' 
        };
      }
    } else {
      console.log('No active browser found in state file.');
      return { success: false, message: 'No active browser found' };
    }
  } catch (error) {
    console.error('Error closing browser:', error);
    return { success: false, message: error.message };
  }
} 