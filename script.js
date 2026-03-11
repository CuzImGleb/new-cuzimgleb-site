/* ===================================================
   CuzImGleb – script.js  |  2026 Rewrite
   =================================================== */

// ── Loader ──────────────────────────────────────────
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hidden');
    }, 1500);
});

// ── Header scroll effect ─────────────────────────────
const header = document.getElementById('header');
function handleScroll() {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
}
window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll();

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

// ── Smooth scroll for nav links ──────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        const id = link.getAttribute('href');
        if (!id || id === '#') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            closeMobileMenu();
            return;
        }
        const target = document.querySelector(id);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
            closeMobileMenu();
        }
    });
});

// ── Back to top (logo & backHomepage btn) ────────────
const logoLink = document.getElementById('logoLink');
if (logoLink) {
    logoLink.addEventListener('click', e => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
const backHomepage = document.getElementById('backHomepage');
if (backHomepage) {
    backHomepage.addEventListener('click', e => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Remove hash from URL on load ─────────────────────
if (window.location.hash) {
    history.replaceState(null, null, window.location.pathname);
}
