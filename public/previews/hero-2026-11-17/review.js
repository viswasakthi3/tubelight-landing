(() => {
  const concepts = [...document.querySelectorAll('.concept')];
  const links = [...document.querySelectorAll('[data-topic]')];
  const sizes = [...document.querySelectorAll('[data-size]')];
  document.documentElement.classList.add('js');
  document.querySelector('.view-toolbar').hidden = false;
  function selectTopic(id) {
    const selected = concepts.find((concept) => concept.id === id) || concepts[0];
    concepts.forEach((concept) => {
      concept.hidden = concept !== selected;
      if (concept !== selected) concept.querySelector('video').pause();
    });
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
    const video = concept.querySelector('video');
    const caption = concept.querySelector('.spoken-line');
    const textTrack = video.textTracks[0];
    if (textTrack) {
      // Keep the artwork clear and captions readable outside native controls.
      textTrack.mode = 'hidden';
      textTrack.addEventListener('cuechange', () => {
        const text = [...(textTrack.activeCues || [])].map((cue) => cue.text).join(' ');
        if (text) caption.textContent = text;
      });
    }
    const sceneButtons = [...concept.querySelectorAll('.scene-pick')];
    const controls = [...concept.querySelectorAll('[data-scene]')];
    function markScene(index) {
      controls.forEach((button) => {
        const active = Number(button.dataset.scene) === index;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }
    let pendingSeek = null;
    const applyPendingSeek = () => {
      if (pendingSeek === null || video.readyState < 2 || !video.seekable.length) return;
      if (video.seekable.end(video.seekable.length - 1) < pendingSeek) return;
      const time = pendingSeek;
      pendingSeek = null;
      video.currentTime = time;
    };
    const seek = (time) => {
      video.pause();
      // Seek just inside the scene to avoid showing the preceding frame.
      pendingSeek = time + 0.08;
      video.preload = 'auto';
      applyPendingSeek();
    };
    controls.forEach((button) => button.addEventListener('click', () => {
      markScene(Number(button.dataset.scene));
      seek(Number(button.dataset.start));
    }));
    ['loadedmetadata', 'loadeddata', 'canplay', 'progress'].forEach((event) => video.addEventListener(event, applyPendingSeek));
    video.addEventListener('timeupdate', () => {
      if (pendingSeek !== null) return;
      const current = sceneButtons.findLastIndex((button) => video.currentTime >= Number(button.dataset.start));
      markScene(Math.max(0, current));
    });
    video.addEventListener('play', () => {
      concepts.forEach((other) => { if (other !== concept) other.querySelector('video').pause(); });
    });
  });
})();
