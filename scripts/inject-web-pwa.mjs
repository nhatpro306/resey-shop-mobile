// Post-processes the Expo web (SPA) export to add PWA + mobile metadata.
// Expo's `output: "single"` template doesn't run app/+html.tsx, so we inject the
// manifest link, theme-color, apple-touch-icon, and a mobile viewport here.
import fs from "node:fs";

const file = "dist/index.html";
if (!fs.existsSync(file)) {
  console.error(`[inject-web-pwa] ${file} not found. Run "expo export --platform web" first.`);
  process.exit(1);
}

let html = fs.readFileSync(file, "utf8");

const tags = [
  '<link rel="manifest" href="/manifest.json" />',
  '<meta name="theme-color" content="#0A0A0A" />',
  '<meta name="application-name" content="RESEY Shop" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '<meta name="apple-mobile-web-app-title" content="RESEY" />',
  '<link rel="apple-touch-icon" href="/icons/icon-1024.png" />',
].filter((tag) => !html.includes(tag));

if (tags.length > 0) {
  html = html.replace("</head>", `  ${tags.join("\n  ")}\n</head>`);
}

// Mobile-friendly viewport (Expo ships a desktop-ish default).
html = html.replace(
  /<meta name="viewport"[^>]*>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />',
);

// Page language for Vietnamese UI.
html = html.replace(/<html lang="en">/, '<html lang="vi">');

fs.writeFileSync(file, html);
console.log(`[inject-web-pwa] Injected ${tags.length} PWA tag(s) + viewport into ${file}`);
