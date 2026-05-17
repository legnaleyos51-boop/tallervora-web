/**
 * VORA ÉLITE - SCRIPT CONSOLIDADO
 * Incluye: Lightbox con Carrusel de Puntos y Comparación de fotos dinámica.
 */

/**
 * PARÁMETROS DE CONFIGURACIÓN DE LA GALERÍA
 * Modifica estos valores para controlar el diseño del mosaico y el encuadre de las fotos.
 */
const GALLERY_SETTINGS = {
    maxImages: 50, // Cuántas fotos intentar cargar (poster_001... poster_050)
    // Patrón repetitivo para el diseño Bento: 'large' (2x2), 'tall' (1x2), 'wide' (2x1), '' (1x1)
    layoutPattern: ['large', 'tall', '', '', 'wide', 'tall', ''],
    // Ajustes manuales de TAMAÑO por ID de imagen (número de poster)
    specificLayouts: {
        '001': 'large', 
    },
    // Ajustes manuales de ENCUADRE (object-position) por ID de imagen
    // Útil si una foto sale "decapitada" o mal centrada en el mosaico.
    specificPositions: {
        '001': 'center 20%', // Valores CSS: 'top', 'bottom', 'center 20%', etc.
        '002': '20% center', // Valores CSS: 'top', 'bottom', 'center 20%', etc.
        '003': 'center 20%', // Valores CSS: 'top', 'bottom', 'center 20%', etc.
        '005': 'center 39%', // Valores CSS: 'top', 'bottom', 'center 20%', etc.
    }
};

let currentIndex = 0;
let galleryImages = [];
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener("DOMContentLoaded", function() {
    // 1. INICIALIZACIÓN DE GALERÍA
    cargarGaleriaDinamica();
    

    // 2. EVENTOS DE SCROLL (COMPARACIÓN)
    window.addEventListener('scroll', handleComparisonScroll);

    // 3. EVENTOS DE LIGHTBOX
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

    // 4. INICIALIZACIÓN DE BANNER PERSUASIVO
    if (window.location.pathname.includes('galeriadeportiva')) {
        injectPersuasiveBanners();
    }

    // 5. INICIALIZACIÓN DE BÚSQUEDA DE CONVENIOS
    const searchBtn = document.getElementById('btn-verify-club');
    const searchInput = document.getElementById('club-search-input');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', verifyClub);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyClub();
            }
        });
    }

    // 6. LÓGICA DEL SLIDER (RETOQUE)
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

    // 7. LÓGICA DE MODALES (BIFURCACIÓN)
    const modalBif = document.getElementById('modal-bifurcacion');
    const btnAbrirBif = document.getElementById('btn-abrir-modal');
    const btnCerrarBif = document.getElementById('btn-cerrar-modal');

    if (btnAbrirBif && modalBif && btnCerrarBif) {
        btnAbrirBif.addEventListener('click', () => {
            modalBif.style.display = "flex";
            document.body.style.overflow = "hidden";
        });

        btnCerrarBif.addEventListener('click', () => {
            modalBif.style.display = "none";
            document.body.style.overflow = "auto";
        });

        window.addEventListener('click', (event) => {
            if (event.target === modalBif) {
                modalBif.style.display = "none";
                document.body.style.overflow = "auto";
            }
        });
    }

    // 8. LÓGICA DE TIMELINE (PROGRESO)
    window.addEventListener('scroll', handleTimelineScroll);
});

/**
 * Escanea la carpeta assets/Galeria/ en busca de poster_NNN.webp
 * y construye el bento-grid dinámicamente.
 */
