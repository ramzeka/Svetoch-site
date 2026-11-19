import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = join(root, 'data', 'patches');
const output = join(root, 'dist', 'changes.html');
const files = (await readdir(directory)).filter(name => name.endsWith('.json')).sort();
const patches = await Promise.all(files.map(async name => {
  const patch = JSON.parse(await readFile(join(directory, name), 'utf8'));
  if (name !== patch.id + '.json') throw new Error('Patch filename and ID differ: ' + name);
  return patch;
}));
patches.sort((a, b) => b.order - a.order);

const escape = value => String(value).replace(/[&<>"']/g, character =>
  ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[character]);
const text = value => escape(value).replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const commit = /^[0-9a-f]{40}$/;
const mediaFiles = new Set();
const ids = new Set();
const links = new Set();
const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

function id(value) {
  if (!identifier.test(value) || ids.has(value)) throw new Error('Invalid or repeated anchor: ' + value);
  ids.add(value);
  return value;
}

function dateLabel(date, year = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date).toISOString().slice(0, 10) !== date) {
    throw new Error('Invalid patch date: ' + date);
  }
  const [y, m, d] = date.split('-').map(Number);
  return d + ' ' + months[m - 1] + (year ? ' ' + y : '');
}

function asset(path) {
  if (!/^assets\/history\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(gif|webp|png)$/.test(path)) {
    throw new Error('Invalid patch media path: ' + path);
  }
  mediaFiles.add(path);
  return path;
}

function picture(media, sprite = false) {
  if (!commit.test(media.gameCommit) ||
      !Number.isInteger(media.width) || media.width < 1 ||
      !Number.isInteger(media.height) || media.height < 1) {
    throw new Error('Missing game commit or dimensions for media: ' + media.file);
  }
  const source = asset(media.file);
  if (source.endsWith('.gif') && !media.poster) throw new Error('Missing motion fallback: ' + source);
  const still = media.poster ? asset(media.poster) : null;
  if (still?.endsWith('.gif')) throw new Error('Motion fallback must be static: ' + still);
  const attributes = sprite ? ' class="patch-entity-portrait"' : '';
  return '<picture' + attributes + '>' +
    (still ? '<source media="(prefers-reduced-motion: reduce)" srcset="' + still + '">' : '') +
    '<img src="' + source + '" width="' + media.width + '" height="' + media.height +
    '" loading="lazy" decoding="async" alt="' + escape(media.alt ?? '') + '"></picture>';
}

function list(lines) {
  return '<ul>\n' + lines.map(line => '<li>' + text(line) + '</li>').join('\n') + '\n</ul>';
}

function renderBlock(block, patch) {
  switch (block.type) {
    case 'list':
      return list(block.lines);
    case 'title':
      return '<h5>' + escape(block.title) + '</h5>';
    case 'text':
      return '<p' + (block.note ? ' class="patch-detail-note"' : '') + '>' + text(block.text) + '</p>';
    case 'topic':
      return '<section class="patch-topic"><h4>' + escape(block.title) + '</h4>\n' +
        renderBlocks(block.blocks, patch) + '\n</section>';
    case 'actor': {
      const anchor = id(patch + '-' + block.id);
      const title = id(anchor + '-title');
      return '<section class="patch-entity" id="' + anchor + '" data-entity="' + block.id + '" aria-labelledby="' + title +
        '"><header class="patch-entity-header">' + picture(block.sprite, true) +
        '<h4 id="' + title + '">' + escape(block.name) + '</h4></header>\n<div class="patch-entity-body">\n' +
        renderBlocks(block.blocks, patch) + '\n</div></section>';
    }
    case 'items':
      return '<ul class="patch-item-list">\n' + block.entries.map(item => {
        if (item.status.startsWith('Удал') && item.lines.length) {
          throw new Error('Removed item has repeated details: ' + item.name + ' in ' + patch);
        }
        return '<li class="patch-item-change"><h4>' + escape(item.name) +
          '</h4><p class="patch-change-kind">' + escape(item.status) + '</p>' +
          (item.lines.length ? list(item.lines) : '') + '</li>';
      }).join('\n') + '\n</ul>';
    case 'gallery':
      return '<div class="patch-entity-clips">\n' + renderBlocks(block.blocks, patch) + '\n</div>';
    case 'media': {
      const anchor = block.id ? ' id="' + id(patch + '-' + block.id) + '"' : '';
      return '<figure class="patch-clip"' + anchor + '>' + picture(block) + '<figcaption>' +
        text(block.caption) + (block.file.endsWith('.gif') ?
          ' <a class="patch-motion-link" href="' + asset(block.file) + '">Открыть анимацию</a>' : '') +
        '</figcaption></figure>';
    }
    case 'link': {
      const anchor = patch + '-' + block.target;
      links.add(anchor);
      return '<p class="patch-media-reference"><a class="text-link" href="#' + anchor + '">' +
        escape(block.label) + '</a></p>';
    }
    default:
      throw new Error('Unknown patch block: ' + block.type);
  }
}

