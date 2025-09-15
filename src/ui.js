const chalk = require("chalk");
const boxen = require("boxen").default || require("boxen");
const cliTruncate = require("cli-truncate").default || require("cli-truncate");
const wrapAnsi = require("wrap-ansi").default || require("wrap-ansi");

// Check if colors are enabled
const colorEnabled = process.stdout.isTTY && !process.env.NO_COLOR;

// Disable colors if not in TTY or NO_COLOR is set
if (!colorEnabled) {
  process.env.FORCE_COLOR = "0";
}

// Enhanced styling functions
const h1 = (s) => colorEnabled ? chalk.bold.underline(s) : s;
const h2 = (s) => colorEnabled ? chalk.cyanBright.bold(s) : s;
const h3 = (s) => colorEnabled ? chalk.blue.bold(s) : s;
const dim = (s) => colorEnabled ? chalk.dim(s) : s;
const link = (s) => colorEnabled ? chalk.blue.underline(s) : s;
const success = (s) => colorEnabled ? chalk.green(s) : s;
const error = (s) => colorEnabled ? chalk.red(s) : s;
const warning = (s) => colorEnabled ? chalk.yellow(s) : s;
const info = (s) => colorEnabled ? chalk.blue(s) : s;

// Create a panel with title and body
function panel(title, body, opts = {}) {
  const width = Math.min(process.stdout.columns || 80, opts.width || 80);
  // Simple text wrapping without wrapAnsi to debug
  const wrapped = body;
  const heading = colorEnabled ? chalk.bold(title) : title;
  
  return boxen(`${heading}\n${wrapped}`, {
    padding: 1,
    borderStyle: "round",
    borderColor: colorEnabled ? "gray" : "white",
    width
  });
}

// Create a separator line
function separator(char = "─", color = "gray") {
  const width = Math.min(process.stdout.columns || 80, 80);
  const line = char.repeat(width);
  return colorEnabled ? chalk[color](line) : line;
}

// Create a centered title
function centerTitle(text, char = "=") {
  const width = Math.min(process.stdout.columns || 80, 80);
  const padding = Math.max(0, Math.floor((width - text.length - 2) / 2));
  const line = char.repeat(padding) + ` ${text} ` + char.repeat(padding);
  return colorEnabled ? chalk.bold(line) : line;
}

// Format text with enhanced styling
function formatText(text) {
  if (!colorEnabled) return text;
  
  const lines = text.split('\n');
  let titleFound = false;
  let subtitleFound = false;
  
  return lines.map((line, index) => {
    // Skip blank lines that come right after the title
    if (titleFound && !subtitleFound && !line.trim()) {
      return '';
    }
    
    // Convert **bold** to chalk.bold
    line = line.replace(/\*\*(.*?)\*\*/g, (match, content) => chalk.bold(content));
    
    // Convert *italic* to chalk.italic
    line = line.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (match, content) => chalk.italic(content));
    
    // Make author sections green and bold (Jeremi: or Luca: followed by content)
    if (line.match(/^(Jeremi:|Luca:)/)) {
      return chalk.green.bold(line);
    }
    
    // Make the main newsletter title bold, cyan, and all caps (first non-empty line)
    if (!titleFound && line.trim()) {
      titleFound = true;
      return chalk.cyan.bold(line.toUpperCase());
    }
    
    // Make the first line after the title italic (only once) - directly after title with no gap
    if (titleFound && !subtitleFound && line.trim() && !line.includes('=')) {
      subtitleFound = true;
      return chalk.italic(line);
    }
    
    // Remove the horizontal line that comes right after the title
    if (titleFound && !subtitleFound && line.includes('=') && line.length > 20) {
      return '';
    }
    
    // Add a space after the horizontal line before the "Welcome" message
    if (line.includes('Welcome back to Jeremi and Luca') && subtitleFound) {
      return '\n' + line;
    }
    
    // Remove author metadata lines (Jeremi Nuer and Luca Caviness + date)
    if (line.match(/Jeremi Nuer\s+and\s+Luca Caviness\s+\w+\s+\d+,\s+\d+/)) {
      return '';
    }
    
    // Remove ALL blank lines between title and subtitle
    if (titleFound && !subtitleFound && !line.trim()) {
      return '';
    }
    
    return line;
  }).join('\n');
}

module.exports = {
  h1,
  h2,
  h3,
  dim,
  link,
  success,
  error,
  warning,
  info,
  panel,
  separator,
  centerTitle,
  formatText
};
