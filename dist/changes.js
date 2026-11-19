const versionPicker = document.querySelector('#patch-version');
const versionLinks = document.querySelectorAll('.patch-versions a');
const entries = document.querySelector('.patch-entries');
const notes = new Map(Array.from(entries.children, article => [article.id, article]));
const defaultVersion = versionLinks[0].hash.slice(1);

for (const link of versionLinks) {
  const name = link.querySelector('span').textContent;
  const version = link.querySelector('small').textContent;
  const label = `${version} — ${name}`;
  versionPicker.add(new Option(label, link.hash.slice(1)));
}

function showVersion(version) {
  versionPicker.value = version;
  for (const [id, article] of notes) {
    article.hidden = id !== version;
  }
  for (const link of versionLinks) {
    if (link.hash.slice(1) === version) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  }
}

function syncVersion({ scroll = false } = {}) {
  const fragment = window.location.hash.slice(1);
  const target = document.getElementById(fragment);
  const article = target?.closest('.patch-notes');
  const version = article?.id ?? [...notes.keys()].find(id => fragment.startsWith(id + '-')) ?? defaultVersion;
  showVersion(version);
  if (target && article && target !== article) {
    target.scrollIntoView({ behavior: 'instant' });
  } else if ((scroll || fragment) && entries.getBoundingClientRect().top < 0) {
    document.querySelector('.patch-layout').scrollIntoView({ behavior: 'instant' });
  }
}

versionPicker.addEventListener('change', () => {
  const version = versionPicker.value;
  window.history.pushState(null, '', `#${version}`);
  showVersion(version);
  notes.get(version).scrollIntoView({ behavior: 'instant', block: 'start' });
});

window.addEventListener('hashchange', () => syncVersion({ scroll: true }));
showVersion(defaultVersion);
syncVersion();
versionPicker.closest('.patch-picker').hidden = false;
document.querySelector('.patch-layout').classList.add('patch-nav-ready');
