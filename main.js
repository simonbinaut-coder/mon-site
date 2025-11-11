// Chargement dynamique des pages avec effet de fondu
function loadPage(page) {
  const content = document.getElementById('content');
  
  // Fondu sortant
  content.style.opacity = '0';
  
  setTimeout(() => {
    fetch(`pages/${page}.html?t=${Date.now()}`)
      .then(response => {
        if (!response.ok) throw new Error('Page non trouvée');
        return response.text();
      })
      .then(html => {
        content.innerHTML = html;
        setActiveLink(page);
        
        // Fondu entrant
        setTimeout(() => {
          content.style.opacity = '1';
        }, 50);
        
        // Initialise les fonctionnalités spécifiques à chaque page
        if (page === 'insta') {
          loadElfsightScript();
        }
        if (page === 'temoignages') {
          setupTemoignages();
        }
        if (page === 'contact') {
          setupContactForm();
        }
        if (page === 'about') {
          loadAboutText();
        }
        if (page === 'functionnal_patterns') {
          loadFunctionalPatternsText();
        }
      })
      .catch(() => {
        content.innerHTML = '<p>Page introuvable.</p>';
        content.style.opacity = '1';
        setActiveLink(null);
      });
  }, 300); // Durée du fondu sortant
}

// Gestion du menu actif
function setActiveLink(page) {
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    if (link.getAttribute('href') === `#${page}`) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Gestion du hash dans l'URL
function handleHashChange() {
  const page = location.hash.replace('#', '') || 'home';
  loadPage(page);
}

// Initialisation au chargement
window.addEventListener('DOMContentLoaded', function() {
  handleHashChange();
  setupContactForm();
});

// Écouteur pour les changements de hash
window.addEventListener('hashchange', handleHashChange);

// Script Elfsight pour Instagram
function loadElfsightScript() {
  if (!window.elfsightLoaded) {
    const script = document.createElement('script');
    script.src = 'https://static.elfsight.com/platform/platform.js';
    script.async = true;
    document.body.appendChild(script);
    window.elfsightLoaded = true;
  }
}

// Formulaire de contact
function setupContactForm() {
  const btn = document.getElementById('submit-btn');
  if (btn) {
    btn.onclick = function(e) {
      e.preventDefault();
      const form = document.getElementById('contact-form');
      const formData = new FormData(form);
      fetch('https://formspree.io/f/movlbbbd', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          alert('Merci ! Votre message a été envoyé.');
          form.reset();
        } else {
          response.json().then(data => {
            alert('Erreur : ' + (data.error || 'Veuillez réessayer.'));
          });
        }
      })
      .catch(error => {
        alert('Erreur réseau. Vérifiez votre connexion.');
        console.error('Error:', error);
      });
    };
  } else {
    setTimeout(setupContactForm, 500);
  }
}

// Vérification périodique du formulaire
setInterval(setupContactForm, 500);

// Effet de défilement pour la section hero
window.addEventListener('scroll', function() {
  const hero = document.querySelector('.hero-section');
  if (hero) {
    const scrollPosition = window.scrollY;
    const offset = Math.min(scrollPosition * 0.5, 150);
    hero.style.backgroundPosition = `center ${-50 + offset}px`;
  }
});

// Fonction pour ajuster la hauteur du conteneur des témoignages
function adjustContainerHeight() {
  const container = document.querySelector('.temoignages-container');
  if (container) {
    const activeCard = document.querySelector('.temoignage-card.active');
    if (activeCard) {
      // Attendre que l'animation CSS se termine
      const cardHeight = activeCard.scrollHeight;
      container.style.height = `${cardHeight + 80}px`;
      container.style.transition = 'height 0.3s ease';
      container.style.minHeight = `${cardHeight + 80}px`;
    }
  }
}

// Gestion des boutons "Lire plus" pour les témoignages
function setupReadMoreButtons() {
  const cards = document.querySelectorAll('.temoignage-card');

  cards.forEach(card => {
    const p = card.querySelector('p');
    const btn = card.querySelector('.read-more-btn');

    if (p && btn) {
      // Afficher le bouton seulement si le texte est long
      if (p.scrollHeight > 350) {
        btn.style.display = 'block';
        p.style.maxHeight = '350px';
        btn.textContent = 'Lire plus';

        btn.addEventListener('click', function() {
          // Fermer toutes les autres cards
          cards.forEach(c => {
            const otherP = c.querySelector('p');
            const otherBtn = c.querySelector('.read-more-btn');
            if (otherP && otherBtn && c !== card) {
              otherP.style.maxHeight = '350px';
              otherBtn.textContent = 'Lire plus';
            }
          });

          // Toggle du paragraphe actuel
          if (p.style.maxHeight === 'none') {
            p.style.maxHeight = '350px';
            btn.textContent = 'Lire plus';
            // Ne pas retirer la classe active pour garder la card ouverte
          } else {
            p.style.maxHeight = 'none';
            btn.textContent = 'Lire moins';
            card.classList.add('active');
          }

          // Ajuster immédiatement la hauteur
          setTimeout(() => adjustContainerHeight(), 50);
        });
      } else {
        btn.style.display = 'none';
      }
    }
  });
}


