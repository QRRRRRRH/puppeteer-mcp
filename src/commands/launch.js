import fs from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';
import * as browsers from '@puppeteer/browsers';

// Global browser instance
let browserInstance = null;
let browserWSEndpoint = null;

// Store the browser state
const STATE_FILE = path.join(process.cwd(), '.browser-state.json');

/**
 * Launch a browser instance with the specified options
 */
export async function launchBrowser({ headless, browser: browserType, profile }) {
  try {
    console.log(`Launching ${browserType} browser...`);
    
    // Launch options
    const launchOptions = {
      headless: headless ? 'new' : false,
    };
    
    // Use profile if specified
    if (profile) {
      try {
        // Just create a userDataDir at a specific location
        const userDataDir = path.join(process.cwd(), 'browser-profiles', profile);
        // Ensure directory exists
        await fs.mkdir(path.dirname(userDataDir), { recursive: true });
        
        launchOptions.userDataDir = userDataDir;
        console.log(`Using profile: ${profile} at ${userDataDir}`);
      } catch (error) {
        console.error(`Failed to create or use profile ${profile}:`, error);
      }
    }
    
    // Launch browser directly with Puppeteer's default finder
    console.log('Launching browser with Puppeteer...');
    browserInstance = await puppeteer.launch(launchOptions);
    browserWSEndpoint = browserInstance.wsEndpoint();
    
    // Save browser state
    await saveBrowserState();
    
    console.log(`Browser launched! WebSocket endpoint: ${browserWSEndpoint}`);
    console.log('You can now use the "scrape" or "execute" commands to interact with the browser.');
    
    // Handle browser closing
    browserInstance.on('disconnected', async () => {
      console.log('Browser was disconnected.');
      browserInstance = null;
      browserWSEndpoint = null;
      await saveBrowserState();
    });
    
    return browserInstance;
  } catch (error) {
    console.error('Failed to launch browser:', error);
    throw error;
  }
}

/**
 * Get a browser instance, connecting to existing one or launching new
 */
export async function getBrowser() {
  if (browserInstance) {
    return browserInstance;
  }
  
  try {
    // Try to reconnect to existing browser
    const state = await loadBrowserState();
    if (state && state.wsEndpoint) {
      console.log(`Reconnecting to existing browser at ${state.wsEndpoint}...`);
      browserInstance = await puppeteer.connect({
        browserWSEndpoint: state.wsEndpoint,
        defaultViewport: null
      });
      browserWSEndpoint = state.wsEndpoint;
      return browserInstance;
    }
  } catch (error) {
    console.log('No existing browser found or connection failed.');
  }
  
  // If we got here, need to launch a new browser
  return launchBrowser({ headless: false, browser: 'chrome' });
}

/**
 * Save browser state to file
 */
async function saveBrowserState() {
  try {
    const state = {
      wsEndpoint: browserWSEndpoint
    };
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Failed to save browser state:', error);
  }
}

/**
 * Load browser state from file
 */
async function loadBrowserState() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
} 