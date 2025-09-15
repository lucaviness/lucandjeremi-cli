## lucandjeremi-cli

Read lucandjeremi.substack.com in your terminal with style! ✨

A beautiful, feature-rich CLI reader for the Luc & Jeremi newsletter with ASCII art banners, enhanced styling, and smooth user experience.

## Features

- 🎨 **Beautiful ASCII Banner** - Eye-catching gradient ASCII art on startup
- 🔍 **Smart Search** - Search through posts with highlighted results
- 📱 **Responsive Design** - Adapts to terminal width and respects color preferences
- ⚡ **Enhanced UX** - Smooth spinners, progress indicators, and helpful tips
- 🎯 **Clean Content** - Strips HTML and formats posts for optimal terminal reading
- 🌈 **Rich Styling** - Colors, gradients, and beautiful typography (with `--no-color` fallback)

## Install

```bash
# From npm
npm install -g lucandjeremi-cli

# Or from source
git clone https://github.com/lucaviness/lucandjeremi-cli.git
cd lucandjeremi-cli
npm install
npm link
```

## Use

```bash
# Browse and read posts (shows beautiful banner!)
lucandjeremi

# Search posts with highlighted results
lucandjeremi search learning

# Disable colors for CI/automation
lucandjeremi --no-color

# Show help
lucandjeremi help
```

## Screenshots

The CLI features a stunning ASCII banner with gradient colors, clean post listings, and enhanced readability for the terminal experience.
