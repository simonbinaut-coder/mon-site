// ==============================
// VARIABLES GLOBALES
// ==============================

// Mapping fichier -> nom affiché dans le sous-menu
const menuNames = {
  resultats: "Mes résultats",
  bea: "Hyperlaxité / Hypermobility",
  emma: "Douleurs hanche / Hip pain",
  marvin: "Mal de dos / Back pain",
  brice: "Genou douloureux / Knee pain",
  garance: "Hallux Valgus",
  elodie: "Pectus Excavatum",
  philippe: "Renforcement général / General strength training",
  carina: "Douleurs cervicales / Neck pain",
  melanie: "Réalignement structure / Structure optimisation",
  noemie: "Scoliose / Scoliosis"
};

// Liste des fichiers de témoignages
const ids = [
  'resultats','bea','emma','marvin','brice',
  'garance','elodie','philippe','carina','melanie','noemie'
];

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

// ==============================
// INITIALISATION GLOBALE
// ==============================
window.addEventListener('DOMContentLoaded', () => {
  buildTemoignagesSubmenu();   // IMPORTANT : construit le sous-menu AVANT usage
  handleHashChange();
});

// Hash change listener
window.addEventListener('hashchange', handleHashChange);

// ==============================
// SOUS-MENU TEMOIGNAGES (NAV)
// ==============================
function buildTemoignagesSubmenu() {
  const menu = document.querySelector('#menu-temoignages .submenu');
  if (!menu) return;

  menu.innerHTML = ids.map(id =>
    `<li><a href="#" data-id="${id}">${menuNames[id]}</a></li>`
  ).join('');

  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const id = a.dataset.id;

      if (location.hash === '#temoignages') {
        // Déjà sur la page → afficher immédiatement
        if (typeof window.showTemoignage === "function") {
          window.showTemoignage(id);
        } else {
          window.temoignageToShow = id;
        }
      } else {
        // On change de page
        window.temoignageToShow = id;
        location.hash = '#temoignages';
      }

      // Ferme le menu mobile
      navLinks.classList.remove('show');
      burger.classList.remove('toggle');
    });
  });
}

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
window.addEventListener("scroll", () => {
  const hero = document.querySelector(".hero-section");
  if (!hero) return;

  const offset = Math.min(window.scrollY * 0.5, 150);
  hero.style.backgroundPosition = `center ${-50 + offset}px`;
});

// ==============================
// TÉMOIGNAGES
// ==============================
async function setupTemoignages() {

  const containerDesktop = document.querySelector('.temoignages-container');
  const containerMobile = document.querySelector('.temoignages-mobile');

  // Charger fichiers
  const temoignages = await Promise.all(ids.map(async id => {
    const r = await fetch(`content/temoignages/${id}.txt?t=${Date.now()}`);
    const text = await r.text();

    const get = name => {
      const m = text.match(new RegExp(`\\[${name}\\]\\s*([\\s\\S]*?)(?=\\[|$)`));
      return m ? m[1].trim() : "";
    };

    return {
      id,
      titre: get("Titre"),
      texte: get("Texte"),
      image: get("Image")
    };
  }));

  // HTML Desktop
  containerDesktop.innerHTML = temoignages.map(t => `
    <div id="${t.id}" class="temoignage-card">
      <div class="card-content">
        <div class="card-image-container">
          <img src="images/${t.image}" alt="${t.titre}" onerror="this.style.display='none'">
        </div>
        <div class="card-text-container">
          <h3>${t.titre}</h3>
          <p>${t.texte}</p>
          <button class="read-more-btn">Lire plus</button>
        </div>
      </div>
    </div>
  `).join('');

  // HTML Mobile
  containerMobile.innerHTML = temoignages.map(t => `
    <div id="mobile-${t.id}" class="temoignage">
      <img src="images/${t.image}" alt="${t.titre}" onerror="this.style.display='none'">
      <h3>${t.titre}</h3>
      <p>${t.texte}</p>
    </div>
  `).join('');

  // Fonction globale pour changer de témoignage
  window.showTemoignage = function(id) {
    document.querySelectorAll('.temoignage-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.temoignages-mobile .temoignage').forEach(c => c.classList.remove('active'));

    document.getElementById(id)?.classList.add('active');
    document.getElementById("mobile-" + id)?.classList.add('active');

    setupReadMoreButtons();
    adjustContainerHeight();
  };

  function adjustContainerHeight() {
    const active = containerDesktop.querySelector('.temoignage-card.active');
    if (active) {
      containerDesktop.style.height = active.scrollHeight + 40 + "px";
    }
  }

  function setupReadMoreButtons() {
    document.querySelectorAll('.temoignage-card').forEach(card => {
      const p = card.querySelector('p');
      const btn = card.querySelector('.read-more-btn');

      if (p.scrollHeight > 350) {
        p.style.maxHeight = "350px";
        btn.style.display = "block";
        btn.textContent = "Lire plus";

        btn.onclick = () => {
          const expanded = p.style.maxHeight === "none";
          p.style.maxHeight = expanded ? "350px" : "none";
          btn.textContent = expanded ? "Lire plus" : "Lire moins";
          adjustContainerHeight();
        };
      } else {
        btn.style.display = "none";
      }
    });
  }

  // Si un témoignage avait été demandé avant chargement → afficher
  if (window.temoignageToShow) {
    window.showTemoignage(window.temoignageToShow);
    window.temoignageToShow = null;
  } else {
    window.showTemoignage(temoignages[0].id);
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
