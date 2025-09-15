const chalk = require("chalk");
const cliTruncate = require("cli-truncate").default || require("cli-truncate");
const { dim, link, success, error, warning, info } = require("./ui");

// Check if colors are enabled
const colorEnabled = process.stdout.isTTY && !process.env.NO_COLOR;

const bullet = colorEnabled ? chalk.gray("•") : "•";
const arrow = colorEnabled ? chalk.gray("→") : "→";

// Render posts in a pretty list format
function renderPosts(posts, options = {}) {
  const maxWidth = Math.min(process.stdout.columns || 80, options.maxWidth || 80);
  
  return posts
    .map((post, index) => {
      const title = colorEnabled ? chalk.bold(post.title) : post.title;
      const date = colorEnabled ? dim(`(${new Date(post.pubDate).toLocaleDateString()})`) : `(${new Date(post.pubDate).toLocaleDateString()})`;
      const url = colorEnabled ? dim(post.link) : post.link;
      
      // Simple truncation without cliTruncate to debug
      const truncatedTitle = title.length > (maxWidth - 20) ? title.substring(0, maxWidth - 23) + '...' : title;
      
      return `${bullet} ${truncatedTitle}  ${date}\n   ${url}`;
    })
    .join("\n");
}

// Render search results with highlighting
function renderSearchResults(posts, searchTerm, options = {}) {
  const maxWidth = Math.min(process.stdout.columns || 80, options.maxWidth || 80);
  
  return posts
    .map((post, index) => {
      // Highlight search term in title
      let title = post.title;
      if (colorEnabled && searchTerm) {
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        title = title.replace(regex, chalk.yellow.bold('$1'));
      }
      
      const date = colorEnabled ? dim(`(${new Date(post.pubDate).toLocaleDateString()})`) : `(${new Date(post.pubDate).toLocaleDateString()})`;
      const url = colorEnabled ? dim(post.link) : post.link;
      
      // Simple truncation without cliTruncate to debug
      const truncatedTitle = title.length > (maxWidth - 20) ? title.substring(0, maxWidth - 23) + '...' : title;
      
      return `${bullet} ${truncatedTitle}  ${date}\n   ${url}`;
    })
    .join("\n");
}

// Create a numbered list for selection
function renderNumberedList(posts, options = {}) {
  const maxWidth = Math.min(process.stdout.columns || 80, options.maxWidth || 80);
  
  return posts
    .map((post, index) => {
      const number = colorEnabled ? chalk.cyan(`${index + 1}.`) : `${index + 1}.`;
      const title = colorEnabled ? chalk.bold(post.title) : post.title;
      const date = colorEnabled ? dim(`(${new Date(post.pubDate).toLocaleDateString()})`) : `(${new Date(post.pubDate).toLocaleDateString()})`;
      
      // Truncate title if too long
      const truncatedTitle = cliTruncate(title, maxWidth - 25);
      
      return `${number} ${truncatedTitle}  ${date}`;
    })
    .join("\n");
}

// Render post summary with metadata
function renderPostSummary(post, options = {}) {
  const maxWidth = Math.min(process.stdout.columns || 80, options.maxWidth || 80);
  
  const title = colorEnabled ? chalk.bold.cyan(post.title) : post.title;
  const date = colorEnabled ? dim(`Published: ${new Date(post.pubDate).toLocaleDateString()}`) : `Published: ${new Date(post.pubDate).toLocaleDateString()}`;
  const url = colorEnabled ? link(post.link) : post.link;
  
  // Add content snippet if available
  let snippet = '';
  if (post.contentSnippet) {
    const truncatedSnippet = cliTruncate(post.contentSnippet, maxWidth - 4);
    snippet = colorEnabled ? dim(`\n${truncatedSnippet}`) : `\n${truncatedSnippet}`;
  }
  
  return `${title}\n${date}${snippet}\n${url}`;
}

// Render statistics
function renderStats(posts, searchTerm = null) {
  const total = posts.length;
  const searchText = searchTerm ? ` for "${searchTerm}"` : '';
  
  if (total === 0) {
    return colorEnabled ? warning(`No posts found${searchText}`) : `No posts found${searchText}`;
  }
  
  const statsText = `Found ${total} post${total === 1 ? '' : 's'}${searchText}`;
  return colorEnabled ? success(statsText) : statsText;
}

// Render help text
function renderHelp() {
  const helpText = `
${colorEnabled ? chalk.bold('Available Commands:') : 'Available Commands:'}
  ${bullet} lucandjeremi                    - Browse and read posts
  ${bullet} lucandjeremi search <term>      - Search posts by keyword
  ${bullet} lucandjeremi --help             - Show this help message
  ${bullet} lucandjeremi --version          - Show version information

${colorEnabled ? chalk.bold('Tips:') : 'Tips:'}
  ${bullet} Use arrow keys to navigate post lists
  ${bullet} Press Enter to select a post
  ${bullet} Use Ctrl+C to exit at any time
  ${bullet} Add --no-color to disable colors
`;
  
  return helpText;
}

module.exports = {
  renderPosts,
  renderSearchResults,
  renderNumberedList,
  renderPostSummary,
  renderStats,
  renderHelp
};
