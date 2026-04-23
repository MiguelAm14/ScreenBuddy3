/**
 * Servicio para obtener metadata dinámica de apps
 * Enriquece apps con nombres, iconos, colores
 * 
 * Este servicio permite support ilimitado de apps
 * No depende de lista hardcodeada de 15 apps conocidas
 */

// Mapa de apps conocidas con metadata (no es restrictivo, solo enriquecimiento)
const KNOWN_APPS_METADATA = {
  'com.instagram.android': { name: 'Instagram', icon: '📸', color: '#833AB4' },
  'com.zhiliaoapp.tiktok': { name: 'TikTok', icon: '🎵', color: '#010101' },
  'com.google.android.youtube': { name: 'YouTube', icon: '▶️', color: '#FF0000' },
  'com.whatsapp': { name: 'WhatsApp', icon: '💬', color: '#25D366' },
  'com.twitter.android': { name: 'X (Twitter)', icon: '𝕏', color: '#14171A' },
  'com.snapchat.android': { name: 'Snapchat', icon: '👻', color: '#FFFC00' },
  'com.facebook.katana': { name: 'Facebook', icon: '👍', color: '#1877F2' },
  'com.netflix.mediaclient': { name: 'Netflix', icon: '🎬', color: '#E50914' },
  'tv.twitch.android.app': { name: 'Twitch', icon: '🎮', color: '#9146FF' },
  'com.spotify.music': { name: 'Spotify', icon: '🎧', color: '#1DB954' },
  'com.reddit.frontpage': { name: 'Reddit', icon: '🤖', color: '#FF4500' },
  'com.pinterest': { name: 'Pinterest', icon: '📌', color: '#E60023' },
  'org.telegram.messenger': { name: 'Telegram', icon: '✈️', color: '#2CA5E0' },
  'com.linkedin.android': { name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
  'com.bereal.ft': { name: 'BeReal', icon: '📷', color: '#000000' },
};

/**
 * Enriquece un app con metadata (nombre, icono, color)
 * Si el app es conocido, usa metadata predefinida
 * Si no, usa packageName como nombre y emoji genérico
 * 
 * @param {string} packageName - Package name del app
 * @param {object} existingMetadata - Metadata ya conocida (opcional)
 * @returns {object} App enriquecido con { packageName, name, icon, color }
 */
export function enrichAppMetadata(packageName, existingMetadata = {}) {
  // Si ya tiene metadata completa, retornar
  if (existingMetadata.name && existingMetadata.icon && existingMetadata.color) {
    return existingMetadata;
  }

  // Buscar en mapa de apps conocidos
  const knownMetadata = KNOWN_APPS_METADATA[packageName];
  
  if (knownMetadata) {
    return {
      packageName,
      ...knownMetadata,
      ...existingMetadata,
    };
  }

  // Si no está en lista conocida, generar metadata genérica
  const genericName = packageName
    .split('.')
    .pop()
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    packageName,
    name: genericName || packageName,
    icon: '📱',
    color: '#CCCCCC',
    ...existingMetadata,
  };
}

/**
 * Enriquece array de apps con metadata
 * 
 * @param {array} apps - Array de apps (pueden ser solo packageNames o objetos)
 * @returns {array} Apps enriquecidos con metadata
 */
export function enrichAppsMetadata(apps) {
  return apps.map(app => {
    if (typeof app === 'string') {
      // Si es solo string (packageName), enriquecer
      return enrichAppMetadata(app);
    }
    // Si es objeto, enriquecer lo que falta
    return enrichAppMetadata(app.packageName, app);
  });
}

/**
 * Obtiene lista de apps conocidos (mapa de referencia)
 * Útil para debugging o UI de sugerencias
 * 
 * @returns {array} Array de apps conocidos
 */
export function getKnownAppsMetadata() {
  return Object.entries(KNOWN_APPS_METADATA).map(([packageName, metadata]) => ({
    packageName,
    ...metadata,
    isKnown: true,
  }));
}
