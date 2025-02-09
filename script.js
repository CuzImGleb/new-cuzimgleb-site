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

function toggleMenu() {
    var menu = document.getElementById('nav-menu');
    menu.classList.toggle('active');
}

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