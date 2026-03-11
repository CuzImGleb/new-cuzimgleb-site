/* ===================================================
   CuzImGleb – privacy.js  |  2026 Rewrite
   =================================================== */

// ── Header scroll effect ─────────────────────────────
const header = document.getElementById('header');
if (header) {
    window.addEventListener('scroll', () => {
        // header is always visible on this page, no toggle needed
    }, { passive: true });
}

// ── Mobile menu ──────────────────────────────────────
const menuToggle = document.getElementById('menuToggle');
const navMenu    = document.getElementById('nav-menu');

function closeMobileMenu() {
    if (!navMenu || !menuToggle) return;
    navMenu.classList.remove('open');
    menuToggle.classList.remove('open');
    document.body.style.overflow = '';
}

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('open');
        menuToggle.classList.toggle('open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });
}

// Close mobile menu when a nav link is clicked
if (navMenu) {
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
}

// ── Scroll reveal ─────────────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
