const versionPicker = document.querySelector('#patch-version');
const versionLinks = document.querySelectorAll('.patch-versions a');
const currentVersion = document.querySelector('.patch-current-version');
const notes = new Map(Array.from(document.querySelectorAll('.patch-notes'), article => [article.id, {
  article,
  header: article.querySelector('.patch-version'),
  heading: article.querySelector('.patch-version-heading'),
}]));
const defaultVersion = versionLinks[0].hash.slice(1);

for (const link of versionLinks) {
  const version = link.querySelector('small').textContent;
  const title = link.querySelector('span').textContent;
  versionPicker.add(new Option(`${version} — ${title}`, link.hash.slice(1)));
}

function showVersion(version) {
  versionPicker.value = version;
  for (const [id, {article, header, heading}] of notes) {
    article.hidden = id !== version;
    if (id === version && heading.parentElement !== currentVersion) {
      currentVersion.append(heading);
    } else if (article.hidden && heading.parentElement === currentVersion) {
      header.prepend(heading);
    }
  }
  for (const link of versionLinks) {
    if (link.hash.slice(1) === version) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  }
}

function syncVersion() {
  const fragment = window.location.hash.slice(1);
  const target = document.getElementById(fragment);
  const article = target?.closest('.patch-notes');
  const version = article?.id ?? [...notes.keys()].find(id => fragment.startsWith(id + '-')) ?? defaultVersion;
  showVersion(version);
  if (target && article && target !== article && !currentVersion.contains(target)) {
    target.scrollIntoView({ behavior: 'instant' });
  } else if (target && (target === article || currentVersion.contains(target))) {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

versionPicker.addEventListener('change', () => {
  const version = versionPicker.value;
  window.history.pushState(null, '', `#${version}`);
  showVersion(version);
  window.scrollTo({ top: 0, behavior: 'instant' });
});

window.addEventListener('hashchange', syncVersion);
versionPicker.closest('.patch-picker').hidden = false;
document.querySelector('.patch-layout').classList.add('patch-nav-ready');
syncVersion();

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const clips = Array.from(document.querySelectorAll('.patch-motion-toggle'), button => {
  const figure = button.closest('figure');
  const poster = figure.querySelector('picture source');
  const setPlaying = playing => {
    poster.media = playing ? 'not all' : 'all';
    button.textContent = playing ? 'Остановить GIF' : 'Воспроизвести GIF';
  };
  button.addEventListener('click', () => setPlaying(poster.media === 'all'));
  figure.querySelector('.patch-motion-link').hidden = true;
  button.hidden = false;
  return setPlaying;
});

function syncClipMotion() {
  for (const setPlaying of clips) setPlaying(!motionPreference.matches);
}

motionPreference.addEventListener('change', syncClipMotion);
syncClipMotion();
