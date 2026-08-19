// ---------- Menú móvil ----------
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ---------- Tema claro/oscuro (click en el logo) ----------
const themeToggle = document.getElementById('themeToggle');
const THEME_KEY = 'vw-theme';

function setTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem(THEME_KEY, theme);
}

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  setTheme(isDark ? 'light' : 'dark');
});

// ---------- Filtros de proyectos ----------
const filtros = document.querySelectorAll('.filtro');
const cards = document.querySelectorAll('.card');

filtros.forEach(btn => {
  btn.addEventListener('click', () => {
    filtros.forEach(f => {
      f.classList.remove('is-active');
      f.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('is-active');
    btn.setAttribute('aria-selected', 'true');

    const filtro = btn.dataset.filter;

    cards.forEach(card => {
      const match = filtro === 'todo' || card.dataset.category === filtro;
      card.classList.toggle('is-hidden', !match);
    });
  });
});

// ---------- Modal estilo Instagram (con soporte de carrusel) ----------
const modalOverlay = document.getElementById('modalOverlay');
const modalCaption = document.getElementById('modalCaption');
const modalClose = document.getElementById('modalClose');
const carouselTrack = document.getElementById('carouselTrack');
const carouselPrev = document.getElementById('carouselPrev');
const carouselNext = document.getElementById('carouselNext');
const carouselDots = document.getElementById('carouselDots');
const carouselCount = document.getElementById('carouselCount');

const modal = document.querySelector('.modal');
const modalMedia = document.querySelector('.modal-media');

let carouselImages = [];
let carouselIndex = 0;
let carouselRatio = 1;

// Ícono estilo Instagram (cuadrados apilados) para miniaturas con varias fotos
const STACK_ICON_SVG = `
  <svg class="card-stack-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.5 4.5H8.4c-1.6 0-2.9 1.3-2.9 2.9v9.1" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="7.5" y="7.5" width="13" height="13" rx="2.5" fill="#fff"/>
  </svg>`;

const PLAY_ICON_SVG = `<svg viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>`;
const PAUSE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="#fff"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>`;
const MUTE_ON_SVG = `<svg viewBox="0 0 24 24" fill="#fff"><path d="M16.5 12A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM3 9v6h4l5 5V4L7 9H3z"/></svg>`;
const MUTE_OFF_SVG = `<svg viewBox="0 0 24 24" fill="#fff"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 15.6 21 13.85 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zm-9.53-7.65 1.53-1.53L3.98 3.31 2.71 4.58 6.13 8H2v8h4l5 5v-6.03l3.73 3.73c-.59.46-1.26.82-2 1.03v2.06a8.99 8.99 0 0 0 3.42-1.68l1.83 1.83 1.27-1.27L5.97 4.35z"/></svg>`;
const EXPAND_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;

// Extensiones que se tratan como video dentro del carrusel
const VIDEO_EXT = /\.(mp4|webm|ogv|ogg|mov|m4v)$/i;
function isVideoSrc(src) {
  return VIDEO_EXT.test(src);
}

// Obtiene la lista de imágenes/videos de una card: usa data-images (separadas por coma)
// si existe, o cae de vuelta a la única imagen de la card.
function getCardImages(card) {
  const raw = card.dataset.images;
  if (raw && raw.trim()) {
    return raw.split(',').map(src => src.trim()).filter(Boolean);
  }
  const img = card.querySelector('img');
  return [img.src];
}

// Marca con el ícono de carrusel las cards que tienen más de una imagen
cards.forEach(card => {
  if (getCardImages(card).length > 1) {
    const cardImgEl = card.querySelector('.card-img');
    cardImgEl.insertAdjacentHTML('beforeend', STACK_ICON_SVG);
  }
});

function isMobileLayout() {
  return window.innerWidth <= 768;
}

// Ajusta el tamaño del modal al formato real de la imagen/video activo,
// calculando la caja más grande posible que respete el aspect ratio exacto
// (igual que "object-fit: contain", pero aplicado al contenedor, así no
// sobra espacio para barras negras).
function fitInBox(ratio, boxW, boxH) {
  let w = boxW;
  let h = w / ratio;
  if (h > boxH) {
    h = boxH;
    w = h * ratio;
  }
  return { w, h };
}

function sizeModalForCarousel() {
  const ratio = carouselRatio;

  if (isMobileLayout()) {
    const boxW = window.innerWidth - 16;
    const boxH = window.innerHeight * 0.72;
    const { w: mediaW, h: mediaH } = fitInBox(ratio, boxW, boxH);

    modalMedia.style.width = `${mediaW}px`;
    modalMedia.style.height = `${mediaH}px`;
    modal.style.width = '';
  } else {
    const sidebarW = 300;
    const maxTotalW = Math.min(935, window.innerWidth - 40);
    const boxW = maxTotalW - sidebarW;
    const boxH = window.innerHeight * 0.8;
    const { w: mediaW, h: mediaH } = fitInBox(ratio, boxW, boxH);

    modalMedia.style.width = `${mediaW}px`;
    modalMedia.style.height = `${mediaH}px`;
    modal.style.width = `${mediaW + sidebarW}px`;
  }
}

// Obtiene el ancho/alto real de una imagen o video ya insertado en el DOM,
// esperando a que cargue si hace falta.
function getMediaDimensions(el) {
  return new Promise(resolve => {
    if (el.tagName === 'IMG') {
      if (el.complete && el.naturalWidth) {
        resolve({ w: el.naturalWidth, h: el.naturalHeight });
      } else {
        el.addEventListener('load', () => resolve({ w: el.naturalWidth, h: el.naturalHeight }), { once: true });
        el.addEventListener('error', () => resolve({ w: 0, h: 0 }), { once: true });
      }
    } else {
      if (el.readyState >= 1 && el.videoWidth) {
        resolve({ w: el.videoWidth, h: el.videoHeight });
      } else {
        el.addEventListener('loadedmetadata', () => resolve({ w: el.videoWidth, h: el.videoHeight }), { once: true });
        el.addEventListener('error', () => resolve({ w: 0, h: 0 }), { once: true });
      }
    }
  });
}

// El carrusel usa UN solo tamaño de caja para todos sus slides: el formato
// del archivo más grande (mayor resolución) del set. Los demás slides que no
// compartan ese formato quedan centrados con barras negras alrededor
// (object-fit: contain), en vez de que la caja cambie de tamaño en cada swipe.
async function computeCarouselRatio() {
  const mediaEls = Array.from(carouselTrack.querySelectorAll('img, video'));
  const dims = await Promise.all(mediaEls.map(getMediaDimensions));

  let biggest = { w: 0, h: 0 };
  dims.forEach(d => {
    if (d.w * d.h > biggest.w * biggest.h) biggest = d;
  });

  carouselRatio = (biggest.w && biggest.h) ? biggest.w / biggest.h : 1;
  sizeModalForCarousel();
}

// Reproduce automáticamente el video del slide activo (como Instagram, pero
// con sonido: como siempre partimos de una interacción del usuario -click o
// tecla- el navegador permite el autoplay con audio; solo si lo bloquea,
// caemos de vuelta a silenciado) y pausa/reinicia los demás.
function updateMuteIcon(slide, video) {
  const btn = slide.querySelector('.video-mute-toggle');
  if (btn) btn.innerHTML = video.muted ? MUTE_ON_SVG : MUTE_OFF_SVG;
}

function updateVideoPlayback() {
  Array.from(carouselTrack.children).forEach((slide, i) => {
    const video = slide.querySelector('video');
    if (!video) return;
    if (i === carouselIndex) {
      slide.classList.remove('is-paused');
      video.muted = false;
      const playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(() => {
          // El navegador bloqueó el audio: reintentamos silenciado para
          // que al menos la reproducción automática no se detenga.
          video.muted = true;
          video.play().catch(() => {});
          updateMuteIcon(slide, video);
        });
      }
      updateMuteIcon(slide, video);
    } else {
      video.pause();
      video.currentTime = 0;
      const fill = slide.querySelector('.video-progress-fill');
      if (fill) fill.style.width = '0%';
    }
  });
}

function pauseAllVideos() {
  carouselTrack.querySelectorAll('video').forEach(video => video.pause());
}

function renderCarousel() {
  const multiple = carouselImages.length > 1;

  carouselTrack.style.transform = `translateX(-${carouselIndex * 100}%)`;
  carouselPrev.classList.toggle('is-hidden', !multiple);
  carouselNext.classList.toggle('is-hidden', !multiple);
  carouselCount.classList.toggle('is-hidden', !multiple);
  carouselCount.textContent = `${carouselIndex + 1}/${carouselImages.length}`;

  carouselDots.innerHTML = '';
  if (multiple) {
    carouselImages.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === carouselIndex ? ' is-active' : '');
      dot.setAttribute('aria-label', `Ir a la imagen ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i));
      carouselDots.appendChild(dot);
    });
  }

  updateVideoPlayback();
}

function goToSlide(index) {
  carouselIndex = (index + carouselImages.length) % carouselImages.length;
  renderCarousel();
}

function openModal(card) {
  const images = getCardImages(card);
  const altText = card.querySelector('img').alt;

  carouselImages = images;
  carouselIndex = 0;

  carouselTrack.innerHTML = images.map(src => {
    if (isVideoSrc(src)) {
      return `<div class="carousel-slide" data-type="video">
        <video src="${src}" loop playsinline preload="metadata"></video>
        <div class="video-state-icon">${PLAY_ICON_SVG}</div>
        <button type="button" class="video-mute-toggle" aria-label="Activar/silenciar sonido">${MUTE_OFF_SVG}</button>
        <button type="button" class="video-expand" aria-label="Ver video en pantalla completa">${EXPAND_ICON_SVG}</button>
        <div class="video-progress" aria-hidden="true"><div class="video-progress-fill"></div></div>
      </div>`;
    }
    return `<div class="carousel-slide" data-type="image"><img src="${src}" alt="${altText}"></div>`;
  }).join('');

  // Barra de progreso (no interactiva) para cada video
  carouselTrack.querySelectorAll('video').forEach(video => {
    const fill = video.parentElement.querySelector('.video-progress-fill');
    if (!fill) return;
    video.addEventListener('timeupdate', () => {
      if (!video.duration) return;
      fill.style.width = `${(video.currentTime / video.duration) * 100}%`;
    });
    video.addEventListener('seeked', () => {
      if (!video.duration) return;
      fill.style.width = `${(video.currentTime / video.duration) * 100}%`;
    });
  });

  modalCaption.textContent = card.dataset.caption || altText;
  modalOverlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  renderCarousel();
  computeCarouselRatio();
}

function closeModal() {
  pauseAllVideos();
  modalOverlay.classList.remove('is-open');
  document.body.style.overflow = '';
  modal.style.width = '';
  modalMedia.style.width = '';
  modalMedia.style.height = '';
}

cards.forEach(card => {
  card.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(card);
  });
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal(card);
    }
  });
});

carouselPrev.addEventListener('click', (e) => {
  e.stopPropagation();
  goToSlide(carouselIndex - 1);
});
carouselNext.addEventListener('click', (e) => {
  e.stopPropagation();
  goToSlide(carouselIndex + 1);
});

// Navegación con flechas del teclado mientras el modal está abierto
document.addEventListener('keydown', (e) => {
  if (!modalOverlay.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowRight') goToSlide(carouselIndex + 1);
  if (e.key === 'ArrowLeft') goToSlide(carouselIndex - 1);
});

// Swipe táctil, estilo Instagram + zoom con pellizco en las imágenes
// (al soltar, el zoom vuelve solo a su tamaño normal)
let touchStartX = 0;
let touchDeltaX = 0;
let isPinching = false;
let pinchStartDist = 0;
let activeZoomImg = null;

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

carouselTrack.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    const activeSlide = carouselTrack.children[carouselIndex];
    const img = activeSlide && activeSlide.querySelector('img');
    if (img) {
      isPinching = true;
      activeZoomImg = img;
      pinchStartDist = getTouchDistance(e.touches);
      img.style.transition = 'none';
    }
  } else {
    touchStartX = e.touches[0].clientX;
    touchDeltaX = 0;
  }
}, { passive: true });

carouselTrack.addEventListener('touchmove', (e) => {
  if (isPinching && e.touches.length === 2 && activeZoomImg) {
    e.preventDefault();
    const dist = getTouchDistance(e.touches);
    const scale = Math.min(Math.max(dist / pinchStartDist, 1), 3);
    activeZoomImg.style.transform = `scale(${scale})`;
    return;
  }
  if (!isPinching) {
    touchDeltaX = e.touches[0].clientX - touchStartX;
  }
}, { passive: false });

carouselTrack.addEventListener('touchend', () => {
  if (isPinching) {
    if (activeZoomImg) {
      const img = activeZoomImg;
      img.style.transition = 'transform 0.25s ease';
      img.style.transform = 'scale(1)';
      setTimeout(() => { img.style.transition = ''; }, 260);
    }
    isPinching = false;
    activeZoomImg = null;
    touchDeltaX = 0;
    return;
  }

  const SWIPE_THRESHOLD = 40;
  if (touchDeltaX > SWIPE_THRESHOLD) {
    goToSlide(carouselIndex - 1);
  } else if (touchDeltaX < -SWIPE_THRESHOLD) {
    goToSlide(carouselIndex + 1);
  }
});

// ---------- Interacción con video: play/pause con click o touch ----------
carouselTrack.addEventListener('click', (e) => {
  if (e.target.closest('.video-mute-toggle') || e.target.closest('.video-expand')) return;

  const slide = e.target.closest('.carousel-slide[data-type="video"]');
  if (!slide) return;

  const video = slide.querySelector('video');
  if (video.paused) {
    video.play();
    slide.classList.remove('is-paused');
  } else {
    video.pause();
    slide.classList.add('is-paused');
  }
});

// Silenciar / activar sonido, sin afectar el estado de reproducción
carouselTrack.addEventListener('click', (e) => {
  const muteBtn = e.target.closest('.video-mute-toggle');
  if (!muteBtn) return;
  e.stopPropagation();

  const video = muteBtn.closest('.carousel-slide').querySelector('video');
  video.muted = !video.muted;
  muteBtn.innerHTML = video.muted ? MUTE_ON_SVG : MUTE_OFF_SVG;
});

// Ampliar el video (pantalla completa nativa)
carouselTrack.addEventListener('click', (e) => {
  const expandBtn = e.target.closest('.video-expand');
  if (!expandBtn) return;
  e.stopPropagation();

  const video = expandBtn.closest('.carousel-slide').querySelector('video');
  if (video.requestFullscreen) {
    video.requestFullscreen();
  } else if (video.webkitEnterFullscreen) {
    // iOS Safari
    video.webkitEnterFullscreen();
  } else if (video.webkitRequestFullscreen) {
    video.webkitRequestFullscreen();
  }
});

// Recalcula el tamaño del modal si la ventana cambia de tamaño (ej. rotar el
// celular o redimensionar la ventana en desktop)
let resizeTimeout;
window.addEventListener('resize', () => {
  if (!modalOverlay.classList.contains('is-open')) return;
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(sizeModalForCarousel, 120);
});

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// ---------- Formulario de contacto (Formspree) ----------
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formStatus.textContent = 'Enviando…';

  try {
    const response = await fetch(contactForm.action, {
      method: 'POST',
      body: new FormData(contactForm),
      headers: { Accept: 'application/json' }
    });

    if (response.ok) {
      formStatus.textContent = '¡Gracias! Tu mensaje fue enviado correctamente.';
      contactForm.reset();
    } else {
      formStatus.textContent = 'No se pudo enviar el mensaje. Intenta de nuevo.';
    }
  } catch (err) {
    formStatus.textContent = 'Error de conexión. Intenta de nuevo más tarde.';
  }
});
