(() => {
  const concepts = [...document.querySelectorAll('.concept')];
  const links = [...document.querySelectorAll('[data-topic]')];
  const sizes = [...document.querySelectorAll('[data-size]')];
  document.documentElement.classList.add('js');
  document.querySelector('.view-toolbar').hidden = false;

  function selectTopic(id) {
    const selected = concepts.find((concept) => concept.id === id) || concepts[0];
    concepts.forEach((concept) => { concept.hidden = concept !== selected; });
    links.forEach((link) => {
      const active = link.dataset.topic === selected.id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  links.forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    history.replaceState(null, '', `#${link.dataset.topic}`);
    selectTopic(link.dataset.topic);
  }));
  window.addEventListener('hashchange', () => selectTopic(location.hash.slice(1)));
  selectTopic(location.hash.slice(1));

  sizes.forEach((button) => button.addEventListener('click', () => {
    document.body.classList.toggle('hero-size', button.dataset.size === 'hero');
    sizes.forEach((other) => {
      const active = other === button;
      other.classList.toggle('active', active);
      other.setAttribute('aria-pressed', String(active));
    });
  }));

  concepts.forEach((concept) => {
    const img = concept.querySelector('.artwork img');
    const marker = concept.querySelector('.focus-dot');
    let focus = null;
    function positionFocus() {
      if (!focus) return;
      marker.style.left = `${focus[0] * img.clientWidth}px`;
      marker.style.top = `${focus[1] * img.clientHeight}px`;
      marker.hidden = false;
    }
    concept.querySelectorAll('.beat').forEach((beat) => beat.addEventListener('click', () => {
      concept.querySelectorAll('.beat').forEach((other) => {
        const active = other === beat;
        other.classList.toggle('active', active);
        other.setAttribute('aria-pressed', String(active));
      });
      focus = beat.dataset.focus.split(',').map(Number);
      positionFocus();
    }));
    img.addEventListener('load', positionFocus);
    new ResizeObserver(positionFocus).observe(img);
  });
})();
