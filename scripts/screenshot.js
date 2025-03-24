// Wait for the page to be fully loaded
await new Promise(r => setTimeout(r, 1000));

// Take a screenshot of the entire page
const screenshot = await new Promise(resolve => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  // Set canvas dimensions to match the viewport
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Create a screenshot using html2canvas approach
  const htmlToImage = () => {
    ctx.drawWindow(
      window,
      window.scrollX,
      window.scrollY,
      window.innerWidth,
      window.innerHeight,
      'rgb(255,255,255)'
    );
    resolve(canvas.toDataURL('image/png'));
  };
  
  // Try to use the experimental drawWindow API if available (Firefox)
  if (ctx.drawWindow) {
    htmlToImage();
  } else {
    // Fallback for Chrome - return information about what would be captured
    resolve({
      message: "Screenshot functionality requires additional browser permissions or extensions.",
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      url: window.location.href,
      title: document.title
    });
  }
});

return screenshot; 