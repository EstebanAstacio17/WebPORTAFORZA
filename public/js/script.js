/**
 * Portaforza Enterprise Script
 * Manejo de cotizador dinámico, filtros de catálogo interactivos, transiciones suaves y navegación fluida
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Manejo del Navbar al hacer scroll
  const navbar = document.querySelector('.navbar-pf');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // 2. Navegación suave para enlaces internos y cierre de menú móvil
  const navLinks = document.querySelectorAll('a[href^="#"]');
  const navbarCollapse = document.querySelector('.navbar-collapse');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#' || targetId === '') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (targetId.startsWith('#')) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          const navHeight = navbar ? navbar.offsetHeight : 70;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navHeight - 15;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Actualizar URL sin salto brusco
          history.pushState(null, null, targetId);
        }
      }

      // Cerrar menú móvil al hacer clic si está desplegado
      if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) {
          bsCollapse.hide();
        }
      }
    });
  });

  // 3. Transición suave entre páginas (Page Transition Exit)
  const pageLinks = document.querySelectorAll('a:not([href^="#"]):not([target="_blank"]):not([href^="tel:"]):not([href^="mailto:"]):not([href^="javascript:"])');
  pageLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('//')) {
        e.preventDefault();
        document.body.classList.add('page-transition-exit');
        setTimeout(() => {
          window.location.href = href;
        }, 180);
      }
    });
  });

  // 4. Filtros interactivos para el Catálogo de Soluciones y Licencias
  const filterButtons = document.querySelectorAll('.filter-pill-apple, .filter-pill-btn');
  const catalogCards = document.querySelectorAll('.catalog-item-col');

  if (filterButtons.length > 0 && catalogCards.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();

        // Remover clase activa de todos los botones
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');

        catalogCards.forEach(card => {
          const category = card.getAttribute('data-category');
          if (filterValue === 'all' || category === filterValue) {
            card.style.display = 'block';
            card.classList.remove('fade-out');
            card.classList.add('fade-in');
          } else {
            card.style.display = 'none';
            card.classList.remove('fade-in');
          }
        });
      });
    });
  }

  // 5. Cotizador Rápido / Configurador con generación de mensaje para WhatsApp Business
  const quoteForm = document.getElementById('quickQuoteForm');
  if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const serviceSelect = document.getElementById('quoteService');
      const serviceName = serviceSelect ? serviceSelect.options[serviceSelect.selectedIndex].text : 'Servicio TI';
      const companyName = document.getElementById('quoteCompany') ? document.getElementById('quoteCompany').value.trim() : '';
      const clientName = document.getElementById('quoteName') ? document.getElementById('quoteName').value.trim() : '';
      const scaleSelect = document.getElementById('quoteScale');
      const scaleText = scaleSelect ? scaleSelect.options[scaleSelect.selectedIndex].text : '';
      const notes = document.getElementById('quoteNotes') ? document.getElementById('quoteNotes').value.trim() : '';

      // Número oficial Portaforza: +1 849 462 2228
      const phoneNumber = '18494622228';

      let message = `*SOLICITUD DE COTIZACIÓN - PORTAFORZA*\n\n`;
      message += `📌 *Servicio requerido:* ${serviceName}\n`;
      if (clientName) message += `👤 *Contacto:* ${clientName}\n`;
      if (companyName) message += `🏢 *Empresa:* ${companyName}\n`;
      if (scaleText) message += `📊 *Dimensión / Equipos:* ${scaleText}\n`;
      if (notes) message += `📝 *Detalles:* ${notes}\n\n`;
      message += `_Enviado desde el portal web oficial de Portaforza_`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');
    });
  }

  // 6. Botones individuales "Cotizar" en cada tarjeta del catálogo
  const directQuoteButtons = document.querySelectorAll('.btn-quote-item');
  if (directQuoteButtons.length > 0) {
    directQuoteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const itemName = btn.getAttribute('data-item') || 'Solución Tecnológica';
        const phoneNumber = '18494622228';
        const message = `Hola Portaforza, deseo solicitar cotización y disponibilidad para: *${itemName}*.`;
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      });
    });
  }

  // 7. Showcase Interactivo de Capturas de AdminSoftGPF v3
  const showcaseContainer = document.getElementById('showcasePills');
  const showcaseImage = document.getElementById('showcaseImage');
  const showcaseTitle = document.getElementById('showcaseTitle');
  const showcaseDesc = document.getElementById('showcaseDesc');
  const showcaseUrl = document.getElementById('showcaseUrl');

  if (showcaseContainer && showcaseImage) {
    const pills = showcaseContainer.querySelectorAll('.filter-pill-apple');
    pills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const imgSrc = pill.getAttribute('data-img');
        const title = pill.getAttribute('data-title');
        const desc = pill.getAttribute('data-desc');
        const path = pill.getAttribute('data-path') || 'dashboard';

        showcaseImage.style.opacity = '0.2';
        setTimeout(() => {
          if (imgSrc) showcaseImage.src = imgSrc;
          if (title && showcaseTitle) showcaseTitle.innerText = title;
          if (desc && showcaseDesc) showcaseDesc.innerText = desc;
          if (showcaseUrl) showcaseUrl.innerHTML = `<i class="fas fa-lock text-success me-1"></i> adminsoft.portaforza.com/app/${path}`;
          showcaseImage.style.opacity = '1';
        }, 120);
      });
    });
  }
});