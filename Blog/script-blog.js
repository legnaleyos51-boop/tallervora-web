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
 * Escanea la carpeta Blog en busca de artículos y puebla las listas de forma dinámica
 */
async function detectarArticulos() {
    const lista = document.getElementById('lista-recientes');
    if (!lista) return;

    const foundArticles = [];
    const pathParts = window.location.pathname.split('/');
    const currentFile = pathParts.pop() || 'blog.html';
    // Detecta si estamos dentro de la subcarpeta /Blog/ para ajustar rutas relativas
    const isInsideBlogFolder = pathParts.some(part => part.toLowerCase() === 'blog');
    
    const baseUrl = isInsideBlogFolder ? '' : 'Blog/';

    for (let i = 1; i <= 100; i++) {
        const num = i.toString().padStart(3, '0');
        const fileName = `articulo${num}.html`;
        const url = `${baseUrl}${fileName}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) break; 

            if (fileName === currentFile) continue;

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const title = doc.querySelector('h1')?.textContent || `Volumen ${num}`;
            
            const imgSrcAttr = doc.querySelector('.featured-image')?.getAttribute('src') || 
                               Array.from(doc.querySelectorAll('.article-container img')).find(img => !img.closest('.banner-elite-hero') && !img.closest('.banner-elite-footer'))?.getAttribute('src') || 
                               doc.querySelector('img:not(.logo-vora)')?.getAttribute('src');
            
            let imgSrc = imgSrcAttr;
            // Ajustar ruta de imagen si el script se ejecuta desde la raíz (blog.html)
            if (!isInsideBlogFolder && imgSrc && imgSrc.startsWith('../')) {
                imgSrc = imgSrc.replace('../', '');
            }

            const excerpt = doc.querySelector('.article-container p')?.textContent || "";

            // Categorización dinámica solicitada
            let category = 'otros';
            if (['001', '002', '003'].includes(num)) category = 'fundamentos';
            else if (num === '004') category = 'cronicas';

            foundArticles.push({ url, title, imgSrc, excerpt, category });
        } catch (e) { break; }
    }

    allArticles = foundArticles.reverse();
    
    // Configurar Artículo Destacado (siempre el último publicado)
    const featuredTitle = document.getElementById('featured-title');
    if (featuredTitle && allArticles.length > 0) {
        const latest = allArticles[0];
        featuredTitle.textContent = latest.title;
        if (document.getElementById('featured-excerpt')) document.getElementById('featured-excerpt').textContent = latest.excerpt.substring(0, 180) + "...";
        if (document.getElementById('featured-link')) document.getElementById('featured-link').href = latest.url;
        if (document.getElementById('featured-image-container') && latest.imgSrc) {
            document.getElementById('featured-image-container').innerHTML = `<img src="${latest.imgSrc}" alt="${latest.title}">`;
        }
    }

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
    item.innerHTML = `<a href="${art.url}">${art.imgSrc ? `<img src="${art.imgSrc}" alt="${art.title}">` : ''}<h4>${art.title}</h4></a><p>${art.excerpt.substring(0, 90)}...</p>`;
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

    if (shouldShow) setTimeout(() => { overlay.style.display = 'flex'; }, 3000);

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