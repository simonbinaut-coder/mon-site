// ==============================
// CHARGEMENT DYNAMIQUE DES PAGES
// ==============================
function loadPage(page) {
  const content = document.getElementById('content');
  content.style.opacity = '0';
  setTimeout(() => {
    fetch(`pages/${page}.html?t=${Date.now()}`)
      .then(r => r.ok ? r.text() : "<p>Page introuvable.</p>")
      .then(html => {
        content.innerHTML = html;
        setActiveLink(page);
        setTimeout(() => content.style.opacity = '1', 50);
        // Initialise les pages
        if (page === 'insta') loadElfsightScript();
        if (page === 'temoignages') setupTemoignages();
        if (page === 'contact') setupContactForm();
        if (page === 'about') loadAboutText();
        if (page === 'functionnal_patterns') loadFunctionalPatternsText();
      });
  }, 300);
}

// Active le lien du menu
function setActiveLink(page) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${page}`);
  });
}

// Gestion du hash URL
function handleHashChange() {
  const page = location.hash.replace('#', '') || 'home';
  loadPage(page);
}

// Fonction pour pré-charger les témoignages et construire le sous-menu
async function preloadTemoignagesSubmenu() {
  try {
    const submenu = document.querySelector('#menu-temoignages .submenu');
    if (!submenu) return;

    const response = await fetch('content/temoignages.json?t=' + Date.now());
    if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
    const txtFiles = await response.json();

    // Charge uniquement les métadonnées nécessaires pour le sous-menu
    const temoignages = await Promise.all(
      txtFiles.map(async file => {
        try {
          const r = await fetch(`content/temoignages/${file}?t=${Date.now()}`);
          if (!r.ok) throw new Error(`Erreur HTTP : ${r.status}`);
          const text = await r.text();

          const get = name => {
            const m = text.match(new RegExp(`\\[${name}\\]\\s*([\\s\\S]*?)(?=\\[|$)`));
            return m ? m[1].trim() : "";
          };

          return {
            id: file.replace('.txt', ''),
            douleur: get("Douleur")
          };
        } catch (e) {
          console.error(`Erreur dans ${file} :`, e);
          return null;
        }
      })
    );

    const temoignagesValides = temoignages.filter(t => t !== null && t.douleur);
    if (temoignagesValides.length === 0) {
      console.error("Aucun témoignage valide pour le sous-menu.");
      return;
    }

    // Met à jour le sous-menu
    submenu.innerHTML = temoignagesValides.map(t =>
      `<li><a href="#temoignages" data-id="${t.id}">${t.douleur}</a></li>`
    ).join('');

    // Ajoute les écouteurs d'événements
    submenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const id = a.dataset.id;
        window.temoignageToShow = id;
        location.hash = '#temoignages';
        navLinks.classList.remove('show');
        burger.classList.remove('toggle');
      });
    });
  } catch (e) {
    console.error("Erreur lors du pré-chargement des témoignages :", e);
  }
}

// ==============================
// INITIALISATION GLOBALE
// ==============================
window.addEventListener('DOMContentLoaded', () => {
  preloadTemoignagesSubmenu();  // Précharge le sous-menu des témoignages
  handleHashChange();
});

// Hash change listener
window.addEventListener('hashchange', handleHashChange);

// ==============================
// INSTAGRAM
// ==============================
function loadElfsightScript() {
  if (!window.elfsightLoaded) {
    const script = document.createElement('script');
    script.src = 'https://static.elfsight.com/platform/platform.js';
    script.async = true;
    document.body.appendChild(script);
    window.elfsightLoaded = true;
  }
}

// ==============================
// FORMULAIRE CONTACT
// ==============================
function setupContactForm() {
  const btn = document.getElementById('submit-btn');
  if (!btn) return;
  btn.onclick = (e) => {
    e.preventDefault();
    const form = document.getElementById('contact-form');
    const data = new FormData(form);
    fetch("https://formspree.io/f/movlbbbd", {
      method: "POST",
      body: data,
      headers: { "Accept": "application/json" }
    })
    .then(r => {
      if (r.ok) {
        alert("Merci ! Votre message a été envoyé.");
        form.reset();
      } else {
        alert("Erreur, veuillez réessayer.");
      }
    })
    .catch(() => alert("Erreur réseau."));
  };
}

// ==============================
// SCROLL HERO
// ==============================
window.addEventListener('scroll', function() {
  const hero = document.querySelector('.hero-section');
  if (hero) {
    const scrollPosition = window.scrollY;
    const offset = scrollPosition * 0.15; // facteur léger
    hero.style.backgroundPosition = `center ${-offset}px`;
  }
});

// ==============================
// TÉMOIGNAGES
// ==============================
async function setupTemoignages() {
  try {
    const containerMobile = document.querySelector('.temoignages-mobile');
    const submenu = document.querySelector('#menu-temoignages .submenu');
    if (!containerMobile || !submenu) {
      console.error("Conteneurs introuvables dans le DOM.");
      return;
    }

    // Charge la liste des fichiers
    const response = await fetch('content/temoignages.json?t=' + Date.now());
    if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
    const txtFiles = await response.json();
    console.log("Fichiers à charger :", txtFiles);

    // Charge chaque fichier
    const temoignages = await Promise.all(
      txtFiles.map(async file => {
        try {
          const r = await fetch(`content/temoignages/${file}?t=${Date.now()}`);
          if (!r.ok) throw new Error(`Erreur HTTP : ${r.status}`);
          const text = await r.text();
          const get = name => {
            const m = text.match(new RegExp(`\\[${name}\\]\\s*([\\s\\S]*?)(?=\\[|$)`));
            return m ? m[1].trim() : "";
          };
          const temoignage = {
            id: file.replace('.txt', ''),
            titre: get("Titre"),
            texte: get("Texte"),
            image: get("Image"),
            douleur: get("Douleur"),
            signature: get("Signature")
          };
          if (!temoignage.titre || !temoignage.texte || !temoignage.douleur) {
            console.warn(`Témoignage incomplet dans ${file} :`, temoignage);
            return null;
          }
          return temoignage;
        } catch (e) {
          console.error(`Erreur dans ${file} :`, e);
          return null;
        }
      })
    );

    const temoignagesValides = temoignages.filter(t => t !== null);
    if (temoignagesValides.length === 0) {
      console.error("Aucun témoignage valide.");
      return;
    }

    // Met à jour le sous-menu
    submenu.innerHTML = temoignagesValides.map(t =>
      `<li><a href="#temoignages" data-id="${t.id}">${t.douleur}</a></li>`
    ).join('');

    // Ajoute les écouteurs d'événements pour le sous-menu
    submenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const id = a.dataset.id;
        window.temoignageToShow = id;
        if (location.hash === '#temoignages') {
          if (typeof window.showTemoignage === "function") {
            window.showTemoignage(id);
          }
        } else {
          location.hash = '#temoignages';
        }
        navLinks.classList.remove('show');
        burger.classList.remove('toggle');
      });
    });

    // Met à jour le HTML pour mobile (et PC)
    containerMobile.innerHTML = temoignagesValides.map(t => `
    <div id="mobile-${t.id}" class="temoignage">
      <div class="container">
        <img src="images/${t.image}" alt="${t.titre}" onerror="this.style.display='none'">
        <h3>${t.titre}</h3>
        <p>${t.texte}</p>
        ${t.signature ? `<p class="temoignage-signature">${t.signature}</p>` : ''}
      </div>
    </div>
  `).join('');

    // Fonction pour afficher un témoignage
    window.showTemoignage = function(id) {
      // 1. Active le témoignage correspondant
      document.querySelectorAll('.temoignages-mobile .temoignage').forEach(c => c.classList.remove('active'));
      const mobileCard = document.getElementById(`mobile-${id}`);
      if (mobileCard) mobileCard.classList.add('active');

      // 2. Met à jour le nom de la douleur
      const temoignage = temoignagesValides.find(t => t.id === id);
      const titreDouleur = document.getElementById('temoignage-douleur');
      if (titreDouleur && temoignage) {
        titreDouleur.textContent = temoignage.douleur;
      }
    };

    // Affiche le témoignage sélectionné ou le premier par défaut
    if (window.temoignageToShow) {
      window.showTemoignage(window.temoignageToShow);
      window.temoignageToShow = null;
    } else {
      window.showTemoignage(temoignagesValides[0].id);
    }
  } catch (e) {
    console.error("Erreur dans setupTemoignages :", e);
  }
}

// ==============================
// BURGER MOBILE
// ==============================
const burger = document.getElementById('burger');
const navLinks = document.getElementById('nav-links');
burger.addEventListener('click', () => {
  navLinks.classList.toggle('show');
  burger.classList.toggle('toggle');
});
// Quand on clique sur un lien → fermer
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('show');
    burger.classList.remove('toggle');
  });
});

// ==============================
// ABOUT
// ==============================
function loadAboutText() {
  fetch('content/about.txt?t=' + Date.now())
    .then(r => r.text())
    .then(text => {
      const get = name => {
        const m = text.match(new RegExp(`\\[${name}\\]\\s*([\\s\\S]*?)(?=\\[|$)`));
        return m ? m[1].trim() : "";
      };
      document.getElementById('about-text-en').innerHTML = get("EN").replace(/\n/g, '<br>');
      document.getElementById('about-text-fr').innerHTML = get("FR").replace(/\n/g, '<br>');
    });
}

// ==============================
// FUNCTIONAL PATTERNS
// ==============================
function loadFunctionalPatternsText() {
  fetch('content/fp.txt?t=' + Date.now())
    .then(r => r.text())
    .then(text => {
      document.getElementById('fp-text').innerHTML = text.replace(/\n/g, '<br>');
    });
}
