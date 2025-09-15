const figlet = require("figlet");
const gradient = require("gradient-string");
const boxen = require("boxen").default || require("boxen");

async function printBanner(title = "JN / LC") {
  // Make sure we don't explode on tiny terminals/CI
  const width = Math.max(40, Math.min(process.stdout.columns || 80, 100));
  
  // Check if we're in a TTY and colors are supported
  const colorEnabled = process.stdout.isTTY && !process.env.NO_COLOR;
  
  const text = await new Promise((res) =>
    figlet.text(title, { font: "ANSI Shadow", horizontalLayout: "fitted" }, (err, data) =>
      res(err ? title : data)
    )
  );

  let colored;
  if (colorEnabled) {
    // Try different gradients - atlas, summer, cristal, mind, etc.
    colored = gradient.atlas.multiline(text);
  } else {
    colored = text;
  }

  // Center the text manually within the box
  const lines = colored.split('\n');
  const maxLineLength = Math.max(...lines.map(line => line.length));
  const centeredLines = lines.map(line => {
    const padding = Math.max(0, Math.floor((width - 4 - maxLineLength) / 2));
    return ' '.repeat(padding) + line;
  });
  const centeredText = centeredLines.join('\n');

  const framed = boxen(colored, {
    padding: 1,
    margin: 0,
    borderStyle: "round",
    borderColor: colorEnabled ? "cyan" : "gray",
    float: "center",
    title: "lucandjeremi-cli",
    titleAlignment: "center",
    width
  });

  console.log(framed);
}

module.exports = { printBanner };
