import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

function injectScript(id: string, html: string) {
  if (document.getElementById(id)) return;
  const container = document.createElement('div');
  container.id = id;
  container.innerHTML = html;
  document.head.append(...Array.from(container.childNodes));
}

function injectMeta(name: string, content: string) {
  if (document.querySelector(`meta[name="${name}"]`)) return;
  const tag = document.createElement('meta');
  tag.name = name;
  tag.content = content;
  document.head.appendChild(tag);
}

/**
 * Lee public_settings (lectura pública, sin auth) e inyecta el Pixel de Meta,
 * gtag.js de Google y el meta tag de verificación de Search Console.
 * Se monta una sola vez en App.tsx.
 */
export function TrackingScripts() {
  useEffect(() => {
    let active = true;
    supabase
      .from('public_settings')
      .select('key, value')
      .then(({ data }) => {
        if (!active || !data) return;
        const settings = Object.fromEntries(data.map((row) => [row.key, row.value]));

        const pixelId = settings.meta_pixel_id;
        if (pixelId) {
          injectScript(
            'meta-pixel',
            `<script>
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
              document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixelId}');
              fbq('track', 'PageView');
            </script>`
          );
        }

        const gaId = settings.ga_measurement_id;
        if (gaId) {
          injectScript(
            'google-gtag',
            `<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
             <script>
               window.dataLayer = window.dataLayer || [];
               function gtag(){dataLayer.push(arguments);}
               gtag('js', new Date());
               gtag('config', '${gaId}');
             </script>`
          );
        }

        const gtmId = settings.gtm_container_id;
        if (gtmId) {
          injectScript(
            'google-tag-manager',
            `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');</script>`
          );
        }

        const gscContent = settings.gsc_verification_content;
        if (gscContent) {
          injectMeta('google-site-verification', gscContent);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return null;
}