async function cargarGaleriaDinamica() {
    const galleryContainer = document.getElementById('gallery');
    if (!galleryContainer) return;

    const imagesFound = [];
    
    galleryContainer.innerHTML = '<p style="grid-column: 1/-1; color: #4cd78f;">Cargando Galería Élite...</p>';

    for (let i = 1; i <= GALLERY_SETTINGS.maxImages; i++) {
        const num = i.toString().padStart(3, '0');
        const url = `assets/Galeria/poster_${num}.webp`;

        try {
            const response = await fetch(url, { method: 'HEAD' });
            if (!response.ok) break;

            // Determinar clase de tamaño (Bento)
            const itemClass = GALLERY_SETTINGS.specificLayouts[num] || 
                              GALLERY_SETTINGS.layoutPattern[(i - 1) % GALLERY_SETTINGS.layoutPattern.length];
            
            // Determinar posición de encuadre (Object Position)
            const objectPos = GALLERY_SETTINGS.specificPositions[num] || 'center';

            const itemHTML = `
                <div class="gallery-item ${itemClass}" onclick="openLightbox(this)">
                    <img src="${url}" alt="Trabajo VORA ${num}" style="object-position: ${objectPos}">
                    <div class="overlay"><i class="expand-icon">+</i></div>
                </div>
            `;
            imagesFound.push(url);
            if (i === 1) galleryContainer.innerHTML = ''; // Limpiar mensaje de carga al hallar la primera
            galleryContainer.insertAdjacentHTML('beforeend', itemHTML);
        } catch (e) { break; }
    }

    galleryImages = imagesFound;
    if (document.getElementById('dots-inner')) createDots();
}

/**
 * Inyecta el banner persuasivo tanto en la página como en el Lightbox
 */
