/**
 * Portaforza Enterprise Script
 * Manejo de cotizador dinámico, filtros de catálogo interactivos, analíticas GA4/Clarity y transiciones
 */

// =========================================================================
// 0. CONFIGURACIÓN CENTRALIZADA DE ANALÍTICAS (Google Analytics 4 & Clarity)
// =========================================================================
const PORTAFORZA_ANALYTICS_CONFIG = {
  // Reemplaza con tu ID de medición de Google Analytics 4 (ej. 'G-ABC123XYZ')
  ga4Id: 'G-XXXXXXXXXX',
  // Reemplaza con tu ID de proyecto de Microsoft Clarity (opcional)
  clarityId: '',
  // Modo depuración: imprime cada evento de conversión en la consola del navegador
  debug: false
};

// Inicializador seguro de Google Analytics 4 y Microsoft Clarity
function initPortaForzaAnalytics() {
  // 1. Google Analytics 4 (GTAG)
  if (PORTAFORZA_ANALYTICS_CONFIG.ga4Id && PORTAFORZA_ANALYTICS_CONFIG.ga4Id !== 'G-XXXXXXXXXX') {
    if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${PORTAFORZA_ANALYTICS_CONFIG.ga4Id}`;
      document.head.appendChild(gaScript);

      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', PORTAFORZA_ANALYTICS_CONFIG.ga4Id, {
        send_page_view: true,
        currency: 'USD'
      });
      if (PORTAFORZA_ANALYTICS_CONFIG.debug) {
        console.log('[PortaForza Analytics] GA4 conectado con ID:', PORTAFORZA_ANALYTICS_CONFIG.ga4Id);
      }
    }
  }

  // 2. Microsoft Clarity (Mapas de calor y grabaciones)
  if (PORTAFORZA_ANALYTICS_CONFIG.clarityId && PORTAFORZA_ANALYTICS_CONFIG.clarityId.trim() !== '') {
    if (!window.clarity) {
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", PORTAFORZA_ANALYTICS_CONFIG.clarityId);
      if (PORTAFORZA_ANALYTICS_CONFIG.debug) {
        console.log('[PortaForza Analytics] Microsoft Clarity conectado.');
      }
    }
  }
}

// Emisor unificado de eventos de conversión y comportamiento
function trackPFEvent(eventName, params = {}) {
  if (PORTAFORZA_ANALYTICS_CONFIG.debug) {
    console.log(`[PF Event] 🎯 ${eventName}:`, params);
  }
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

// Ejecutar inicialización de analíticas
initPortaForzaAnalytics();

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
        trackPFEvent('pf_catalog_filter', { category: filterValue || 'all' });

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

      trackPFEvent('pf_quick_quote_lead', {
        service: serviceName,
        scale: scaleText
      });
      trackPFEvent('generate_lead', {
        method: 'quick_quote_whatsapp',
        service: serviceName
      });

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

        trackPFEvent('pf_catalog_quote_click', {
          item: itemName
        });
        trackPFEvent('generate_lead', {
          method: 'catalog_item_whatsapp',
          item: itemName
        });

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

          trackPFEvent('adminsoft_showcase_click', {
            module_key: path,
            module_title: title || path
          });
        }, 120);
      });
    });

    // Tracking de planes y botones de AdminSoftGPF
    const adminsoftPlanButtons = document.querySelectorAll('#planes a');
    adminsoftPlanButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.bento-card');
        const planName = card && card.querySelector('h4') ? card.querySelector('h4').innerText.trim() : 'Plan AdminSoft';
        trackPFEvent('adminsoft_plan_cta', {
          plan: planName
        });
        trackPFEvent('generate_lead', {
          method: 'adminsoft_plan_whatsapp',
          plan: planName
        });
      });
    });

    const adminsoftDemoButtons = document.querySelectorAll('a[href*="demostraci%C3%B3n"], a[href*="demo"], a[href*="Demo"]');
    adminsoftDemoButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        trackPFEvent('adminsoft_demo_click', {
          button_text: btn.innerText.trim()
        });
      });
    });

    const adminsoftLoginButtons = document.querySelectorAll('a[href*="adminsoftgpf.portaforza.com"]');
    adminsoftLoginButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        trackPFEvent('adminsoft_portal_login', {
          button_text: btn.innerText.trim()
        });
      });
    });
  }

  // =========================================================================
  // 8. ASISTENTE CONSULTIVO NATURAL: TIEMPO + PERSONALIZACIÓN + PRESUPUESTO USD
  // =========================================================================
  const consultiveConfigurator = document.getElementById('consultiveConfigurator');
  if (consultiveConfigurator) {

    // Matriz de Servicios con Tiempos Reales, Personalización y Rangos en USD
    const NATURAL_SERVICES_MATRIX = {
      web: {
        title: 'Desarrollo Web & Portales',
        isVendorSoftware: false,
        normalWeeks: '2 a 4 semanas',
        tiers: {
          1: {
            title: 'Opción Práctica (Landing / Presencia)',
            baseRange: '$200 – $380 USD',
            urgentRange: '$280 – $480 USD',
            medidaRange: '$350 – $550 USD',
            badge: 'Básico / Inicial',
            isSweetSpot: false,
            descNormal: 'Página única (Landing Page) para presencia inmediata y captación directa por WhatsApp.',
            descUrgent: 'Landing Page rápida de entrega prioritaria concentrada en contacto y presentación básica.',
            allDeliverables: [
              { text: 'Página de aterrizaje (Landing) hasta 3 secciones', icon: 'fas fa-file-code' },
              { text: 'Diseño adaptable a teléfonos y tablets', icon: 'fas fa-mobile-alt' },
              { text: 'Botón directo a chat de WhatsApp', icon: 'fab fa-whatsapp' },
              { text: 'Formulario de contacto básico a correo', icon: 'fas fa-envelope' },
              { text: 'Certificado de seguridad SSL incluido', icon: 'fas fa-lock' }
            ],
            urgentAllowedDeliverables: [
              'Página de aterrizaje (Landing) hasta 3 secciones',
              'Diseño adaptable a teléfonos y tablets',
              'Botón directo a chat de WhatsApp',
              'Certificado de seguridad SSL incluido'
            ],
            timeLabel: '1 a 2 semanas (o ~5 días si es urgente)',
            paymentTerms: '70% de avance y 30% al entregar'
          },
          2: {
            title: 'Opción Completa (Web Corporativa Pro)',
            baseRange: '$420 – $850 USD',
            urgentRange: '$580 – $1,100 USD',
            medidaRange: '$650 – $1,250 USD',
            badge: 'La Más Solicitada ⭐',
            isSweetSpot: true,
            descNormal: 'Sitio corporativo completo (5 a 10 secciones), catálogo interactivo, SEO y correos oficiales.',
            descUrgent: 'Sitio corporativo acelerado con dedicación prioritaria del equipo de diseño y maquetación.',
            allDeliverables: [
              { text: 'Sitio Corporativo Completo (5 a 10 secciones)', icon: 'fas fa-globe' },
              { text: 'Catálogo de Soluciones o Productos con filtros', icon: 'fas fa-cubes' },
              { text: 'Configuración de Correos Corporativos oficiales', icon: 'fas fa-envelope-open-text' },
              { text: 'Optimización de Velocidad Extrema (95+)', icon: 'fas fa-tachometer-alt' },
              { text: 'Posicionamiento SEO base en Google', icon: 'fas fa-search' },
              { text: 'Hosting de alta velocidad + Dominio .com (1er año)', icon: 'fas fa-server' },
              { text: 'Capacitación para edición básica de contenidos', icon: 'fas fa-chalkboard-teacher' }
            ],
            urgentAllowedDeliverables: [
              'Sitio Corporativo Completo (5 a 10 secciones)',
              'Catálogo de Soluciones o Productos con filtros',
              'Configuración de Correos Corporativos oficiales',
              'Optimización de Velocidad Extrema (95+)',
              'Hosting de alta velocidad + Dominio .com (1er año)'
            ],
            timeLabel: '2 a 4 semanas (tiempo normal óptimo)',
            paymentTerms: '70% de avance y 30% al finalizar a conformidad'
          },
          3: {
            title: 'Proyecto Avanzado (Portal B2B / Pagos)',
            baseRange: '$1,200 – $2,500+ USD',
            urgentRange: '$1,600 – $3,200+ USD',
            medidaRange: '$1,800 – $3,800+ USD',
            badge: 'Avanzado / Corporativo',
            isSweetSpot: false,
            descNormal: 'Portal con acceso de usuarios, pasarela de pago o base de datos en la nube.',
            descUrgent: 'Desarrollo en sprint intensivo de portal web con base de datos e integraciones.',
            allDeliverables: [
              { text: 'Portal con Inicio de Sesión de Clientes / Socios', icon: 'fas fa-user-lock' },
              { text: 'Integración de Pasarela de Pagos en Línea', icon: 'fas fa-credit-card' },
              { text: 'Consulta de Facturas o Estados de Cuenta', icon: 'fas fa-file-invoice' },
              { text: 'Panel de Administración avanzado a medida', icon: 'fas fa-cogs' },
              { text: 'Base de datos en la nube con respaldos diarios', icon: 'fas fa-database' },
              { text: 'Garantía extendida y soporte técnico post-despliegue', icon: 'fas fa-shield-alt' }
            ],
            urgentAllowedDeliverables: [
              'Portal con Inicio de Sesión de Clientes / Socios',
              'Integración de Pasarela de Pagos en Línea',
              'Panel de Administración avanzado a medida',
              'Base de datos en la nube con respaldos diarios'
            ],
            timeLabel: '4 a 7 semanas según complejidad técnica',
            paymentTerms: '70% de avance y 30% contra entrega final'
          }
        }
      },
      software: {
        title: 'Desarrollo de Software a Medida & ERP',
        isVendorSoftware: false,
        normalWeeks: '5 a 8 semanas',
        tiers: {
          1: {
            title: 'Módulo Específico / Base',
            baseRange: '$550 – $1,100 USD',
            urgentRange: '$750 – $1,400 USD',
            medidaRange: '$850 – $1,600 USD',
            badge: 'Flujo Específico',
            isSweetSpot: false,
            descNormal: 'Automatización de un proceso puntual (ej. solo caja, solo cotizaciones o inventario básico).',
            descUrgent: 'Despliegue rápido de un módulo base listo para operar para resolver una urgencia.',
            allDeliverables: [
              { text: 'Automatización de 1 flujo operativo puntual', icon: 'fas fa-cogs' },
              { text: 'Control de Facturación básica o Caja', icon: 'fas fa-cash-register' },
              { text: 'Control de Inventario o Directorio de Clientes', icon: 'fas fa-boxes' },
              { text: 'Acceso para hasta 3 usuarios con contraseña', icon: 'fas fa-users' },
              { text: 'Exportación de datos a formato Excel', icon: 'fas fa-file-excel' }
            ],
            urgentAllowedDeliverables: [
              'Automatización de 1 flujo operativo puntual',
              'Control de Facturación básica o Caja',
              'Acceso para hasta 3 usuarios con contraseña',
              'Exportación de datos a formato Excel'
            ],
            timeLabel: '3 a 4 semanas (tiempo normal)',
            paymentTerms: '70% de avance y 30% al entregar'
          },
          2: {
            title: 'Sistema Integral Pyme (ERP / CRM)',
            baseRange: '$1,250 – $2,600 USD',
            urgentRange: '$1,650 – $3,200 USD',
            medidaRange: '$1,800 – $3,600 USD',
            badge: 'El Más Equilibrado ⭐',
            isSweetSpot: true,
            descNormal: 'Conecta Facturación con NCF, Inventario, Cuentas por Cobrar/Pagar y Dashboard Gerencial.',
            descUrgent: 'Desarrollo acelerado en fases para poner en marcha facturación e inventario primero.',
            allDeliverables: [
              { text: 'Facturación con Comprobantes Fiscales (NCF B01)', icon: 'fas fa-file-invoice-dollar' },
              { text: 'Control de Inventarios Multi-Almacén y Alertas', icon: 'fas fa-warehouse' },
              { text: 'Cuentas por Cobrar (CxC) y Cuentas por Pagar (CxP)', icon: 'fas fa-receipt' },
              { text: 'Dashboard con reportes de utilidades y ventas', icon: 'fas fa-chart-pie' },
              { text: 'Control de roles y permisos por empleado', icon: 'fas fa-user-shield' },
              { text: 'Migración inicial de productos/clientes desde Excel', icon: 'fas fa-file-import' },
              { text: 'Capacitación presencial o virtual a tu equipo', icon: 'fas fa-chalkboard-teacher' }
            ],
            urgentAllowedDeliverables: [
              'Facturación con Comprobantes Fiscales (NCF B01)',
              'Control de Inventarios Multi-Almacén y Alertas',
              'Cuentas por Cobrar (CxC) y Cuentas por Pagar (CxP)',
              'Dashboard con reportes de utilidades y ventas',
              'Control de roles y permisos por empleado',
              'Migración inicial de productos/clientes desde Excel'
            ],
            timeLabel: '5 a 8 semanas con entregas parciales',
            paymentTerms: '70% de avance y 30% al finalizar a conformidad'
          },
          3: {
            title: 'Plataforma Enterprise Multi-Sede',
            baseRange: '$3,500 – $7,500+ USD',
            urgentRange: '$4,500 – $9,000+ USD',
            medidaRange: '$4,800 – $10,000+ USD',
            badge: 'Sin Límites / Multi-Sucursal',
            isSweetSpot: false,
            descNormal: 'Multi-sucursal en la nube, facturación electrónica DGII (e-CF), APIs y soporte dedicado.',
            descUrgent: 'Asignación de equipo dedicado para despliegue prioritario de arquitectura empresarial.',
            allDeliverables: [
              { text: 'Arquitectura Multi-Sucursal centralizada en la nube', icon: 'fas fa-network-wired' },
              { text: 'Preparado para Facturación Electrónica DGII (e-CF)', icon: 'fas fa-certificate' },
              { text: 'Integración API con plataformas externas o bancos', icon: 'fas fa-code-branch' },
              { text: 'Vista web móvil para cobradores y supervisores', icon: 'fas fa-mobile-alt' },
              { text: 'Base de datos dedicada con respaldo automático', icon: 'fas fa-database' },
              { text: 'SLA de soporte técnico prioritario incluido', icon: 'fas fa-headset' }
            ],
            urgentAllowedDeliverables: [
              'Arquitectura Multi-Sucursal centralizada en la nube',
              'Preparado para Facturación Electrónica DGII (e-CF)',
              'Integración API con plataformas externas o bancos',
              'Base de datos dedicada con respaldo automático',
              'SLA de soporte técnico prioritario incluido'
            ],
            timeLabel: '2 a 4 meses según alcance y pruebas',
            paymentTerms: '70% de avance y 30% contra entrega por fases'
          }
        }
      },
      adminsoft: {
        title: 'AdminSoftGPF - Administración de Condominios',
        isVendorSoftware: false,
        normalWeeks: 'Activación en 24h a 48h',
        tiers: {
          1: {
            title: 'Plan Starter (1 Residencial)',
            baseRange: '$29.80 – $45 USD / mes',
            urgentRange: '$29.80 – $45 USD / mes',
            medidaRange: '$45 – $65 USD / mes',
            badge: '1 Residencial',
            isSweetSpot: false,
            descNormal: 'Acceso en la nube para 1 residencial o torre con todos los módulos operativos.',
            descUrgent: 'Activación inmediata en el mismo día con carga estándar de cuotas.',
            allDeliverables: [
              { text: 'Licencia en la Nube para 1 Condominio / Torre', icon: 'fas fa-building' },
              { text: 'Facturación de cuotas ordinarias y extraordinarias', icon: 'fas fa-file-invoice' },
              { text: 'Control de caja diario y recibos digitales PDF', icon: 'fas fa-cash-register' },
              { text: 'Padrón de residentes, apartamentos y vehículos', icon: 'fas fa-users' },
              { text: 'Registro de egresos y gastos comunes del edificio', icon: 'fas fa-receipt' },
              { text: 'Soporte técnico continuo por WhatsApp y correo', icon: 'fas fa-headset' }
            ],
            urgentAllowedDeliverables: [
              'Licencia en la Nube para 1 Condominio / Torre',
              'Facturación de cuotas ordinarias y extraordinarias',
              'Control de caja diario y recibos digitales PDF',
              'Padrón de residentes, apartamentos y vehículos'
            ],
            timeLabel: 'Listo en menos de 24 horas',
            paymentTerms: 'Suscripción mensual sin contratos forzosos'
          },
          2: {
            title: 'Plan Profesional (Hasta 4 Residenciales)',
            baseRange: '$65 – $95 USD / mes',
            urgentRange: '$65 – $95 USD / mes',
            medidaRange: '$85 – $120 USD / mes',
            badge: 'El Más Usado por Administradores ⭐',
            isSweetSpot: true,
            descNormal: 'Manejo centralizado de hasta 4 residenciales, multi-usuario con roles y reportes para juntas.',
            descUrgent: 'Puesta en marcha en 24h con capacitación virtual de arranque rápido.',
            allDeliverables: [
              { text: 'Gestión centralizada de hasta 4 Residenciales o Plazas', icon: 'fas fa-city' },
              { text: 'Multi-usuario con roles (Administrador, Cajero, Junta)', icon: 'fas fa-user-lock' },
              { text: 'Reportes de morosidad y balances para asambleas', icon: 'fas fa-chart-line' },
              { text: 'Exportación masiva de estados de cuenta en PDF y Excel', icon: 'fas fa-file-excel' },
              { text: 'Permisos de mudanza y control de proveedores', icon: 'fas fa-truck-loading' },
              { text: 'Capacitación virtual para el personal de administración', icon: 'fas fa-chalkboard-teacher' },
              { text: 'Soporte técnico preferencial con respuesta rápida', icon: 'fas fa-star' }
            ],
            urgentAllowedDeliverables: [
              'Gestión centralizada de hasta 4 Residenciales o Plazas',
              'Multi-usuario con roles (Administrador, Cajero, Junta)',
              'Reportes de morosidad y balances para asambleas',
              'Exportación masiva de estados de cuenta en PDF y Excel',
              'Capacitación virtual para el personal de administración'
            ],
            timeLabel: 'Configuración y puesta en marcha en 24 a 48 horas',
            paymentTerms: 'Suscripción mensual o descuento por pago anual'
          },
          3: {
            title: 'Plan Enterprise (Administradoras Grandes)',
            baseRange: '$140 – $280+ USD / mes',
            urgentRange: '$180 – $320+ USD / mes',
            medidaRange: '$200 – $400+ USD / mes',
            badge: 'Residenciales Ilimitados',
            isSweetSpot: false,
            descNormal: 'Para administradoras con decenas de proyectos, reportes a medida y base de datos dedicada.',
            descUrgent: 'Migración acelerada de carteras de condominios con equipo técnico de apoyo.',
            allDeliverables: [
              { text: 'Gestión de Condominios y Torres Ilimitados', icon: 'fas fa-infinity' },
              { text: 'Adaptación de reportes a necesidades específicas', icon: 'fas fa-puzzle-piece' },
              { text: 'Migración asistida de bases de datos y saldos', icon: 'fas fa-database' },
              { text: 'Base de datos aislada con respaldo de alta frecuencia', icon: 'fas fa-server' },
              { text: 'Onboarding presencial y asesoría en optimización contable', icon: 'fas fa-handshake' },
              { text: 'Línea de soporte dedicada de emergencia 24/7', icon: 'fas fa-phone-alt' }
            ],
            urgentAllowedDeliverables: [
              'Gestión de Condominios y Torres Ilimitados',
              'Adaptación de reportes a necesidades específicas',
              'Migración asistida de bases de datos y saldos',
              'Base de datos aislada con respaldo de alta frecuencia'
            ],
            timeLabel: '1 a 2 semanas con migración de saldos',
            paymentTerms: 'Plan corporativo mensual o anual'
          }
        }
      },
      licencias: {
        title: 'Suministro de Licenciamiento Original',
        isVendorSoftware: true,
        normalWeeks: 'Entrega digital en 2 a 24 horas',
        tiers: {
          1: {
            title: 'Lote Pyme Inicial (1 a 5 Equipos)',
            baseRange: '$100 – $350 USD',
            urgentRange: '$100 – $350 USD',
            medidaRange: '$150 – $400 USD',
            badge: '1 a 5 Equipos',
            isSweetSpot: false,
            descNormal: 'Licencias originales de Windows Pro, Office o Antivirus corporativo con factura fiscal.',
            descUrgent: 'Entrega prioritaria de claves digitales en pocas horas hábiles.',
            allDeliverables: [
              { text: 'Licencias Windows 10/11 Pro genuinas validadas', icon: 'fab fa-windows' },
              { text: 'Suscripciones Microsoft 365 Business Basic / Standard', icon: 'fab fa-microsoft' },
              { text: 'Protección Antivirus Endpoint Corporativo', icon: 'fas fa-shield-virus' },
              { text: 'Factura Fiscal con Comprobante Crédito Fiscal (NCF B01)', icon: 'fas fa-file-invoice' },
              { text: 'Asistencia técnica remota en activación sin costo extra', icon: 'fas fa-tools' }
            ],
            urgentAllowedDeliverables: [
              'Licencias Windows 10/11 Pro genuinas validadas',
              'Suscripciones Microsoft 365 Business Basic / Standard',
              'Protección Antivirus Endpoint Corporativo',
              'Factura Fiscal con Comprobante Crédito Fiscal (NCF B01)'
            ],
            timeLabel: 'Entrega digital en 2 a 4 horas hábiles',
            paymentTerms: 'Pago contra emisión de factura y entrega'
          },
          2: {
            title: 'Pack Corporativo (6 a 25 Usuarios)',
            baseRange: '$380 – $1,400 USD',
            urgentRange: '$380 – $1,400 USD',
            medidaRange: '$500 – $1,650 USD',
            badge: 'El Más Solicitado ⭐',
            isSweetSpot: true,
            descNormal: 'Microsoft 365 con correo corporativo, Windows Server y consola Antivirus EDR Cloud.',
            descUrgent: 'Aprovisionamiento en 12h con configuración directa de usuarios principales.',
            allDeliverables: [
              { text: 'Microsoft 365 Business (Correo @tuempresa, Teams, 1TB)', icon: 'fab fa-microsoft' },
              { text: 'Licenciamiento Windows Server 2022/2025 Standard', icon: 'fas fa-server' },
              { text: 'Licencias de acceso de usuario (CALs de Windows Server)', icon: 'fas fa-users-cog' },
              { text: 'Consola en la Nube Antivirus EDR Anti-Ransomware', icon: 'fas fa-shield-alt' },
              { text: 'Configuración de Tenant Oficial de Microsoft incluida', icon: 'fas fa-gift' },
              { text: 'Migración básica de correos existentes a Microsoft 365', icon: 'fas fa-exchange-alt' },
              { text: 'Garantía fiscal y legal absoluta contra auditorías', icon: 'fas fa-check-double' }
            ],
            urgentAllowedDeliverables: [
              'Microsoft 365 Business (Correo @tuempresa, Teams, 1TB)',
              'Licenciamiento Windows Server 2022/2025 Standard',
              'Licencias de acceso de usuario (CALs de Windows Server)',
              'Consola en la Nube Antivirus EDR Anti-Ransomware',
              'Configuración de Tenant Oficial de Microsoft incluida'
            ],
            timeLabel: '12 a 24 horas con activación asistida',
            paymentTerms: 'Factura fiscal con NCF corporativo'
          },
          3: {
            title: 'Licenciamiento Masivo / Auditoría (26+ Puestos)',
            baseRange: '$1,500+ USD (Por volumen)',
            urgentRange: '$1,500+ USD',
            medidaRange: '$1,800+ USD',
            badge: 'Volumen Empresarial',
            isSweetSpot: false,
            descNormal: 'Regularización total de parque, Remote Desktop RDS CALs, SQL Server y descuentos de fabricante.',
            descUrgent: 'Auditoría urgente para regularizar empresas ante inspecciones o renovaciones.',
            allDeliverables: [
              { text: 'Auditoría previa sin costo del parque informático actual', icon: 'fas fa-search-dollar' },
              { text: 'Aplicación de descuentos especiales por volumen de fabricante', icon: 'fas fa-percentage' },
              { text: 'Licencias Remote Desktop Services (RDS CALs) para teletrabajo', icon: 'fas fa-laptop-house' },
              { text: 'Licenciamiento de bases de datos Microsoft SQL Server', icon: 'fas fa-database' },
              { text: 'Despliegue automatizado de políticas y seguridad corporativa', icon: 'fas fa-user-lock' },
              { text: 'Certificado de licenciamiento oficial para cumplimiento legal', icon: 'fas fa-certificate' }
            ],
            urgentAllowedDeliverables: [
              'Aplicación de descuentos especiales por volumen de fabricante',
              'Licencias Remote Desktop Services (RDS CALs) para teletrabajo',
              'Licenciamiento de bases de datos Microsoft SQL Server',
              'Certificado de licenciamiento oficial para cumplimiento legal'
            ],
            timeLabel: '1 a 3 días hábiles según volumen',
            paymentTerms: 'Cotización escalonada con crédito corporativo'
          }
        }
      },
      soporte: {
        title: 'Soporte Técnico & Mantenimiento TI',
        isVendorSoftware: false,
        normalWeeks: 'Atención continua mensual',
        tiers: {
          1: {
            title: 'Mantenimiento Preventivo (1 a 6 PCs)',
            baseRange: '$90 – $180 USD / mes',
            urgentRange: '$140 – $240 USD (Visita puntual)',
            medidaRange: '$120 – $220 USD / mes',
            badge: 'Micro-Oficina',
            isSweetSpot: false,
            descNormal: 'Mantenimiento físico y optimización lógica mensual para pequeñas oficinas.',
            descUrgent: 'Visita de diagnóstico correctivo inmediato para resolver falla actual en oficina.',
            allDeliverables: [
              { text: 'Mantenimiento preventivo físico de hasta 6 computadoras', icon: 'fas fa-tools' },
              { text: 'Optimización de velocidad y limpieza de archivos temporales', icon: 'fas fa-tachometer-alt' },
              { text: 'Asistencia remota para incidencias de ofimática', icon: 'fas fa-desktop' },
              { text: 'Revisión periódica de impresoras y puntos de red', icon: 'fas fa-print' },
              { text: 'Informe mensual del estado del parque informático', icon: 'fas fa-clipboard-list' }
            ],
            urgentAllowedDeliverables: [
              'Diagnóstico y solución de emergencia de equipos caídos',
              'Optimización de velocidad y limpieza de archivos temporales',
              'Asistencia remota para incidencias de ofimática'
            ],
            timeLabel: 'Mismo día hábil o visitas mensuales programadas',
            paymentTerms: 'Mensualidad fija con factura fiscal'
          },
          2: {
            title: 'Póliza Corporativa Pyme (Todo Incluido)',
            baseRange: '$220 – $450 USD / mes',
            urgentRange: '$290 – $550 USD / mes',
            medidaRange: '$280 – $520 USD / mes',
            badge: 'La Opción Más Completa ⭐',
            isSweetSpot: true,
            descNormal: 'Helpdesk remoto ilimitado para 7 a 20 equipos, 1 servidor, copias de seguridad y SLA < 15 min.',
            descUrgent: 'Activación de póliza con prioridad de atención presencial inmediata en menos de 2 horas.',
            allDeliverables: [
              { text: 'Cobertura de 7 a 20 computadoras + Servidor y Red local', icon: 'fas fa-network-wired' },
              { text: 'Mesa de ayuda remota ILIMITADA para todo el personal', icon: 'fas fa-headset' },
              { text: 'Visitas presenciales preventivas y de emergencia ante caídas', icon: 'fas fa-user-shield' },
              { text: 'Supervisión diaria de copias de seguridad (Backups)', icon: 'fas fa-database' },
              { text: 'Administración de Antivirus centralizado y correos', icon: 'fas fa-shield-virus' },
              { text: 'SLA de respuesta rápida ante contingencias (< 15 min)', icon: 'fas fa-stopwatch' },
              { text: 'Asesoría técnica para compra inteligente de equipos', icon: 'fas fa-shopping-cart' }
            ],
            urgentAllowedDeliverables: [
              'Cobertura de 7 a 20 computadoras + Servidor y Red local',
              'Mesa de ayuda remota ILIMITADA para todo el personal',
              'Visitas presenciales preventivas y de emergencia ante caídas',
              'Supervisión diaria de copias de seguridad (Backups)',
              'SLA de respuesta rápida ante contingencias (< 15 min)'
            ],
            timeLabel: 'Póliza activa de inmediato con levantamiento',
            paymentTerms: 'Facturación mensual recurrente con NCF'
          },
          3: {
            title: 'Departamento TI Externo 24/7',
            baseRange: '$600 – $1,200+ USD / mes',
            urgentRange: '$750 – $1,500+ USD / mes',
            medidaRange: '$750 – $1,600+ USD / mes',
            badge: '24/7 / Multi-Sede',
            isSweetSpot: false,
            descNormal: 'Cobertura para 21 a 50+ equipos, servidores críticos, sucursales y monitoreo continuo.',
            descUrgent: 'Equipo de ingenieros en guardia 24/7 con atención crítica prioritaria.',
            allDeliverables: [
              { text: 'Soporte para 21 a 50+ equipos, servidores y sucursales', icon: 'fas fa-sitemap' },
              { text: 'Monitoreo proactivo 24/7 de caídas de red y servidores', icon: 'fas fa-eye' },
              { text: 'Administración avanzada de Firewalls Fortinet y VPNs', icon: 'fas fa-shield-alt' },
              { text: 'Inventario automatizado de activos y licencias corporativas', icon: 'fas fa-boxes' },
              { text: 'Ingeniero de sistemas dedicado como punto de contacto', icon: 'fas fa-user-tie' },
              { text: 'Atención técnica presencial prioritaria para emergencias', icon: 'fas fa-ambulance' }
            ],
            urgentAllowedDeliverables: [
              'Soporte para 21 a 50+ equipos, servidores y sucursales',
              'Monitoreo proactivo 24/7 de caídas de red y servidores',
              'Administración avanzada de Firewalls Fortinet y VPNs',
              'Ingeniero de sistemas dedicado como punto de contacto'
            ],
            timeLabel: 'Atención continua 24/7 los 365 días',
            paymentTerms: 'Contrato corporativo con SLA formal'
          }
        }
      },
      servidores: {
        title: 'Instalación de Servidores & Redes',
        isVendorSoftware: false,
        normalWeeks: '1 a 3 semanas',
        tiers: {
          1: {
            title: 'Adecuación de Red / Wi-Fi / Rack',
            baseRange: '$220 – $480 USD',
            urgentRange: '$320 – $580 USD',
            medidaRange: '$350 – $650 USD',
            badge: 'Solución Puntual',
            isSweetSpot: false,
            descNormal: 'Configuración de Wi-Fi UniFi corporativo, VPN de teletrabajo o saneamiento de rack.',
            descUrgent: 'Intervención rápida en fin de semana o fuera de horario comercial para no parar la oficina.',
            allDeliverables: [
              { text: 'Configuración de puntos de acceso Wi-Fi Corporativo UniFi', icon: 'fas fa-wifi' },
              { text: 'Configuración de VPN segura para teletrabajo remoto', icon: 'fas fa-laptop-house' },
              { text: 'Organización, peinado y etiquetado de cables en rack', icon: 'fas fa-stream' },
              { text: 'Segmentación básica de red para invitados y oficina', icon: 'fas fa-sitemap' },
              { text: 'Documentación técnica de accesos y contraseñas', icon: 'fas fa-key' }
            ],
            urgentAllowedDeliverables: [
              'Configuración de puntos de acceso Wi-Fi Corporativo UniFi',
              'Configuración de VPN segura para teletrabajo remoto',
              'Segmentación básica de red para invitados y oficina',
              'Documentación técnica de accesos y contraseñas'
            ],
            timeLabel: '1 a 3 días hábiles',
            paymentTerms: '70% de avance y 30% al verificar conectividad'
          },
          2: {
            title: 'Servidor Corporativo + Firewall UTM',
            baseRange: '$550 – $1,350 USD',
            urgentRange: '$750 – $1,700 USD',
            medidaRange: '$850 – $1,900 USD',
            badge: 'El Estándar Recomendado ⭐',
            isSweetSpot: true,
            descNormal: 'Puesta en marcha de Servidor (Proxmox/Windows), Firewall Fortinet y Backup 3-2-1.',
            descUrgent: 'Montaje intensivo de servidor y firewall en horario extendido para arranque rápido.',
            allDeliverables: [
              { text: 'Instalación de Servidor (Proxmox, VMware o Windows Server)', icon: 'fas fa-server' },
              { text: 'Configuración de Active Directory, usuarios y permisos', icon: 'fas fa-users-cog' },
              { text: 'Configuración de Firewall UTM (Fortinet / pfSense / MikroTik)', icon: 'fas fa-shield-alt' },
              { text: 'Balanceo de líneas de Internet (Failover Dual-WAN)', icon: 'fas fa-random' },
              { text: 'Estrategia de Copias de Seguridad Automatizada 3-2-1', icon: 'fas fa-database' },
              { text: 'Configuración de Arreglo de Discos en RAID contra fallas', icon: 'fas fa-hdd' },
              { text: 'Pruebas de contingencia y mapa de red documentado', icon: 'fas fa-map-marked-alt' }
            ],
            urgentAllowedDeliverables: [
              'Instalación de Servidor (Proxmox, VMware o Windows Server)',
              'Configuración de Active Directory, usuarios y permisos',
              'Configuración de Firewall UTM (Fortinet / pfSense / MikroTik)',
              'Balanceo de líneas de Internet (Failover Dual-WAN)',
              'Estrategia de Copias de Seguridad Automatizada 3-2-1'
            ],
            timeLabel: '1 a 2 semanas con pruebas de contingencia',
            paymentTerms: '70% de avance y 30% tras entrega y pruebas'
          },
          3: {
            title: 'Data Center & Cableado Llave en Mano',
            baseRange: '$1,800 – $4,800+ USD',
            urgentRange: '$2,400 – $5,800+ USD',
            medidaRange: '$2,500 – $6,500+ USD',
            badge: 'Proyecto Completo',
            isSweetSpot: false,
            descNormal: 'Cuarto de servidores nuevo, cableado Cat6A certificado y alta disponibilidad en cluster.',
            descUrgent: 'Cuadrilla ampliada para cableado y montaje rápido en mudanzas de oficina urgentes.',
            allDeliverables: [
              { text: 'Diseño e instalación de Cuarto de Servidores desde cero', icon: 'fas fa-door-open' },
              { text: 'Cableado estructurado Cat6 / Cat6A certificado para 20 a 80+ puntos', icon: 'fas fa-network-wired' },
              { text: 'Switches Administrables PoE y enlaces troncales', icon: 'fas fa-ethernet' },
              { text: 'Servidores en Cluster con migración en caliente (Failover)', icon: 'fas fa-clone' },
              { text: 'Sistema de respaldo de energía ininterrumpida UPS Online', icon: 'fas fa-car-battery' },
              { text: 'Certificación física de puntos de red y garantía de 3 años', icon: 'fas fa-award' }
            ],
            urgentAllowedDeliverables: [
              'Diseño e instalación de Cuarto de Servidores desde cero',
              'Cableado estructurado Cat6 / Cat6A certificado para 20 a 80+ puntos',
              'Switches Administrables PoE y enlaces troncales',
              'Certificación física de puntos de red y garantía de 3 años'
            ],
            timeLabel: '2 a 5 semanas según cronograma de obra',
            paymentTerms: '70% de avance y 30% contra certificación final'
          }
        }
      }
    };

    // Estado del Wizard
    const wizardState = {
      currentStep: 1,
      selectedServiceKey: 'web',
      selectedTime: 'normal', // 'urgente', 'normal', 'calma'
      selectedCustom: 'adaptado', // 'base', 'adaptado', 'medida'
      selectedScale: 'Mediano / 6 a 20 puestos o escala Pyme en crecimiento',
      selectedTierIndex: 2, // 1, 2, 3 (Nivel 2 es el más equilibrado)
      isFlexibleBudget: false,
      selectedDeliverables: [],
      selectedBilling: 'Comprobante con Crédito Fiscal (NCF B01)',
      selectedDecision: 'Listo para arrancar si la propuesta cuadra'
    };

    // Referencias DOM
    const stepLabel = document.getElementById('wizardStepLabel');
    const stepPercent = document.getElementById('wizardStepPercent');
    const progressBar = document.getElementById('wizardProgressBar');
    const panes = {
      1: document.getElementById('step1'),
      2: document.getElementById('step2'),
      3: document.getElementById('step3'),
      4: document.getElementById('step4')
    };

    const currentServiceBadge = document.getElementById('currentServiceBadge');
    const vendorNoticeBox = document.getElementById('vendorNoticeBox');
    const urgencyAlertBox = document.getElementById('urgencyAlertBox');
    const urgencyAlertText = document.getElementById('urgencyAlertText');
    const btnSwitchToNormalTime = document.getElementById('btnSwitchToNormalTime');

    const budgetDecoyGrid = document.getElementById('budgetDecoyGrid');
    const flexibleBudgetBar = document.getElementById('flexibleBudgetBar');
    const flexibleOptionTitle = document.getElementById('flexibleOptionTitle');
    const deliverablesPillGroup = document.getElementById('deliverablesPillGroup');

    // Botones de Navegación
    const btnNextStep1 = document.getElementById('btnNextStep1');
    const btnBackStep2 = document.getElementById('btnBackStep2');
    const btnNextStep2 = document.getElementById('btnNextStep2');
    const btnBackStep3 = document.getElementById('btnBackStep3');
    const btnNextStep3 = document.getElementById('btnNextStep3');
    const btnBackStep4 = document.getElementById('btnBackStep4');
    const btnSubmitWhatsApp = document.getElementById('btnSubmitWhatsApp');
    const btnSubmitEmail = document.getElementById('btnSubmitEmail');

    // Función de cambio de paso
    function goToStep(stepNumber) {
      wizardState.currentStep = stepNumber;

      trackPFEvent('pf_wizard_step', {
        step: stepNumber,
        service: wizardState.selectedServiceKey,
        time: wizardState.selectedTime,
        custom: wizardState.selectedCustom
      });

      Object.keys(panes).forEach(k => {
        if (panes[k]) panes[k].classList.remove('active');
      });
      if (panes[stepNumber]) panes[stepNumber].classList.add('active');

      const percent = stepNumber === 1 ? '25%' : stepNumber === 2 ? '50%' : stepNumber === 3 ? '75%' : '100%';
      const titles = {
        1: 'Paso 1 de 4: Selecciona el Servicio',
        2: 'Paso 2 de 4: Tiempo de Entrega y Nivel de Desarrollo',
        3: 'Paso 3 de 4: Presupuesto y Opciones a Incluir',
        4: 'Paso 4 de 4: Resumen de tu Propuesta'
      };

      if (stepLabel) stepLabel.innerText = titles[stepNumber] || '';
      if (stepPercent) stepPercent.innerText = `${percent} Completado`;
      if (progressBar) progressBar.style.width = percent;

      const boxRect = consultiveConfigurator.getBoundingClientRect();
      if (boxRect.top < 0 || boxRect.top > window.innerHeight) {
        consultiveConfigurator.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      if (stepNumber === 2) {
        updateStep2Header();
      } else if (stepNumber === 3) {
        renderStep3BudgetsAndDeliverables();
      } else if (stepNumber === 4) {
        compileStep4ProposalTable();
      }
    }

    // Actualizar encabezado del Paso 2
    function updateStep2Header() {
      const config = NATURAL_SERVICES_MATRIX[wizardState.selectedServiceKey] || NATURAL_SERVICES_MATRIX.web;
      if (currentServiceBadge) {
        currentServiceBadge.innerText = config.title;
      }
    }

    // Calcular el rango en USD según el tiempo y la personalización
    function getCalculatedRangeUSD(tier) {
      if (wizardState.selectedTime === 'urgente') {
        return tier.urgentRange;
      } else if (wizardState.selectedCustom === 'medida') {
        return tier.medidaRange;
      } else {
        return tier.baseRange;
      }
    }

    // Renderizado del Paso 3: Presupuesto calculado + Entregables que caben en ese tiempo y dinero
    function renderStep3BudgetsAndDeliverables() {
      const config = NATURAL_SERVICES_MATRIX[wizardState.selectedServiceKey] || NATURAL_SERVICES_MATRIX.web;

      // Aviso sobre licencias oficiales de Microsoft/seguridad
      if (vendorNoticeBox) {
        if (config.isVendorSoftware) {
          vendorNoticeBox.classList.remove('d-none');
        } else {
          vendorNoticeBox.classList.add('d-none');
        }
      }

      // Alerta de "Urgencia + Presupuesto Bajo" (Caso de premura con bajo presupuesto)
      const isUrgentWithLowBudget = (wizardState.selectedTime === 'urgente' && wizardState.selectedTierIndex === 1 && !wizardState.isFlexibleBudget);
      if (urgencyAlertBox) {
        if (isUrgentWithLowBudget) {
          urgencyAlertBox.classList.remove('d-none');
          if (urgencyAlertText) {
            urgencyAlertText.innerText = `Como requieres entrega en aproximadamente 1 semana y seleccionaste el presupuesto inicial, la propuesta se concentrará en una primera fase funcional rápida. Módulos más extensos o a la medida requieren el tiempo normal del proyecto (${config.normalWeeks}).`;
          }
        } else {
          urgencyAlertBox.classList.add('d-none');
        }
      }

      // Renderizar las 3 tarjetas de presupuesto
      let cardsHtml = '';
      [1, 2, 3].forEach(tierKey => {
        const tier = config.tiers[tierKey];
        const isSelected = (!wizardState.isFlexibleBudget && wizardState.selectedTierIndex === tierKey) ? 'selected' : '';
        const isSweet = tier.isSweetSpot ? 'decoy-highlight' : '';
        const currentRange = getCalculatedRangeUSD(tier);
        const descText = (wizardState.selectedTime === 'urgente') ? tier.descUrgent : tier.descNormal;

        cardsHtml += `
          <div class="budget-decoy-card ${isSweet} ${isSelected}" data-tier="${tierKey}" tabindex="0">
            ${tier.isSweetSpot ? `<span class="decoy-top-badge">${tier.badge}</span>` : ''}
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="badge ${tier.isSweetSpot ? 'bg-primary-subtle text-primary' : 'bg-light text-muted border'}" style="font-size: 0.7rem;">Opción 0${tierKey}</span>
              ${!tier.isSweetSpot ? `<span class="text-muted small" style="font-size: 0.72rem;">${tier.badge}</span>` : ''}
            </div>
            <div class="budget-tier-title">${tier.title}</div>
            <div class="budget-amount-tag">${currentRange}</div>
            <div class="budget-period-label">${wizardState.selectedTime === 'urgente' ? 'Tarifa con prioridad de entrega' : 'Precio estándar de mercado'}</div>
            <div class="budget-summary-desc">${descText}</div>
            <div class="text-muted small mt-auto pt-2 border-top" style="font-size: 0.74rem;">
              <i class="fas fa-clock text-primary me-1"></i> Plazo: ${tier.timeLabel}
            </div>
          </div>
        `;
      });

      if (budgetDecoyGrid) {
        budgetDecoyGrid.innerHTML = cardsHtml;

        const cards = budgetDecoyGrid.querySelectorAll('.budget-decoy-card');
        cards.forEach(card => {
          card.addEventListener('click', () => {
            wizardState.isFlexibleBudget = false;
            if (flexibleBudgetBar) flexibleBudgetBar.classList.remove('selected');
            cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            wizardState.selectedTierIndex = parseInt(card.getAttribute('data-tier') || '2', 10);
            trackPFEvent('pf_budget_select', {
              tier_index: wizardState.selectedTierIndex,
              service: wizardState.selectedServiceKey,
              time: wizardState.selectedTime
            });
            renderStep3BudgetsAndDeliverables();
          });

          card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              card.click();
            }
          });
        });
      }

      // Renderizar los entregables que realmente caben en esta combinación
      renderFilteredDeliverables();
    }

    // Filtrar los entregables marcables del Paso 3
    function renderFilteredDeliverables() {
      const config = NATURAL_SERVICES_MATRIX[wizardState.selectedServiceKey] || NATURAL_SERVICES_MATRIX.web;
      const tierKey = wizardState.isFlexibleBudget ? 2 : wizardState.selectedTierIndex;
      const tier = config.tiers[tierKey];

      // Si pide urgente, solo se habilitan los entregables que se pueden acelerar
      const isUrgent = (wizardState.selectedTime === 'urgente');
      const allowedList = isUrgent ? tier.urgentAllowedDeliverables : null;

      wizardState.selectedDeliverables = [];
      let pillsHtml = '';

      tier.allDeliverables.forEach(item => {
        const canDeliverInUrgency = (!isUrgent) || (allowedList && allowedList.includes(item.text));

        if (canDeliverInUrgency) {
          wizardState.selectedDeliverables.push(item.text);
          pillsHtml += `
            <div class="select-pill-apple selected" data-text="${item.text}">
              <i class="${item.icon} text-primary"></i> ${item.text}
            </div>
          `;
        } else {
          // Entregable no viable en entrega urgente con este presupuesto (se muestra deshabilitado o informativo)
          pillsHtml += `
            <div class="select-pill-apple opacity-50" style="cursor: not-allowed; text-decoration: line-through;" title="Requiere tiempo normal de desarrollo">
              <i class="${item.icon} text-muted"></i> ${item.text} <span class="small text-danger ms-1">(Requiere tiempo normal)</span>
            </div>
          `;
        }
      });

      if (deliverablesPillGroup) {
        deliverablesPillGroup.innerHTML = pillsHtml;

        const pills = deliverablesPillGroup.querySelectorAll('.select-pill-apple:not(.opacity-50)');
        pills.forEach(pill => {
          pill.addEventListener('click', () => {
            const text = pill.getAttribute('data-text');
            if (pill.classList.contains('selected')) {
              pill.classList.remove('selected');
              wizardState.selectedDeliverables = wizardState.selectedDeliverables.filter(d => d !== text);
            } else {
              pill.classList.add('selected');
              if (!wizardState.selectedDeliverables.includes(text)) {
                wizardState.selectedDeliverables.push(text);
              }
            }
          });
        });
      }
    }

    // Botón para cambiar al tiempo normal con un solo clic si pidió urgente con presupuesto bajo
    if (btnSwitchToNormalTime) {
      btnSwitchToNormalTime.addEventListener('click', () => {
        wizardState.selectedTime = 'normal';
        trackPFEvent('pf_switch_normal_time', { service: wizardState.selectedServiceKey });

        // Actualizar visualmente la tarjeta de tiempo en el Paso 2
        const timeCards = document.querySelectorAll('#timeCardsGrid .time-custom-card');
        timeCards.forEach(c => {
          if (c.getAttribute('data-time') === 'normal') {
            c.classList.add('selected');
          } else {
            c.classList.remove('selected');
          }
        });

        // Re-renderizar el Paso 3 con los precios normales y todos los entregables disponibles
        renderStep3BudgetsAndDeliverables();
      });
    }

    // Compilación de la Tabla del Paso 4 (Lenguaje claro y humano)
    function compileStep4ProposalTable() {
      const config = NATURAL_SERVICES_MATRIX[wizardState.selectedServiceKey] || NATURAL_SERVICES_MATRIX.web;
      const tierKey = wizardState.isFlexibleBudget ? 2 : wizardState.selectedTierIndex;
      const tier = config.tiers[tierKey];

      const tableBudgetAmount = document.getElementById('tableBudgetAmount');
      const tableServiceTier = document.getElementById('tableServiceTier');
      const tableDeliveryTime = document.getElementById('tableDeliveryTime');
      const tableDeliverablesList = document.getElementById('tableDeliverablesList');
      const tablePaymentTerms = document.getElementById('tablePaymentTerms');

      const currentRange = wizardState.isFlexibleBudget ? 'A definir en conversación' : getCalculatedRangeUSD(tier);

      if (tableBudgetAmount) {
        tableBudgetAmount.innerText = currentRange;
      }
      if (tableServiceTier) {
        const timeText = wizardState.selectedTime === 'urgente' ? 'Prioridad Alta' : 'Tiempo Normal';
        tableServiceTier.innerHTML = `<strong>${config.title}</strong> &bull; ${tier.title} (${timeText})`;
      }
      if (tableDeliveryTime) {
        const customText = wizardState.selectedCustom === 'medida' ? 'Desarrollo a la medida' : 'Adaptado a tu empresa';
        tableDeliveryTime.innerText = `${tier.timeLabel} &bull; ${customText}`;
      }
      if (tableDeliverablesList) {
        if (wizardState.selectedDeliverables.length > 0) {
          tableDeliverablesList.innerHTML = wizardState.selectedDeliverables.map(d => `<span class="badge bg-light text-dark border me-1 mb-1">${d}</span>`).join(' ');
        } else {
          tableDeliverablesList.innerText = 'Alcance base de la opción elegida';
        }
      }
      if (tablePaymentTerms) {
        tablePaymentTerms.innerText = tier.paymentTerms;
      }
    }

    // Listeners del Paso 1: Selección de Servicio
    const solutionCards = document.querySelectorAll('.solution-option-card');
    solutionCards.forEach(card => {
      card.addEventListener('click', () => {
        solutionCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        wizardState.selectedServiceKey = card.getAttribute('data-service') || 'web';
        wizardState.selectedTierIndex = 2;
        wizardState.isFlexibleBudget = false;
        trackPFEvent('pf_service_select', { service: wizardState.selectedServiceKey });
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    // Listeners del Paso 2: Tiempo de Entrega
    const timeCards = document.querySelectorAll('#timeCardsGrid .time-custom-card');
    timeCards.forEach(card => {
      card.addEventListener('click', () => {
        timeCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        wizardState.selectedTime = card.getAttribute('data-time') || 'normal';
        trackPFEvent('pf_time_select', {
          time: wizardState.selectedTime,
          service: wizardState.selectedServiceKey
        });
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    // Listeners del Paso 2: Nivel de Personalización
    const customCards = document.querySelectorAll('#customLevelCardsGrid .time-custom-card');
    customCards.forEach(card => {
      card.addEventListener('click', () => {
        customCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        wizardState.selectedCustom = card.getAttribute('data-custom') || 'adaptado';
        trackPFEvent('pf_custom_select', {
          custom: wizardState.selectedCustom,
          service: wizardState.selectedServiceKey
        });
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    // Selects del Paso 2 y Paso 3
    const projectScaleSelect = document.getElementById('projectScaleSelect');
    if (projectScaleSelect) {
      projectScaleSelect.addEventListener('change', () => {
        wizardState.selectedScale = projectScaleSelect.value;
      });
    }

    const fiscalBillingSelect = document.getElementById('fiscalBillingSelect');
    if (fiscalBillingSelect) {
      fiscalBillingSelect.addEventListener('change', () => {
        wizardState.selectedBilling = fiscalBillingSelect.value;
      });
    }

    const projectDecisionStage = document.getElementById('projectDecisionStage');
    if (projectDecisionStage) {
      projectDecisionStage.addEventListener('change', () => {
        wizardState.selectedDecision = projectDecisionStage.value;
      });
    }

    // Barra flexible del Paso 3
    if (flexibleBudgetBar) {
      flexibleBudgetBar.addEventListener('click', () => {
        wizardState.isFlexibleBudget = true;
        const cards = budgetDecoyGrid.querySelectorAll('.budget-decoy-card');
        cards.forEach(c => c.classList.remove('selected'));
        flexibleBudgetBar.classList.add('selected');
        renderFilteredDeliverables();
      });
    }

    // Botones de Transición
    if (btnNextStep1) btnNextStep1.addEventListener('click', () => goToStep(2));
    if (btnBackStep2) btnBackStep2.addEventListener('click', () => goToStep(1));
    if (btnNextStep2) btnNextStep2.addEventListener('click', () => goToStep(3));
    if (btnBackStep3) btnBackStep3.addEventListener('click', () => goToStep(2));
    if (btnNextStep3) btnNextStep3.addEventListener('click', () => goToStep(4));
    if (btnBackStep4) btnBackStep4.addEventListener('click', () => goToStep(3));

    // Validación de Contacto
    function validateContactInputs() {
      const name = document.getElementById('clientName');
      const company = document.getElementById('clientCompany');
      const phone = document.getElementById('clientPhone');

      if (!name || !name.value.trim()) {
        alert('Por favor indícanos tu nombre completo.');
        if (name) name.focus();
        return false;
      }
      if (!company || !company.value.trim()) {
        alert('Por favor indícanos el nombre de tu empresa o proyecto.');
        if (company) company.focus();
        return false;
      }
      if (!phone || !phone.value.trim()) {
        alert('Por favor indícanos un número de teléfono o WhatsApp para enviarte la propuesta.');
        if (phone) phone.focus();
        return false;
      }
      return true;
    }

    // Construcción del Mensaje Humano y Directo
    function buildHumanExecutiveMessage() {
      const config = NATURAL_SERVICES_MATRIX[wizardState.selectedServiceKey] || NATURAL_SERVICES_MATRIX.web;
      const tierKey = wizardState.isFlexibleBudget ? 2 : wizardState.selectedTierIndex;
      const tier = config.tiers[tierKey];

      const name = document.getElementById('clientName') ? document.getElementById('clientName').value.trim() : '';
      const company = document.getElementById('clientCompany') ? document.getElementById('clientCompany').value.trim() : '';
      const phone = document.getElementById('clientPhone') ? document.getElementById('clientPhone').value.trim() : '';
      const email = document.getElementById('clientEmail') ? document.getElementById('clientEmail').value.trim() : '';
      const notes = document.getElementById('clientNotes') ? document.getElementById('clientNotes').value.trim() : '';

      const timeLabelMap = {
        urgente: 'Lo antes posible (~1 semana)',
        normal: 'Tiempo normal del proyecto (Precio estándar)',
        calma: 'Con calma / Por etapas (1 a 2 meses)'
      };

      const customLabelMap = {
        base: 'Solución base / Estándar',
        adaptado: 'Adaptado a los flujos de la empresa',
        medida: '100% a la medida desde cero'
      };

      const currentRange = wizardState.isFlexibleBudget ? 'A conversar / Por dimensionamiento' : getCalculatedRangeUSD(tier);

      let text = `*SOLICITUD DE COTIZACIÓN - PORTAFORZA*\n\n`;
      text += `Hola PortaForza, mi nombre es *${name}* de la empresa *${company}*.\n`;
      text += `Estuve evaluando las opciones en su página web y me interesa recibir una propuesta con estos parámetros:\n\n`;
      text += `• *Servicio:* ${config.title}\n`;
      text += `• *Plazo deseado:* ${timeLabelMap[wizardState.selectedTime] || 'Tiempo normal'}\n`;
      text += `• *Nivel de personalización:* ${customLabelMap[wizardState.selectedCustom] || 'Adaptado'}\n`;
      text += `• *Presupuesto estimado:* ${currentRange}\n`;
      text += `• *Opción elegida:* ${tier.title}\n`;
      text += `• *Forma de pago:* ${tier.paymentTerms}\n`;
      text += `• *Dimensión aproximada:* ${wizardState.selectedScale}\n`;
      text += `• *Facturación requerida:* ${wizardState.selectedBilling}\n\n`;

      if (wizardState.selectedDeliverables.length > 0) {
        text += `*Puntos específicos que me interesa incluir:*\n`;
        wizardState.selectedDeliverables.forEach(d => {
          text += ` - ${d}\n`;
        });
        text += `\n`;
      }

      if (notes) {
        text += `*Comentarios adicionales:* ${notes}\n\n`;
      }

      text += `Contacto: ${phone}${email ? ' | ' + email : ''}\n`;
      text += `Quedo atento para validar los detalles.`;

      return text;
    }

    // Envío por WhatsApp Business
    if (btnSubmitWhatsApp) {
      btnSubmitWhatsApp.addEventListener('click', () => {
        if (!validateContactInputs()) return;

        trackPFEvent('pf_lead_whatsapp', {
          service: wizardState.selectedServiceKey,
          time: wizardState.selectedTime,
          custom: wizardState.selectedCustom,
          tier_index: wizardState.selectedTierIndex,
          billing: wizardState.selectedBilling
        });
        trackPFEvent('generate_lead', {
          event_category: 'contact_form',
          event_label: wizardState.selectedServiceKey,
          method: 'whatsapp'
        });

        const message = buildHumanExecutiveMessage();
        const phoneNumber = '18494622228';
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      });
    }

    // Envío por Correo Electrónico
    if (btnSubmitEmail) {
      btnSubmitEmail.addEventListener('click', () => {
        if (!validateContactInputs()) return;

        trackPFEvent('pf_lead_email', {
          service: wizardState.selectedServiceKey,
          time: wizardState.selectedTime,
          custom: wizardState.selectedCustom,
          tier_index: wizardState.selectedTierIndex,
          billing: wizardState.selectedBilling
        });
        trackPFEvent('generate_lead', {
          event_category: 'contact_form',
          event_label: wizardState.selectedServiceKey,
          method: 'email'
        });

        const company = document.getElementById('clientCompany') ? document.getElementById('clientCompany').value.trim() : 'Empresa';
        const config = NATURAL_SERVICES_MATRIX[wizardState.selectedServiceKey] || NATURAL_SERVICES_MATRIX.web;

        const subject = encodeURIComponent(`Solicitud de Cotización [${config.title}] - ${company}`);
        const body = encodeURIComponent(buildHumanExecutiveMessage());
        const mailtoUrl = `mailto:contacto@portaforza.com?subject=${subject}&body=${body}`;
        window.location.href = mailtoUrl;
      });
    }

    // Parámetros de URL (?servicio=web o ?servicio=licencias)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const serviceParam = urlParams.get('servicio');
      const itemParam = urlParams.get('item');

      if (serviceParam && NATURAL_SERVICES_MATRIX[serviceParam]) {
        wizardState.selectedServiceKey = serviceParam;
        solutionCards.forEach(c => {
          if (c.getAttribute('data-service') === serviceParam) {
            c.classList.add('selected');
          } else {
            c.classList.remove('selected');
          }
        });
      }

      if (itemParam) {
        const notesField = document.getElementById('clientNotes');
        if (notesField) {
          notesField.value = `Interés en: ${itemParam}`;
        }
      }
    } catch (err) {
      console.warn('Error leyendo parámetros de URL:', err);
    }
  }
});
