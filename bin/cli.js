#!/usr/bin/env node
const { program } = require('commander');
const inquirer = require('inquirer');

// Import our enhanced styling components
const { printBanner } = require('../src/banner');
const { h1, h2, h3, dim, link, success, error, warning, info, panel, separator, centerTitle, formatText } = require('../src/ui');
const { fetchWithSpin, fetchPosts, fetchPostContent, cleanHtmlContent } = require('../src/fetchPosts');
const { renderPosts, renderSearchResults, renderNumberedList, renderPostSummary, renderStats, renderHelp } = require('../src/list');

// Enhanced error handling
function handleError(err, context = 'operation') {
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    console.error(error(`Network error: Could not connect to lucandjeremi.substack.com`));
    console.error(dim('Please check your internet connection and try again.'));
  } else if (err.message.includes('timeout')) {
    console.error(error('Request timeout: The server took too long to respond'));
    console.error(dim('Please try again in a moment.'));
  } else {
    console.error(error(`Error during ${context}:`), err.message);
  }
  process.exit(1);
}

// Default action when no command is provided
program
  .name('lucandjeremi')
  .description('A terminal CLI reader for lucandjeremi.substack.com')
  .version('2.0.0')
  .option('--no-color', 'disable colors')
  .action(async (options) => {
    try {
      // Set NO_COLOR if requested
      if (options.noColor) {
        process.env.NO_COLOR = '1';
      }
      
      // Show the awesome banner
      await printBanner("JN / LC");
      
      // Fetch posts with enhanced spinner
      const posts = await fetchPosts();
      
      // Create choices for inquirer - show all posts
      const choices = posts.map((item, index) => ({
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
      
      // Fetch the full post content with enhanced spinner
      const html = await fetchPostContent(selectedPost);
      
      // Clean and format the content
      const cleanContent = cleanHtmlContent(html);
      
      console.log('\n');
      console.log(formatText(cleanContent));
      console.log('\n' + separator('='));
      console.log(link(`Full post: ${selectedPost}`));
      
      
    } catch (err) {
      handleError(err, 'reading posts');
    }
  });

program
  .command('search <term>')
  .description('Search through newsletter posts for a specific term')
  .option('--no-color', 'disable colors')
  .action(async (term, options) => {
    try {
      // Set NO_COLOR if requested
      if (options.noColor) {
        process.env.NO_COLOR = '1';
      }
      
      // Show the awesome banner
      await printBanner("JN / LC");
      
      // Fetch posts with enhanced spinner
      const posts = await fetchPosts();
      
      // Search through posts
      const matchingPosts = [];
      
      for (const item of posts) {
        // Search in title and content snippet
        const searchText = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
        if (searchText.includes(term.toLowerCase())) {
          matchingPosts.push(item);
        }
      }
      
      if (matchingPosts.length === 0) {
        console.log(warning(`No posts found containing "${term}"`));
        console.log('\n' + panel("Try again", "Try a different search term or browse all posts with `lucandjeremi`"));
        return;
      }
      
      console.log(success(renderStats(matchingPosts, term)));
      console.log();
      
      // Display matching posts with enhanced styling
      console.log(h2("Search Results"));
      console.log(renderSearchResults(matchingPosts, term));
      
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
        
        // Fetch the full post content with enhanced spinner
        const html = await fetchPostContent(selectedPost);
        
        // Clean and format the content
        const cleanContent = cleanHtmlContent(html);
        
        console.log('\n');
        console.log(formatText(cleanContent));
        console.log('\n' + separator('='));
        console.log(link(`Full post: ${selectedPost}`));
      }
      
    } catch (err) {
      handleError(err, 'searching posts');
    }
  });

// Add help command
program
  .command('help')
  .description('Show help information')
  .action(() => {
    console.log(renderHelp());
  });

program.parse();