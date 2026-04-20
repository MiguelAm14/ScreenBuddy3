/**
 * Constantes de la aplicación
 */

/**
 * Apps monitoreables disponibles
 * packageName debe coincidir exactamente con el nombre del paquete en Android
 */
export const MONITOREABLE_APPS_ARRAY = [
  { name: 'Instagram',   packageName: 'com.instagram.android',      icon: '📸', color: '#833AB4' },
  { name: 'TikTok',      packageName: 'com.zhiliaoapp.tiktok',      icon: '🎵', color: '#010101' },
  { name: 'YouTube',     packageName: 'com.google.android.youtube', icon: '▶️', color: '#FF0000' },
  { name: 'WhatsApp',    packageName: 'com.whatsapp',               icon: '💬', color: '#25D366' },
  { name: 'X (Twitter)', packageName: 'com.twitter.android',        icon: '𝕏',  color: '#14171A' },
  { name: 'Snapchat',    packageName: 'com.snapchat.android',       icon: '👻', color: '#FFFC00' },
  { name: 'Facebook',    packageName: 'com.facebook.katana',        icon: '👍', color: '#1877F2' },
  { name: 'Netflix',     packageName: 'com.netflix.mediaclient',    icon: '🎬', color: '#E50914' },
  { name: 'Twitch',      packageName: 'tv.twitch.android.app',      icon: '🎮', color: '#9146FF' },
  { name: 'Spotify',     packageName: 'com.spotify.music',          icon: '🎧', color: '#1DB954' },
  { name: 'Reddit',      packageName: 'com.reddit.frontpage',       icon: '🤖', color: '#FF4500' },
  { name: 'Pinterest',   packageName: 'com.pinterest',              icon: '📌', color: '#E60023' },
  { name: 'Telegram',    packageName: 'org.telegram.messenger',     icon: '✈️', color: '#2CA5E0' },
  { name: 'LinkedIn',    packageName: 'com.linkedin.android',       icon: '💼', color: '#0A66C2' },
  { name: 'BeReal',      packageName: 'com.bereal.ft',              icon: '📷', color: '#000000' },
];

export const MONITOREABLE_APPS_MAP = MONITOREABLE_APPS_ARRAY.reduce((acc, app) => {
  acc[app.packageName] = app;
  return acc;
}, {});

/**
 * Umbrales de presupuesto por defecto (en minutos)
 */
export const DEFAULT_BUDGET = 120;

/**
 * Factores de cálculo de umbrales
 */
export const THRESHOLD_FACTORS = {
  warn:  0.50,  // 50% - Aviso
  alert: 0.80,  // 80% - Alerta
  limit: 1.00,  // 100% - Límite
};

export default {
  MONITOREABLE_APPS_ARRAY,
  MONITOREABLE_APPS_MAP,
  DEFAULT_BUDGET,
  THRESHOLD_FACTORS,
};