function injectPersuasiveBanners() {
    const bannerHTML = `
        <div class="persuasive-banner">
            <p>El esfuerzo no solo se entrena, se inmortaliza.</p>
            <a href="fotografiadeportiva.html" class="btn-inmortaliza">Inmortaliza tu juego</a>
        </div>
    `;

    // 1. Inyectar al final de la sección de galería
    const gallerySection = document.querySelector('.gallery-section');
    if (gallerySection) {
        gallerySection.insertAdjacentHTML('beforeend', bannerHTML);
    }

    // 2. Inyectar dentro del Lightbox (estará oculto hasta que se abra el lightbox)
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.insertAdjacentHTML('beforeend', bannerHTML);
    }
}

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
        // Usamos getAttribute('src') para obtener la ruta relativa exacta
        // y que coincida con lo guardado en el arreglo galleryImages
        const src = img.getAttribute('src');
        currentIndex = galleryImages.indexOf(src);
        if (currentIndex === -1) currentIndex = 0; // Fallback al primero si no hay coincidencia
        
        updateLightbox();
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function updateLightbox() {
    const lightboxImg = document.getElementById('lightbox-img');
    const downloadBtn = document.getElementById('download-btn');
    if (lightboxImg) {
        lightboxImg.style.opacity = 0; 
        updateDots(); 
        setTimeout(() => {
            const currentSrc = galleryImages[currentIndex];
            if (!currentSrc) return;
            
            // Preparamos el evento de carga
            lightboxImg.onload = () => { lightboxImg.style.opacity = 1; };
            lightboxImg.onerror = () => { 
                console.error("No se pudo cargar la imagen:", currentSrc);
                lightboxImg.style.opacity = 1; // Mostramos aunque sea el alt/error
            };
            
            lightboxImg.src = currentSrc;

            // Si la imagen ya está en caché, el onload podría no dispararse en algunos navegadores
            if (lightboxImg.complete) {
                lightboxImg.style.opacity = 1;
            }

            // Actualizar link de descarga si el botón existe
            if (downloadBtn) {
                downloadBtn.href = currentSrc;
                downloadBtn.style.display = 'inline-block';
            }
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











function handleTimelineScroll() {
    const path = document.getElementById('path-progreso');
    const container = document.querySelector('.timeline-container');
    const puntos = document.querySelectorAll('.etapa-punto');
    const dashArray = 1000;
    const winH = window.innerHeight;
    const trigger = winH / 2;

    puntos.forEach(p => {
        if (p.getBoundingClientRect().top < trigger) p.classList.add('active');
        else p.classList.remove('active');
    });

    if (container && path) {
        const rect = container.getBoundingClientRect();
        let progress = (trigger - rect.top) / rect.height;
        progress = Math.max(0, Math.min(1, progress));
        path.style.strokeDashoffset = dashArray - (progress * dashArray);
    }
}

/**
 * LÓGICA MODAL INFORMATIVO ACABADOS
 */
const finishData = {
    papel: {
        title: "Calidad de Exhibición <br> Tradicional y Atemporal.",
        points: [
            "<strong>Soporte Profesional:</strong> Papel fotográfico de alto gramaje con recubrimiento especial para tintas de pigmento.",
            "<strong>Acabado Mate:</strong> Laminado protector que elimina brillos y protege la imagen de huellas y rayos UV.",
            "<strong>Versatilidad:</strong> Ideal para ser montado en marcos con vidrio o sobre bastidores rígidos.",
            "<strong>Resolución Extrema:</strong> Máximo detalle en texturas y fidelidad de color en cada impresión."
        ],
        variantClass: "papel-variant",
        imgSrc: "assets/poster_papel.webp"
    },
    poliestireno: {
        title: "Elegancia minimalista <br> para capturar su historia.",
        points: [
            "<strong>Estructura ultraligera y resistente::</strong> Su composición técnica ofrece una base rígida de alta durabilidad con un peso mínimo, ideal para instalar fácilmente en cualquier tipo de pared sin necesidad de soportes complejos.",
            "<strong>Perfil moderno con canto negro mate:</strong> El núcleo de poliestireno expone un borde negro pulido y minimalista que enmarca el arte cinemático, logrando un acabado limpio de estilo galería contemporánea.",
            "<strong>Efecto de Montaje:</strong> Incluye bastidor posterior de madera para un sistema de colgado 'flotante'."
        ],
        variantClass: "alucobond-variant",
        imgSrc: "assets/poster_poliestireno.webp"
    },
    alucobond: {
        title: "Un legado visual <br>diseñado para ser inmortal.",
       points: [
            "<strong>Composición Estructural:</strong> Núcleo de polietileno de baja densidad acoplado entre dos láminas de aluminio de 0.3 mm.",
            "<strong>Acabado Visual:</strong> Impresión fotográfica profesional con laminado protector UV que elimina reflejos molestos.",
            "<strong>Estabilidad:</strong> Panel de alta rigidez que garantiza una superficie 100% plana, inmune a deformaciones por humedad.",
            "<strong>Efecto de Montaje:</strong> Incluye bastidor posterior de madera para un sistema de colgado 'flotante'."
        ],
        variantClass: "chromaluxe-variant",
        imgSrc: "assets/poster_alucobond.webp"
    }
};

function openInfoModal(type) {
    const modal = document.getElementById('info-modal');
    const container = document.getElementById('info-modal-container');
    const title = document.getElementById('info-modal-title');
    const pointsList = document.getElementById('info-modal-points');
    const modalImg = document.getElementById('info-modal-img');
    
    const data = finishData[type];

    if (modal && data) {
        title.innerHTML = data.title;
        pointsList.innerHTML = data.points.map(p => `<li>${p}</li>`).join('');
        if (modalImg && data.imgSrc) modalImg.src = data.imgSrc;
        
        container.className = 'info-modal-content ' + data.variantClass;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeInfoModal(e) {
    document.getElementById('info-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

/**
 * Función robusta para copiar al portapapeles (Compatible con móvil/no-HTTPS)
 */
function executeCopy(text, btn) {
    const originalContent = btn.innerHTML;
    const successCallback = () => {
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<span class="material-icons" style="font-size: 1.2rem;">check</span> ¡COPIADO!';
        btn.style.color = "var(--neon-green)";
        btn.style.borderColor = "var(--neon-green)";
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.style.color = "";
            btn.style.borderColor = "";
        }, 2000);
    };

    // Intentar API moderna
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(successCallback).catch(() => fallbackCopy(text, successCallback));
    } else {
        // Fallback para móvil/desarrollo local
        fallbackCopy(text, successCallback);
    }
}

function fallbackCopy(text, callback) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; // Evitar scroll
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        if (document.execCommand('copy')) callback();
    } catch (err) {
        console.error('Error en el fallback de copiado:', err);
    }
    document.body.removeChild(textArea);
}

function copyBaseProposal(btn) {
    const text = "¡Hola a todos! 🏆 Como parte de nuestro compromiso con el crecimiento de nuestros atletas, hemos concretado una alianza con Taller VORA para elevar su imagen deportiva.";
    executeCopy(text, btn);
}

function copyBaseProposal2(btn) {
    const text = "Hola Profe, ¿cómo está? Mire que me encontré con esta marca, se llama VORA y me pareció muy interesante lo que hacen con las fotos de los chicos. Sé que tienen unos beneficios súper buenos para los padres cuando el club tiene convenio con ellos. Ojalá los pudiera conocer y mirar si se puede cuadrar algo para que nosotros podamos acceder a esos beneficios. ¡Le encargo si les puede echar un ojo! la pagina es tallervora.com/fotografiadeportiva.html#clubes";
    executeCopy(text, btn);
}

/**
 * Abre WhatsApp para compartir la propuesta base con un contacto
 */
function shareViaWhatsApp() {
    const text = "Hola Profe, ¿cómo está? Mire que me encontré con esta marca, se llama VORA y me pareció muy interesante lo que hacen con las fotos de los chicos. Sé que tienen unos beneficios súper buenos para los padres cuando el club tiene convenio con ellos. Ojalá los pudiera conocer y mirar si se puede cuadrar algo para que nosotros podamos acceder a esos beneficios. ¡Le encargo si les puede echar un ojo! la pagina es tallervora.com/fotografiadeportiva.html#clubes";
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
}

function copyPortalLink(btn) {
    const text = "https://www.tallervora.com/alianzas_padres.html";
    executeCopy(text, btn);
}

function openAficheGallery() {
    const aficheItems = document.querySelectorAll('#afiche-gallery-items .gallery-item img');
    if (aficheItems.length > 0) {
        // Poblar el array global galleryImages con las rutas de los afiches
        galleryImages = Array.from(aficheItems).map(img => img.getAttribute('src'));
        
        // Actualizar los puntos de navegación para que coincidan con la cantidad de afiches
        createDots();

        const firstAfiche = document.querySelector('#afiche-gallery-items .gallery-item');
        if (firstAfiche) openLightbox(firstAfiche);
    }
}

/**
 * LÓGICA DE BÚSQUEDA DE CONVENIOS
 */
const conveniosActivos = [
    { 
        nombre: "Club Deportivo Elites", 
        whatsappUrl: "https://chat.whatsapp.com/KXVCZICQecmLVLKtdNB2WY",
        mensajePersonalizado: "¡Convenio Detectado!"
    },
    { 
        nombre: "Academia Real Bogota", 
        whatsappUrl: "https://chat.whatsapp.com/KXVCZICQecmLVLKtdNB2WY",
        mensajePersonalizado: "¡Convenio Detectado!"
    },
    { 
        nombre: "test 01", 
        whatsappUrl: "https://chat.whatsapp.com/KXVCZICQecmLVLKtdNB2WY",
        mensajePersonalizado: "¡Convenio Detectado!"
    }
];

function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function verifyClub() {
    const input = document.getElementById('club-search-input');
    const resultsContainer = document.getElementById('search-results-container');
    
    if (!input || !resultsContainer) return;

    if (!input.value.trim()) {
        resultsContainer.innerHTML = '<p style="color: #ff5500; font-weight: 700;">POR FAVOR, INGRESA EL NOMBRE DE TU CLUB.</p>';
        return;
    }
    
    const query = normalizeString(input.value);

    // Efecto de carga
    resultsContainer.innerHTML = `
        <div class="loading-spinner"></div>
        <p style="color: var(--neon-green); font-weight: 700;">VERIFICANDO...</p>
    `;

    setTimeout(() => {
        const match = conveniosActivos.find(c => normalizeString(c.nombre).includes(query));

        if (match) {
            resultsContainer.innerHTML = `
                <p class="status-msg" style="color: var(--neon-orange); font-size: 1.5rem; font-weight: 900; margin-bottom: 25px;">${match.mensajePersonalizado}</p>
                <a href="${match.whatsappUrl}" class="btn-orange-search" target="_blank">
                    <i class="fab fa-whatsapp"></i> UNIRSE AL GRUPO VIP
                </a>
            `;
        } else {
            resultsContainer.innerHTML = `
                <p class="status-msg" style="color: #fff; font-size: 1.2rem; margin-bottom: 25px;">Tu escuela aún no cuenta con los beneficios de VORA</p>
                <a href="padres-a-escuelas.html" class="btn-ambassador">
                    Presentar VORA a mi club
                </a>
            `;
        }
    }, 1000);
}
