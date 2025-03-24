import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { launchBrowser } from './commands/launch.js';
import { scrapeWebpage } from './commands/scrape.js';
import { executeCommand } from './commands/execute.js';
import { takeScreenshot } from './commands/screenshot.js';
import { closeBrowser } from './commands/close.js';

// Define CLI commands
yargs(hideBin(process.argv))
  .command('launch', 'Launch a browser instance', (yargs) => {
    return yargs
      .option('headless', {
        describe: 'Run browser in headless mode',
        type: 'boolean',
        default: false
      })
      .option('browser', {
        describe: 'Browser type to launch',
        type: 'string',
        choices: ['chrome', 'firefox'],
        default: 'chrome'
      })
      .option('profile', {
        describe: 'Use a specific browser profile',
        type: 'string'
      });
  }, async (argv) => {
    await launchBrowser(argv);
  })
  .command('scrape <url>', 'Scrape content from a webpage', (yargs) => {
    return yargs
      .positional('url', {
        describe: 'URL to scrape',
        type: 'string'
      })
      .option('selector', {
        describe: 'CSS selector to target specific elements',
        type: 'string'
      })
      .option('output', {
        describe: 'File to save the scraped content',
        type: 'string'
      });
  }, async (argv) => {
    await scrapeWebpage(argv);
  })
  .command('execute <script>', 'Execute a JavaScript script in the browser context', (yargs) => {
    return yargs
      .positional('script', {
        describe: 'JavaScript script or path to script file',
        type: 'string'
      })
      .option('url', {
        describe: 'URL to navigate to before executing script',
        type: 'string'
      });
  }, async (argv) => {
    await executeCommand(argv);
  })
  .command('screenshot <url>', 'Take a screenshot of a webpage', (yargs) => {
    return yargs
      .positional('url', {
        describe: 'URL to take a screenshot of',
        type: 'string'
      })
      .option('output', {
        describe: 'File to save the screenshot',
        type: 'string'
      })
      .option('fullPage', {
        describe: 'Capture the full scrollable page',
        type: 'boolean',
        default: false
      })
      .option('selector', {
        describe: 'CSS selector of a specific element to screenshot',
        type: 'string'
      });
  }, async (argv) => {
    await takeScreenshot(argv);
  })
  .command('close', 'Close any open browser instances', () => {}, async () => {
    await closeBrowser();
  })
  .demandCommand(1, 'You need to specify a command')
  .help()
  .argv; 