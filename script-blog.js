/**
 * VORA BLOG & ARTICLES - SCRIPT UNIFICADO
 */

let allArticles = [];

document.addEventListener("DOMContentLoaded", function() {
    // Detectar y listar artículos
    detectarArticulos();

    // Lógica de Popup de Suscripción (Solo se activa si los elementos existen en el DOM)
    initSubscriptionPopup();

    // Inicializar filtros de categorías
    initFilters();
});

/**
 * Comparte el artículo por WhatsApp
 */
function shareWA() {
    const url = window.location.href;
    const text = "Mira este artículo de Taller VORA: " + document.title;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, '_blank');
}

/**
 * Abre la foto del autor en tamaño completo
 */
function openAuthorPhoto(src) {
    let lightbox = document.getElementById('author-photo-lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'author-photo-lightbox';
        lightbox.className = 'author-lightbox';
        lightbox.innerHTML = '<span class="author-lightbox-close">&times;</span><img src="" alt="Author Photo">';
        lightbox.onclick = function() { 
            this.style.display = 'none'; 
            document.body.style.overflow = 'auto';
        };
        document.body.appendChild(lightbox);
    }
    lightbox.querySelector('img').src = src;
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Escanea la carpeta Blog en busca de artículos y puebla las listas de forma dinámica
 */
async function detectarArticulos() {
    const lista = document.getElementById('lista-recientes');
    if (!lista) return;

    const pathParts = window.location.pathname.split('/');
    const currentFile = pathParts.pop() || 'blog.html';
    // Detecta si estamos dentro de la subcarpeta /Blog/ para ajustar rutas relativas
    const isInsideBlogFolder = pathParts.some(part => part.toLowerCase() === 'blog');
    
    const baseUrl = isInsideBlogFolder ? '' : 'Blog/';

    // Configuración centralizada de artículos existentes y sus categorías
    const ARTICLES_CONFIG = [
        { num: '001', category: 'fundamentos' },
        { num: '002', category: 'fundamentos' },
        { num: '003', category: 'fundamentos' },
        { num: '004', category: 'cronicas' },
        { num: '005', category: 'recomendaciones' },
        { num: '006', category: 'cronicas' },
        { num: '007', category: 'opinion' },
        { num: '008', category: 'cronicas' }
    ];

    // Realizar fetch en paralelo para todos los artículos configurados
    const promises = ARTICLES_CONFIG.map(async (art) => {
        const fileName = `articulo${art.num}.html`;
        const url = `${baseUrl}${fileName}`;
        
        if (fileName === currentFile) return null;
        
        try {
            const response = await fetch(url);
            if (!response.ok) return null;

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const title = doc.querySelector('h1')?.textContent || `Volumen ${art.num}`;
            
            const imgSrcAttr = doc.querySelector('.featured-image')?.getAttribute('src') || 
                               Array.from(doc.querySelectorAll('.article-container img')).find(img => !img.closest('.banner-elite-hero') && !img.closest('.banner-elite-footer'))?.getAttribute('src') || 
                               doc.querySelector('img:not(.logo-vora)')?.getAttribute('src');
            
            let imgSrc = imgSrcAttr;
            // Ajustar ruta de imagen si el script se ejecuta desde la raíz (blog.html)
            if (!isInsideBlogFolder && imgSrc && imgSrc.startsWith('../')) {
                imgSrc = imgSrc.replace('../', '');
            }

            const excerpt = doc.querySelector('.article-container p')?.textContent || "";

            return { url, title, imgSrc, excerpt, category: art.category };
        } catch (e) {
            console.error(`Error al cargar el artículo ${art.num}:`, e);
            return null;
        }
    });

    const results = await Promise.all(promises);
    // Filtrar los nulos (artículo actual o errores de carga)
    const foundArticles = results.filter(art => art !== null);

    // Los artículos vienen en orden ascendente (001 a 008). Al hacer reverse()
    // logramos que los más recientes (008, 007...) aparezcan primero.
    allArticles = foundArticles.reverse();
    
    // Renderizar lista inicial
    renderArticlesList('all');
}

/**
 * Renderiza la lista de artículos según la categoría seleccionada
 */
function renderArticlesList(category) {
    const lista = document.getElementById('lista-recientes');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    const articlesToDisplay = category === 'all' 
        ? allArticles 
        : allArticles.filter(art => art.category === category);

    if (articlesToDisplay.length === 0) {
        lista.innerHTML = '<p style="grid-column: 1/-1; color: #666; font-style: italic; text-align: center; width: 100%; padding: 40px 0;">No hay artículos en esta categoría por ahora.</p>';
        return;
    }

    articlesToDisplay.forEach(art => renderArticleItem(art, lista));
}

function renderArticleItem(art, container) {
    const item = document.createElement('div');
    item.className = 'sidebar-item';
    item.innerHTML = `<a href="${art.url}" class="item-link-img">${art.imgSrc ? `<img src="${art.imgSrc}" alt="${art.title}">` : ''}</a><div class="item-text-content"><a href="${art.url}"><h4>${art.title}</h4></a><p>${art.excerpt.substring(0, 160)}...</p></div>`;
    container.appendChild(item);
}

function initFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderArticlesList(btn.dataset.category);
        });
    });
}

function initSubscriptionPopup() {
    const POPUP_ID = 'vora_blog_popup_closed';
    const overlay = document.getElementById('blog-popup-overlay');
    if (!overlay) return;

    const lastShown = localStorage.getItem(POPUP_ID);
    const shouldShow = !lastShown || (new Date().getTime() - lastShown) > (30 * 24 * 60 * 60 * 1000);

    if (shouldShow) setTimeout(() => { overlay.style.display = 'flex'; }, 15000);

    document.getElementById('close-popup-btn')?.addEventListener('click', () => { overlay.style.display = 'none'; localStorage.setItem(POPUP_ID, new Date().getTime()); });
    
    const subForm = document.getElementById('sib-form');
    subForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await fetch(subForm.getAttribute('action'), { method: 'POST', body: new FormData(subForm), mode: 'no-cors' });
            subForm.style.display = 'none';
            if (document.getElementById('popup-success-msg')) document.getElementById('popup-success-msg').style.display = 'block';
            localStorage.setItem(POPUP_ID, new Date().getTime());
        } catch (error) { console.error('Error:', error); }
    });
}