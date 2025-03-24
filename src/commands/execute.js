import fs from 'fs/promises';
import path from 'path';
import { getBrowser } from './launch.js';

/**
 * Execute a JavaScript script in the browser context
 */
export async function executeCommand({ script, url }) {
  if (!script) {
    throw new Error('Script is required for execution');
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to the URL if provided
    if (url) {
      console.log(`Navigating to: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2' });
      console.log('Page loaded successfully');
    }

    // Determine if script is a file path or inline script
    let scriptContent = script;
    if (script.endsWith('.js') || script.includes('/') || script.includes('\\')) {
      try {
        const scriptPath = path.isAbsolute(script) ? script : path.join(process.cwd(), script);
        scriptContent = await fs.readFile(scriptPath, 'utf8');
        console.log(`Loaded script from file: ${scriptPath}`);
      } catch (error) {
        console.error(`Failed to load script file: ${script}`, error);
        scriptContent = script; // Fallback to treating as inline script
      }
    }

    console.log('Executing script in browser context...');
    
    // Execute the script in browser context and get the result
    const result = await page.evaluate(async (scriptToExecute) => {
      // Use Function constructor to execute the script and capture its return value
      try {
        // Create a function that returns the result of the script execution
        const scriptFunction = new Function(`return (async () => { ${scriptToExecute} })();`);
        return await scriptFunction();
      } catch (error) {
        return { error: error.toString() };
      }
    }, scriptContent);

    console.log('Script execution result:');
    console.log(JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('Error during script execution:', error);
    throw error;
  } finally {
    await page.close();
    console.log('Page closed');
  }
} 