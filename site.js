const thumbnails = document.querySelectorAll('.thumb');
const screenLink = document.querySelector('#screen-link');
const screenImage = document.querySelector('#screen-image');
const screenName = document.querySelector('#screen-name');
const screenDescription = document.querySelector('#screen-description');
const lightbox = document.querySelector('#lightbox');
const lightboxTitle = document.querySelector('#lightbox-title');
const lightboxImage = document.querySelector('#lightbox-image');

for (const thumbnail of thumbnails) {
  thumbnail.addEventListener('click', () => {
    const { source, name, alt, description } = thumbnail.dataset;
    screenImage.src = source;
    screenImage.alt = alt;
    screenLink.href = source;
    screenLink.setAttribute('aria-label', `Увеличить скриншот: ${name}`);
    screenName.textContent = name;
    screenDescription.textContent = description;

    for (const item of thumbnails) {
      item.setAttribute('aria-pressed', String(item === thumbnail));
    }
  });
}

screenLink.addEventListener('click', (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !lightbox.showModal) return;

  event.preventDefault();
  lightboxTitle.textContent = screenName.textContent;
  lightboxImage.src = screenLink.href;
  lightboxImage.alt = screenImage.alt;
  lightbox.showModal();
});

lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});
