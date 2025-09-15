#!/usr/bin/env node
const { program } = require('commander');
const Parser = require('rss-parser');
const inquirer = require('inquirer');
const axios = require('axios');
const chalk = require('chalk');

// Function to convert markdown-style formatting to chalk styling
function formatText(text) {
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

// Default action when no command is provided
program
  .name('lucandjeremi')
  .description('A terminal CLI reader for lucandjeremi.substack.com')
  .version('1.0.0')
  .action(async () => {
    try {
      console.log(chalk.blue('Fetching posts from lucandjeremi.substack.com...'));
      
      const parser = new Parser();
      const feed = await parser.parseURL('https://lucandjeremi.substack.com/feed');
      
      // Create choices for inquirer - show all posts
      const choices = feed.items.map((item, index) => ({
        name: `${item.title} (${new Date(item.pubDate).toLocaleDateString()})`,
        value: item.link
      }));
      
      const { selectedPost } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedPost',
          message: 'Which post would you like to read?',
          choices: choices
        }
      ]);
      
      console.log(chalk.yellow('\nFetching post content...'));
      
      // Fetch the full post content
      const response = await axios.get(selectedPost);
      const html = response.data;
      
      // Better HTML parsing - extract just the article content
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
      
      console.log('\n');
      console.log(formatText(cleanContent));
      console.log('\n' + chalk.gray('='.repeat(60)));
      console.log(chalk.blue(`Full post: ${selectedPost}`));
      
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.error(chalk.red('Network error: Could not connect to lucandjeremi.substack.com'));
        console.error(chalk.gray('Please check your internet connection and try again.'));
      } else if (error.message.includes('timeout')) {
        console.error(chalk.red('Request timeout: The server took too long to respond'));
        console.error(chalk.gray('Please try again in a moment.'));
      } else {
        console.error(chalk.red('Error reading post:'), error.message);
      }
      process.exit(1);
    }
  });

program
  .command('search <term>')
  .description('Search through newsletter posts for a specific term')
  .action(async (term) => {
    try {
      console.log(chalk.blue(`Searching for "${term}" in lucandjeremi.substack.com...`));
      
      const parser = new Parser();
      const feed = await parser.parseURL('https://lucandjeremi.substack.com/feed');
      
      // Search through posts
      const matchingPosts = [];
      
      for (const item of feed.items) {
        // Search in title and content snippet
        const searchText = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
        if (searchText.includes(term.toLowerCase())) {
          matchingPosts.push(item);
        }
      }
      
      if (matchingPosts.length === 0) {
        console.log(chalk.yellow(`No posts found containing "${term}"`));
        return;
      }
      
      console.log(chalk.green(`Found ${matchingPosts.length} post(s) containing "${term}":`));
      console.log();
      
      // Display matching posts
      matchingPosts.forEach((post, index) => {
        console.log(chalk.cyan(`${index + 1}. ${post.title}`));
        console.log(chalk.gray(`   ${new Date(post.pubDate).toLocaleDateString()}`));
        console.log(chalk.gray(`   ${post.link}`));
        console.log();
      });
      
      // Ask if user wants to read one of the posts
      const { readPost } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'readPost',
          message: 'Would you like to read one of these posts?',
          default: true
        }
      ]);
      
      if (readPost) {
        const { selectedPost } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedPost',
            message: 'Which post would you like to read?',
            choices: matchingPosts.map((item, index) => ({
              name: `${item.title} (${new Date(item.pubDate).toLocaleDateString()})`,
              value: item.link
            }))
          }
        ]);
        
        console.log(chalk.yellow('\nFetching post content...'));
        
        // Fetch the full post content
        const response = await axios.get(selectedPost);
        const html = response.data;
        
        // Better HTML parsing - extract just the article content
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
        
        // Clean up the HTML content (same as in the read command)
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
          .trim();
        
        console.log('\n');
        console.log(formatText(cleanContent));
        console.log('\n' + chalk.gray('='.repeat(60)));
        console.log(chalk.blue(`Full post: ${selectedPost}`));
      }
      
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.error(chalk.red('Network error: Could not connect to lucandjeremi.substack.com'));
        console.error(chalk.gray('Please check your internet connection and try again.'));
      } else if (error.message.includes('timeout')) {
        console.error(chalk.red('Request timeout: The server took too long to respond'));
        console.error(chalk.gray('Please try again in a moment.'));
      } else {
        console.error(chalk.red('Error searching posts:'), error.message);
      }
      process.exit(1);
    }
  });

program.parse();