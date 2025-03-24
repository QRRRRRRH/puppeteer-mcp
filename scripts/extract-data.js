// Extract all links from the page
const links = Array.from(document.querySelectorAll('a')).map(a => ({
  text: a.innerText.trim(),
  href: a.href,
  title: a.title
}));

// Extract all images
const images = Array.from(document.querySelectorAll('img')).map(img => ({
  src: img.src,
  alt: img.alt,
  width: img.width,
  height: img.height
}));

// Extract headings
const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
  level: parseInt(h.tagName.substring(1)),
  text: h.innerText.trim()
}));

// Return the extracted data
return {
  title: document.title,
  url: window.location.href,
  timestamp: new Date().toISOString(),
  links: links.slice(0, 20), // Return only the first 20 links
  images: images.slice(0, 10), // Return only the first 10 images
  headings: headings
}; 