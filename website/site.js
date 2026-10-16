const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('IntersectionObserver' in window && motionAllowed) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('.game, .how > div, .contribute h2').forEach((element) => {
    element.classList.add('reveal-ready');
    observer.observe(element);
  });
}

const preview = document.querySelector('dialog');
if (preview && typeof preview.showModal === 'function') {
  const image = preview.querySelector('img');
  document.querySelectorAll('[data-preview]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      preview.showModal();
    });
  });
  preview.querySelector('button').addEventListener('click', () => preview.close());
  preview.addEventListener('click', (event) => {
    if (event.target === preview) {
      const bounds = preview.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) preview.close();
    }
  });
}
