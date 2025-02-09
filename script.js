let currentIndex = 0;
let slideInterval;
let startX = 0;
let endX = 0;

// Main Page + Buttons + Transition

window.onload = function () {
    // Entfernt den Anker (z. B. #about, #projects) aus der URL
    if (window.location.hash) {
        history.replaceState(null, null, window.location.pathname);
    }

    // Scrollt nach oben
    window.scrollTo({
        top: 0,
        behavior: "smooth" // Sofortiges Hochscrollen (alternativ "smooth" für sanftes Scrollen)
    });
};

document.getElementById("scrollToTop").addEventListener("click", function(event) {
    event.preventDefault(); // Verhindert das Neuladen der Seite
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

document.addEventListener("DOMContentLoaded", function () {
    function scrollToTop(event) {
        event.preventDefault(); // Verhindert das Neuladen der Seite
        window.scrollTo({
            top: 0,
            behavior: "smooth" // Sanfter Scroll-Effekt
        });
    }

    // Event-Listener für das Logo
    document.querySelector(".logo").addEventListener("click", scrollToTop);

    // Event-Listener für den Home-Button
    document.getElementById("scrollToTop").addEventListener("click", scrollToTop);
    
    // Event-Listener für den Home-Button
    document.getElementById("backHomepage").addEventListener("click", scrollToTop);
});

// Mobile UI

function toggleMenu() {
    var menu = document.getElementById('nav-menu');
    var toggleButton = document.querySelector('.menu-toggle i');

    // Menü umschalten
    menu.classList.toggle('show');

    // Icon umschalten
    if (menu.classList.contains('show')) {
        toggleButton.classList.replace('fa-bars', 'fa-times'); // Hamburger → X
    } else {
        toggleButton.classList.replace('fa-times', 'fa-bars'); // X → Hamburger
    }
}

// Schließt das Menü, wenn ein Link angeklickt wird
document.querySelectorAll('.nav-list a').forEach(link => {
    link.addEventListener('click', () => {
        var menu = document.getElementById('nav-menu');
        var toggleButton = document.querySelector('.menu-toggle i');

        if (menu.classList.contains('show')) { // Nur wenn Menü offen ist
            menu.classList.remove('show'); // Menü schließen
        }
        
        // Icon immer zurücksetzen auf Hamburger
        toggleButton.classList.replace('fa-times', 'fa-bars');
    });
});

// URL Modify

document.querySelector(".btn").addEventListener("click", function(event) {
    event.preventDefault(); // Verhindert das Setzen von #about in der URL
    document.getElementById("about").scrollIntoView({
        behavior: "smooth"
    });
});

document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(event) {
        event.preventDefault(); // Verhindert, dass `#id` in die URL kommt
        const targetId = this.getAttribute("href").substring(1); 
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: "smooth"
            });
        }
    });
});

// Projekte Funktion

function showSlide(index) {
    const slides = document.querySelector('.slides');
    const dots = document.querySelectorAll('.dot');
    const totalSlides = dots.length;

    if (index >= totalSlides) {
        currentIndex = 0;
    } else if (index < 0) {
        currentIndex = totalSlides - 1;
    } else {
        currentIndex = index;
    }

    slides.style.transform = `translateX(-${currentIndex * 100}%)`;

    dots.forEach(dot => dot.classList.remove('active'));
    dots[currentIndex].classList.add('active');

    resetAutoSlide();
}

function nextSlide() {
    showSlide(currentIndex + 1);
}

function prevSlide() {
    showSlide(currentIndex - 1);
}

function currentSlide(index) {
    showSlide(index - 1);
}

function startAutoSlide() {
    stopAutoSlide();
    slideInterval = setInterval(() => {
        nextSlide();
    }, 5000);
}

function stopAutoSlide() {
    clearInterval(slideInterval);
}

function resetAutoSlide() {
    stopAutoSlide();
    startAutoSlide();
}

// Touch Event Handling für mobiles Swipen
function handleTouchStart(event) {
    startX = event.touches[0].clientX;
}

function handleTouchMove(event) {
    endX = event.touches[0].clientX;
}

function handleTouchEnd() {
    const diffX = startX - endX;
    if (diffX > 50) {
        nextSlide(); // Nach links wischen -> nächste Slide
    } else if (diffX < -50) {
        prevSlide(); // Nach rechts wischen -> vorherige Slide
    }
}

document.addEventListener('DOMContentLoaded', () => {
    showSlide(0);
    startAutoSlide();

    const slider = document.querySelector('.slider');

    slider.addEventListener('mouseenter', stopAutoSlide);
    slider.addEventListener('mouseleave', startAutoSlide);

    document.querySelectorAll('.slide img, .slide p, .prev, .next').forEach(element => {
        element.addEventListener('mouseenter', stopAutoSlide);
        element.addEventListener('mouseleave', startAutoSlide);
    });

    document.querySelector('.prev').addEventListener('click', resetAutoSlide);
    document.querySelector('.next').addEventListener('click', resetAutoSlide);
    document.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', resetAutoSlide);
    });

    // Touch Events für mobile Geräte
    slider.addEventListener('touchstart', handleTouchStart, false);
    slider.addEventListener('touchmove', handleTouchMove, false);
    slider.addEventListener('touchend', handleTouchEnd, false);
});