// Gestion des témoignages
async function setupTemoignages() {
  const noms = document.querySelectorAll('.nom');
  const containerDesktop = document.querySelector('.temoignages-container');
  const containerMobile = document.querySelector('.temoignages-mobile');
  const temoignageIds = ['resultats', 'bea', 'emma','brice','marvin','garance','elodie','philippe','carina','melanie','noemie']; // IDs fixes

  // On charge les témoignages depuis les fichiers .txt
  const temoignages = await Promise.all(
    temoignageIds.map(async (id) => {
      try {
        const response = await fetch(`content/temoignages/${id}.txt?t=${Date.now()}`);
        const text = await response.text();

        const getSection = (sectionName) => {
          const match = text.match(new RegExp(`\\[${sectionName}\\]\\s*(.*?)(?=\\[|$)`, 's'));
          return match ? match[1].trim() : '';
        };

        return {
          id: id,
          titre: getSection('Titre'),
          texte: getSection('Texte').replace(/[«»""]/g, "'"),
          image: getSection('Image')
        };
      } catch (error) {
        console.error(`Erreur pour ${id}:`, error);
        return {
          id: id,
          titre: `Témoignage ${id}`,
          texte: "Contenu indisponible",
          image: ''
        };
      }
    })
  );

  // Version Desktop (cards)
  containerDesktop.innerHTML = temoignages.map(temoignage => `
    <div id="${temoignage.id}" class="temoignage-card">
      <div class="card-content">
        <div class="card-image-container">
          <img src="images/${temoignage.image}" alt="${temoignage.titre}" onerror="this.style.display='none'">
        </div>
        <div class="card-text-container">
          <h3>${temoignage.titre}</h3>
          <p>${temoignage.texte}</p>
          <button class="read-more-btn">Lire plus</button>
        </div>
      </div>
    </div>
  `).join('');

  // Version Mobile (simple, sans "lire plus")
  containerMobile.innerHTML = temoignages.map(temoignage => `
    <div id="mobile-${temoignage.id}" class="temoignage">
      <img src="images/${temoignage.image}" alt="${temoignage.titre}" onerror="this.style.display='none'">
      <h3>${temoignage.titre}</h3>
      <p>${temoignage.texte}</p>
    </div>
  `).join('');

  // Active par défaut le premier témoignage
  if (noms.length > 0 && temoignages.length > 0) {
    noms[0].classList.add('active');
    document.getElementById(temoignages[0].id)?.classList.add('active'); // desktop
    document.getElementById('mobile-' + temoignages[0].id)?.classList.add('active'); // mobile
  }

  // Interaction : changement de témoignage
  noms.forEach(nom => {
    nom.addEventListener('mouseenter', function() {
      const targetId = this.getAttribute('data-target');

      // reset états
      noms.forEach(n => n.classList.remove('active'));
      document.querySelectorAll('.temoignage-card').forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.temoignages-mobile .temoignage').forEach(c => c.classList.remove('active'));

        resetReadMoreStates();

      // activer le bon
      this.classList.add('active');
      document.getElementById(targetId)?.classList.add('active'); // desktop
      document.getElementById('mobile-' + targetId)?.classList.add('active'); // mobile

      // recalcul hauteur sur desktop
      adjustContainerHeight();
    });

    // En mobile, on utilise "click" au lieu de hover
    nom.addEventListener('click', function() {
      if (window.innerWidth <= 768) {
        const targetId = this.getAttribute('data-target');

        noms.forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.temoignages-mobile .temoignage').forEach(c => c.classList.remove('active'));

        this.classList.add('active');
        document.getElementById('mobile-' + targetId)?.classList.add('active');
      }
    });
  });

  function resetReadMoreStates() {
  const cards = document.querySelectorAll('.temoignage-card');
  cards.forEach(card => {
    const p = card.querySelector('p');
    const btn = card.querySelector('.read-more-btn');
    if (p && btn) {
      p.style.maxHeight = '350px';
      btn.textContent = 'Lire plus';
      card.classList.remove('active');
    }
  });
}


  // boutons "Lire plus" uniquement sur desktop
  setupReadMoreButtons();
  adjustContainerHeight();
}



// Menu burger
const burger = document.getElementById('burger');
const navLinks = document.getElementById('nav-links');

burger.addEventListener('click', () => {
  navLinks.classList.toggle('show');
  burger.classList.toggle('toggle');
});

// Fermer le menu quand on clique sur un lien
const links = navLinks.querySelectorAll('a');
links.forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('show');
    burger.classList.remove('toggle');
  });
});
//Texte About
function loadAboutText() {
  fetch('content/about.txt?t=' + Date.now())
    .then(response => response.text())
    .then(text => {
      const getSection = (name) => {
        const match = text.match(new RegExp(`\\[${name}\\]\\s*([\\s\\S]*?)(?=\\[|$)`));
        return match ? match[1].trim() : '';
      };

      const image = getSection('Image');
      const en = getSection('EN');
      const fr = getSection('FR');

      document.getElementById('about-image').src = `images/${image}`;
      document.getElementById('about-text-en').innerHTML = en.replace(/\n/g, '<br>');
      document.getElementById('about-text-fr').innerHTML = fr.replace(/\n/g, '<br>');
    });
}

//Texte FP
function loadFunctionalPatternsText() {
  fetch('content/fp.txt?t=' + Date.now())
    .then(res => res.text())
    .then(text => {
      document.getElementById('fp-text').innerHTML = text.replace(/\n/g, '<br>');
    });
}