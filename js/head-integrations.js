// ============================================
// HEAD INTEGRATIONS — Add GA4, GSC, GTM, etc.
// ============================================
// Paste your codes BELOW this line:

// --- Google Analytics 4 ---
(function(){
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-Z1V88057Q6';
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-Z1V88057Q6');
})();

// --- Google Search Console Verification ---
// Replace googleXXXXXXXXXX.html with your actual verification filename
// var gscMeta = document.createElement('meta');
// gscMeta.name = 'google-site-verification';
// gscMeta.content = 'YOUR_VERIFICATION_CODE_HERE';
// document.head.appendChild(gscMeta);

// --- Google Tag Manager (Head) ---
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MNNKVS2X');

// --- Facebook Pixel ---
// Replace XXXXXXXXXXXXXXXX with your Pixel ID
// (function(){
//   var s = document.createElement('script');
//   s.async = true;
//   s.src = 'https://connect.facebook.net/en_US/fbevents.js';
//   document.head.appendChild(s);
//   window.fbq = function(){fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);};
//   if (!window._fbq) window._fbq = fbq;
//   fbq('init', 'XXXXXXXXXXXXXXXX');
//   fbq('track', 'PageView');
// })();

// --- Add more head scripts below ---
