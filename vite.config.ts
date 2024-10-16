import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig({
  // Aseta base poluksi sovelluksesi polku
  base: '/~samukan/Yksilotehtava/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'icons/*.png',
        'fonts/*.ttf',
      ],
      manifest: {
        theme_color: '#f69435',
        background_color: '#f69435',
        display: 'standalone',
        // Päivitä scope ja start_url vastaamaan sovelluksesi polkua
        scope: '/~samukan/Yksilotehtava/',
        start_url: '/~samukan/Yksilotehtava/',
        name: 'Restaurant App',
        short_name: 'RestoApp',
        icons: [
          {
            src: '/~samukan/Yksilotehtava/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/~samukan/Yksilotehtava/icons/icon-256x256.png',
            sizes: '256x256',
            type: 'image/png',
          },
          {
            src: '/~samukan/Yksilotehtava/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: '/~samukan/Yksilotehtava/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // Valinnainen: Voit mukauttaa välimuististrategioita täällä
      },
    }),
  ],
});