function renderBlocks(blocks, patch) {
  return blocks.map(block => renderBlock(block, patch)).join('\n');
}

function renderSection(section, patch) {
  const anchor = id(patch + '-' + section.id);
  const layout = section.id === 'gameplay' ? ' patch-gameplay' :
    ['sprites','enemies'].includes(section.id) ? ' patch-entity-section' : '';
  return '<section class="patch-group' + layout + '" id="' + anchor + '">\n<h3>' + escape(section.title) +
    '</h3>\n' + renderBlocks(section.blocks, patch) + '\n</section>';
}

function renderPatch(patch) {
  if (!commit.test(patch.source.commit)) throw new Error('Missing game commit: ' + patch.id);
  const anchor = id(patch.id);
  const title = id(patch.id + '-title');
  const navigation = patch.sections.map(section => '<a href="#' + anchor + '-' + section.id + '">' +
    escape(section.navigation) + '</a>').join(' ');
  return '<article class="patch-notes" id="' + anchor + '" aria-labelledby="' + title +
    '">\n<header class="patch-version"><p><span>' + escape(patch.label) + '</span> <time datetime="' + patch.date +
    '">' + dateLabel(patch.date, true) + '</time></p><h2 id="' + title + '" tabindex="-1">' +
    escape(patch.title) + '</h2><nav class="patch-chapter-nav" aria-label="Разделы патча">' +
    navigation + '</nav></header>\n' + patch.sections.map(section => renderSection(section, anchor)).join('\n') +
    '\n</article>';
}

if (!patches.length || patches.some(patch => !Number.isInteger(patch.order)) ||
    new Set(patches.map(patch => patch.order)).size !== patches.length) {
  throw new Error('Patch order must contain distinct integers');
}
const articles = patches.map(renderPatch).join('\n\n');
const navigation = patches.map(patch => '<li><a href="#' + patch.id + '"><span>' + escape(patch.title) +
  '</span><small>' + escape(patch.label) + '</small></a></li>').join('\n');
for (const anchor of links) {
  if (!ids.has(anchor)) throw new Error('Missing media anchor: ' + anchor);
}
await Promise.all([...mediaFiles].map(file => access(join(root, 'dist', file))));
const normaliseEol = value => value.replace(/\r\n/g, '\n');
const template = normaliseEol(await readFile(new URL('./patch-template.html', import.meta.url), 'utf8'));
for (const marker of ['<!-- PATCH_NAVIGATION -->', '<!-- PATCH_ARTICLES -->']) {
  if (template.split(marker).length !== 2) throw new Error('Expected one template marker: ' + marker);
}
const html = template.replace('<!-- PATCH_NAVIGATION -->', () => navigation)
  .replace('<!-- PATCH_ARTICLES -->', () => articles);

const option = process.argv[2];
if (option === '--check') {
  if (normaliseEol(await readFile(output, 'utf8')) !== html) {
    throw new Error('Patch HTML is outdated. Run node tools/build-patches.mjs.');
  }
} else if (option === undefined) {
  await writeFile(output, html);
} else {
  throw new Error('Use node tools/build-patches.mjs [--check]');
}
console.log(patches.length + ' patches and ' + mediaFiles.size + ' referenced media files verified.');
