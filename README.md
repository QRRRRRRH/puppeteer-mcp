# Puppeteer MCP

A Multi-Commander Protocol for automating browser tasks with Puppeteer. This tool allows you to:

- Automatically launch browsers (Chrome/Firefox)
- Scrape web content from any URL
- Execute custom JavaScript in the browser context
- Take screenshots of webpages or specific elements

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/puppeteer-mcp.git
cd puppeteer-mcp

# Install dependencies
npm install
```

## Usage

### Launch a browser

```bash
# Launch Chrome in non-headless mode (visible)
node src/index.js launch

# Launch Chrome in headless mode
node src/index.js launch --headless

# Launch Firefox
node src/index.js launch --browser firefox

# Launch Chrome with a specific profile
node src/index.js launch --profile myprofile
```

### Scrape web content

```bash
# Scrape an entire webpage
node src/index.js scrape https://example.com

# Scrape specific elements using a CSS selector
node src/index.js scrape https://example.com --selector "article.content"

# Save scraped content to a file
node src/index.js scrape https://example.com --output results.json
```

### Take screenshots

```bash
# Take a screenshot of a webpage (viewport only)
node src/index.js screenshot https://example.com

# Take a screenshot of the full page (including scrollable content)
node src/index.js screenshot https://example.com --fullPage

# Take a screenshot of a specific element
node src/index.js screenshot https://example.com --selector "#header"

# Save screenshot to a specified file
node src/index.js screenshot https://example.com --output my-screenshot.png
```

### Execute JavaScript in the browser

```bash
# Execute inline JavaScript
node src/index.js execute "return document.title;" --url https://example.com

# Execute JavaScript from a file
node src/index.js execute ./scripts/extract-data.js --url https://example.com
```

### Close browser

```bash
# Close any open browser instances
node src/index.js close
```

## Examples

### Example 1: Scrape product information from a website

```bash
node src/index.js scrape https://example.com/products --selector ".product-card" --output products.json
```

### Example 2: Take a screenshot of a webpage

```bash
# Take a full page screenshot and save it to a specific file
node src/index.js screenshot https://example.com --fullPage --output example-full.png

# Take a screenshot of just the hero section
node src/index.js screenshot https://example.com --selector "section.hero" --output hero.png
```

### Example 3: Execute a custom data extraction script

Create a script file `scripts/extract-data.js` (already included in this repo):

```javascript
// Extract all links from the page
const links = Array.from(document.querySelectorAll('a')).map(a => ({
  text: a.innerText.trim(),
  href: a.href,
  title: a.title
}));

// Return the extracted data
return {
  title: document.title,
  links: links.slice(0, 10) // Return only the first 10 links
};
```

Then run:

```bash
node src/index.js execute ./scripts/extract-data.js --url https://example.com
```

## Features

- Automatically finds installed browsers or downloads them if not found
- Maintains browser state between commands
- Supports both headless and non-headless modes
- Works with both Chrome and Firefox
- Can scrape specific elements or entire pages
- Takes screenshots of full pages or specific elements
- Allows execution of custom JavaScript code

## License

MIT 