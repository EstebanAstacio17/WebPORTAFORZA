// =========================================================================
// 0. CONFIGURACIÓN CENTRALIZADA DE ANALÍTICAS (Google Analytics 4 & Clarity)
// =========================================================================
const PORTAFORZA_ANALYTICS_CONFIG = {
  // ID oficial de medición de Google Analytics 4
  ga4Id: 'G-SNBFKXMWR0',
  // ID de proyecto de Microsoft Clarity (opcional)
  clarityId: '',
  // Modo depuración: imprime cada evento de conversión en la consola del navegador
  debug: false
};

// Inicializador seguro de Google Analytics 4 y Microsoft Clarity
function initPortaForzaAnalytics() {
  // 1. Google Analytics 4 (GTAG Oficial)
  if (PORTAFORZA_ANALYTICS_CONFIG.ga4Id && PORTAFORZA_ANALYTICS_CONFIG.ga4Id.trim() !== '') {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', PORTAFORZA_ANALYTICS_CONFIG.ga4Id, {
      send_page_view: true,
      currency: 'USD'
    });

    if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${PORTAFORZA_ANALYTICS_CONFIG.ga4Id}`;
      document.head.appendChild(gaScript);
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