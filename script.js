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
});

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