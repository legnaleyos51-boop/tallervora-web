/**
 * VORA ÉLITE - SCRIPT CONSOLIDADO
 * Incluye: Lightbox con Carrusel de Puntos y Comparación de fotos dinámica.
 */

let currentIndex = 0;
let galleryImages = [];
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener("DOMContentLoaded", function() {
    // --- INICIALIZACIÓN DE GALERÍA ---
    const imagesInGallery = document.querySelectorAll('.gallery-item img');
    galleryImages = Array.from(imagesInGallery).map(img => img.src);
    
    // Crear la pista de puntos si existe el contenedor
    const dotsInner = document.getElementById('dots-inner');
    if (dotsInner) createDots();

    // --- EVENTOS DE SCROLL (COMPARACIÓN) ---
    window.addEventListener('scroll', handleComparisonScroll);

    // --- EVENTOS DE LIGHTBOX ---
    const lightboxElement = document.getElementById('lightbox');
    if (lightboxElement) {
        lightboxElement.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, {passive: true});
        
        lightboxElement.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleGesture();
        }, {passive: true});
    }
});

// --- LÓGICA DE COMPARACIÓN DINÁMICA ---
function handleComparisonScroll() {
    const section = document.getElementById('comparison-trigger');
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // --- CONFIGURACIÓN DE ACTIVACIÓN ---
    const triggerStart = windowHeight * 0.1; // Empieza cuando el top llega al 60% de la pantalla
    const triggerEnd = windowHeight * -0.12;   // Termina al llegar al 10%
    
    const startPos = 100; // Posición inicial (Abajo)
    const endPos = 20;   // Posición final (Arriba)

    // 1. SI AÚN NO LLEGA AL DISPARADOR: Mantener abajo (Evita el brinco)
    if (rect.top > triggerStart) {
        section.style.setProperty('--scroll-pos', `${startPos}%`);
        return;
    }

    // 2. SI YA PASÓ EL DISPARADOR: Calcular movimiento
    if (rect.top <= triggerStart && rect.bottom > triggerEnd) {
        // Rango de scroll efectivo
        const scrollRange = triggerStart - triggerEnd;
        const scrollCurrent = triggerStart - rect.top;
        
        let scrollFraction = scrollCurrent / scrollRange;
        
        // Limitar entre 0 y 1
        scrollFraction = Math.max(0, Math.min(1, scrollFraction));

        const currentPos = startPos - (scrollFraction * (startPos - endPos));
        section.style.setProperty('--scroll-pos', `${currentPos}%`);
    }
}












// --- LÓGICA DE LIGHTBOX ---
function createDots() {
    const container = document.getElementById('dots-inner');
    if (!container) return;
    container.innerHTML = '';
    galleryImages.forEach(() => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        container.appendChild(dot);
    });
}

function openLightbox(element) {
    const lightbox = document.getElementById('lightbox');
    const img = element.querySelector('img');
    if (lightbox && img) {
        currentIndex = galleryImages.indexOf(img.src);
        updateLightbox();
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function updateLightbox() {
    const lightboxImg = document.getElementById('lightbox-img');
    if (lightboxImg) {
        lightboxImg.style.opacity = 0; 
        updateDots(); 
        setTimeout(() => {
            lightboxImg.src = galleryImages[currentIndex];
            lightboxImg.onload = () => { lightboxImg.style.opacity = 1; };
        }, 300); // Sincronizado con el efecto rebote
    }
}

function updateDots() {
    const dotsInner = document.getElementById('dots-inner');
    const dots = document.querySelectorAll('.dot');
    if (!dotsInner || dots.length === 0) return;

    const step = 23; // Ancho punto (8) + gap (15)
    const middleIndex = (galleryImages.length - 1) / 2;
    const offset = (middleIndex - currentIndex) * step;
    
    dotsInner.style.transform = `translateX(${offset}px)`;

    dots.forEach((dot, index) => {
        dot.className = 'dot';
        const distance = Math.abs(index - currentIndex);
        if (distance === 0) dot.classList.add('active');
        else if (distance === 1) dot.classList.add('level-1');
    });
}

function nextImage(e) {
    if (e) e.stopPropagation();
    currentIndex = (currentIndex + 1) % galleryImages.length;
    updateLightbox();
}

function prevImage(e) {
    if (e) e.stopPropagation();
    currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    updateLightbox();
}

function closeLightbox(e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    if (!e || e.target.classList.contains('close-btn') || e.target === lightbox) {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function handleGesture() {
    const threshold = 50; 
    if (touchEndX < touchStartX - threshold) nextImage();
    if (touchEndX > touchStartX + threshold) prevImage();
}

document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox && lightbox.style.display === 'flex') {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextImage(e);
        if (e.key === 'ArrowLeft') prevImage(e);
    }
});











document.addEventListener('DOMContentLoaded', () => {
    // 1. Lógica del Slider
    const inputRetoque = document.getElementById('retoque-input');
    const imgAntes = document.getElementById('img-retoque-antes');
    const handle = document.getElementById('retoque-handle');

    if (inputRetoque) {
        inputRetoque.addEventListener('input', (e) => {
            let val = e.target.value;
            imgAntes.style.clipPath = `inset(0 ${100 - val}% 0 0)`;
            handle.style.left = `${val}%`;
        });
    }

    // 2. Lógica de Scroll (Línea y Puntos)
    const path = document.getElementById('path-progreso');
    const container = document.querySelector('.timeline-container');
    const puntos = document.querySelectorAll('.etapa-punto');
    const dashArray = 1000;

    const handleScroll = () => {
        const winH = window.innerHeight;
        const trigger = winH / 2;

        puntos.forEach(p => {
            if (p.getBoundingClientRect().top < trigger) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });

        if (container && path) {
            const rect = container.getBoundingClientRect();
            let progress = (trigger - rect.top) / rect.height;
            progress = Math.max(0, Math.min(1, progress));
            path.style.strokeDashoffset = dashArray - (progress * dashArray);
        }
    };

    window.addEventListener('scroll', handleScroll);
});