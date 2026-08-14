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

// ---------- Modal estilo Instagram ----------
const modalOverlay = document.getElementById('modalOverlay');
const modalImg = document.getElementById('modalImg');
const modalCaption = document.getElementById('modalCaption');
const modalClose = document.getElementById('modalClose');

function openModal(card) {
  const img = card.querySelector('img');
  modalImg.src = img.src;
  modalImg.alt = img.alt;
  modalCaption.textContent = card.dataset.caption || img.alt;
  modalOverlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('is-open');
  document.body.style.overflow = '';
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

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) closeModal();
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
