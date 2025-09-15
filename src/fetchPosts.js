const ora = require("ora");
const symbols = require("log-symbols");
const { success, error, warning, info } = require("./ui");

// Enhanced spinner with better error handling
async function fetchWithSpin(taskName, fn, options = {}) {
  const spinner = ora({ 
    text: taskName, 
    spinner: options.spinner || "dots",
    color: options.color || "cyan"
  }).start();
  
  try {
    const res = await fn();
    spinner.succeed(`${taskName} ${symbols.success}`);
    return res;
  } catch (e) {
    spinner.fail(`${taskName} ${symbols.error}`);
    throw e;
  }
}

// Fetch posts with enhanced error handling
async function fetchPosts() {
  const Parser = require('rss-parser');
  const parser = new Parser();
  
  try {
    // Fetch without spinner to keep the interface clean
    const feed = await parser.parseURL('https://lucandjeremi.substack.com/feed');
    return feed.items;
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Network error: Could not connect to lucandjeremi.substack.com. Please check your internet connection and try again.');
    } else if (error.message.includes('timeout')) {
      throw new Error('Request timeout: The server took too long to respond. Please try again in a moment.');
    } else {
      throw new Error(`Error fetching posts: ${error.message}`);
    }
  }
}

// Fetch individual post content with enhanced error handling
async function fetchPostContent(url) {
  const axios = require('axios');
  
  try {
    // Fetch without spinner to keep the interface clean
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Network error: Could not connect to the post URL. Please check your internet connection and try again.');
    } else if (error.message.includes('timeout')) {
      throw new Error('Request timeout: The server took too long to respond. Please try again in a moment.');
    } else {
      throw new Error(`Error fetching post content: ${error.message}`);
    }
  }
}

// Clean HTML content with enhanced parsing
function cleanHtmlContent(html) {
  let content = '';
  
  // Try to find the main article content
  const articleMatch = html.match(/<article[^>]*>(.*?)<\/article>/s);
  if (articleMatch) {
    content = articleMatch[1];
  } else {
    // Fallback: look for content in common containers
    const contentMatch = html.match(/<div[^>]*class="[^"]*post-content[^"]*"[^>]*>(.*?)<\/div>/s) ||
                       html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/s) ||
                       html.match(/<main[^>]*>(.*?)<\/main>/s);
    if (contentMatch) {
      content = contentMatch[1];
    } else {
      // Last resort: use the whole body
      const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/s);
      content = bodyMatch ? bodyMatch[1] : html;
    }
  }
  
  // Clean up the HTML content
  const cleanContent = content
    // Remove scripts and styles
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    // Remove navigation and footer elements
    .replace(/<nav[^>]*>.*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>.*?<\/footer>/gi, '')
    .replace(/<header[^>]*>.*?<\/header>/gi, '')
    // Remove images and media
    .replace(/<img[^>]*>/gi, '')
    .replace(/<figure[^>]*>.*?<\/figure>/gi, '')
    .replace(/<picture[^>]*>.*?<\/picture>/gi, '')
    // Remove common Substack elements
    .replace(/<div[^>]*class="[^"]*subscribe[^"]*"[^>]*>.*?<\/div>/gi, '')
    .replace(/<div[^>]*class="[^"]*share[^"]*"[^>]*>.*?<\/div>/gi, '')
    .replace(/<div[^>]*class="[^"]*author[^"]*"[^>]*>.*?<\/div>/gi, '')
    .replace(/<div[^>]*class="[^"]*button[^"]*"[^>]*>.*?<\/div>/gi, '')
    .replace(/<button[^>]*>.*?<\/button>/gi, '')
    // Convert HTML tags to readable format
    .replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$2\n' + '='.repeat(50) + '\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    // Remove remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up whitespace and remove image URLs and button text
    .replace(/\(https:\/\/substackcdn\.com[^)]*\)/g, '')
    .replace(/\(https:\/\/substack-post-media[^)]*\)/g, '')
    .replace(/Share\s*\(javascript:void\(0\)\)/g, '')
    .replace(/\d+\s*\(https:\/\/[^)]*\/comments\)/g, '')
    .replace(/Previous\s*$/g, '')
    // Remove author info and metadata at the beginning
    .replace(/\(https:\/\/substack\.com\/@[^)]*\)/g, '')
    .replace(/Jeremi Nuer\s+and\s+Luca Caviness\s+Sep\s+\d+,\s+\d+/g, '')
    .replace(/^\s*\(https:\/\/substack\.com\/@[^)]*\)/g, '')
    // Remove stray numbers and characters at the beginning of lines
    .replace(/^\s*\d+\s*/gm, '')
    .replace(/\s+\d+Welcome/g, 'Welcome')
    // Convert HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim()
    // Remove multiple consecutive blank lines
    .replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return cleanContent;
}

module.exports = {
  fetchWithSpin,
  fetchPosts,
  fetchPostContent,
  cleanHtmlContent
};
