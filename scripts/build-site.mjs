import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'website');
const output = path.join(root, 'dist', 'site');
await mkdir(path.join(output, 'images'), { recursive: true });
for (const name of ['index.html', 'style.css', 'site.js', 'icon.svg']) {
  await cp(path.join(source, name), path.join(output, name));
}
const html = await readFile(path.join(source, 'index.html'), 'utf8');
const images = new Set([...html.matchAll(/(?:src|href)="images\/([\w.-]+)"/g)].map((match) => match[1]));
for (const name of images) {
  await cp(path.join(root, 'docs', 'screenshots', name), path.join(output, 'images', name));
}
await writeFile(path.join(output, '.nojekyll'), '');
await writeFile(path.join(output, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://hartwich.github.io/Open-Party-Lab/sitemap.xml\n');
await writeFile(path.join(output, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://hartwich.github.io/Open-Party-Lab/</loc></url></urlset>\n');
console.log(`Built project website in dist/site with ${images.size} screenshots.`);
