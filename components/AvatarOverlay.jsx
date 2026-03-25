/**
 * AvatarOverlay.jsx
 * Avatar animado para ScreenBuddy3
 * Muestra diferentes estados según el porcentaje de uso
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';

// Estados del avatar
const STATES = {
  SLEEPING: 'sleeping',
  HAPPY: 'happy',
  ANXIOUS: 'anxious',
  DEAD: 'dead',
};

function getAvatarState(percent) {
  if (percent <= 0) return STATES.SLEEPING;
  if (percent < 50) return STATES.HAPPY;
  if (percent < 100) return STATES.ANXIOUS;
  return STATES.DEAD;
}

const STATE_CONFIG = {
  [STATES.SLEEPING]: {
    label: 'Durmiendo',
    bgColor: '#7EC8E3',
    glowColor: '#7EC8E350',
    messages: [
      '¡Buenos días! Todavía no has abierto ninguna app.',
      'Descansando... igual que tú deberías 😴',
    ],
  },
  [STATES.HAPPY]: {
    label: 'Feliz',
    bgColor: '#4CAF82',
    glowColor: '#4CAF8260',
    messages: [
      '¡Me siento genial, sigue así! 💪',
      '¡Vas de maravilla! 😄',
      '¡Eres increíble! Mantén ese ritmo.',
    ],
  },
  [STATES.ANXIOUS]: {
    label: 'Ansioso',
    bgColor: '#F5A623',
    glowColor: '#F5A62360',
    messages: [
      '¡Oye! Ya vamos por más de la mitad del tiempo… 😅',
      'Estoy empezando a sudar. ¿No podrías cerrar alguna app?',
      '¡El reloj avanza! 😬',
    ],
  },
  [STATES.DEAD]: {
    label: '¡Límite alcanzado!',
    bgColor: '#E8533A',
    glowColor: '#E8533A60',
    messages: [
      '¡Oye! Me estás haciendo daño 😵',
      '¡Límite superado! Necesito descansar…',
      '¡SOS! El cerebro necesita un break urgente 🆘',
    ],
  },
};

function AvatarFace({ state, bobAnim, shakeAnim }) {
  const cfg = STATE_CONFIG[state];

  const faceStyle = {
    transform: [
      { translateY: bobAnim },
      { translateX: shakeAnim },
    ],
  };

  return (
    <Animated.View style={[styles.avatarBody, faceStyle]}>
      {/* Cuerpo */}
      <View
        style={[
          styles.bodyShape,
          {
            backgroundColor:
              state === STATES.DEAD ? '#888888' : '#FFD166',
            shadowColor: cfg.glowColor,
            shadowRadius: 20,
            shadowOpacity: 1,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        {/* Cara */}
        <View style={styles.faceContainer}>
          {state === STATES.DEAD ? (
            // Cara de muerto: X_X
            <View style={styles.deadFace}>
              <Text style={styles.deadEye}>✕</Text>
              <View style={styles.deadNose} />
              <Text style={styles.deadEye}>✕</Text>
            </View>
          ) : state === STATES.SLEEPING ? (
            <View style={styles.normalFace}>
              <View style={styles.closedEye} />
              <View style={styles.closedEye} />
            </View>
          ) : state === STATES.ANXIOUS ? (
            <View style={styles.normalFace}>
              <View style={styles.worriedEye} />
              <View style={styles.worriedEye} />
            </View>
          ) : (
            // HAPPY
            <View style={styles.normalFace}>
              <View style={styles.happyEye} />
              <View style={styles.happyEye} />
            </View>
          )}

          {/* Boca */}
          {state === STATES.HAPPY && <View style={styles.happyMouth} />}
          {state === STATES.ANXIOUS && <View style={styles.worriedMouth} />}
          {state === STATES.SLEEPING && <View style={styles.sleepingMouth} />}
          {state === STATES.DEAD && <View style={styles.deadMouth} />}
        </View>

        {/* Gota de sudor en ANXIOUS */}
        {state === STATES.ANXIOUS && (
          <View style={styles.sweatDrop}>
            <Text>💧</Text>
          </View>
        )}

        {/* ZZZ en SLEEPING */}
        {state === STATES.SLEEPING && (
          <View style={styles.zzzContainer}>
            <Text style={styles.zzzText}>z z z</Text>
          </View>
        )}
      </View>

      {/* Brazos */}
      {(state === STATES.HAPPY || state === STATES.ANXIOUS) && (
        <>
          <View style={[styles.arm, styles.armLeft]} />
          <View style={[styles.arm, styles.armRight]} />
        </>
      )}
      {state === STATES.DEAD && (
        <>
          <View style={[styles.arm, styles.armLeftDead]} />
          <View style={[styles.arm, styles.armRightDead]} />
        </>
      )}

      {/* Piernas */}
      <View style={styles.legsContainer}>
        <View
          style={[
            styles.leg,
            state === STATES.DEAD && styles.legDead,
          ]}
        />
        <View
          style={[
            styles.leg,
            state === STATES.DEAD && styles.legDead,
          ]}
        />
      </View>

      {/* Estrellas decorativas en HAPPY */}
      {state === STATES.HAPPY && (
        <View style={styles.starsContainer}>
          <Text style={styles.star}>✦</Text>
          <Text style={[styles.star, { top: 10, left: 70 }]}>✦</Text>
          <Text style={[styles.star, { top: -10, left: 30 }]}>✦</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function AvatarOverlay({ usagePercent = 0, onPress }) {
  const avatarState = getAvatarState(usagePercent);
  const cfg = STATE_CONFIG[avatarState];

  // Animaciones
  const bobAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const speechOpacity = useRef(new Animated.Value(0)).current;
  const speechTranslate = useRef(new Animated.Value(10)).current;

  const [message, setMessage] = useState('');
  const [showSpeech, setShowSpeech] = useState(false);

  // Animación flotante (bob)
  useEffect(() => {
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: avatarState === STATES.SLEEPING ? -6 : -10,
          duration: avatarState === STATES.SLEEPING ? 1200 : 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: avatarState === STATES.SLEEPING ? 1200 : 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    let shakeLoop;
    if (avatarState === STATES.ANXIOUS) {
      shakeLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 3, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -3, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
          Animated.delay(1500),
        ])
      );
    }

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
      ])
    );

    bobLoop.start();
    glowLoop.start();
    shakeLoop?.start();

    return () => {
      bobLoop.stop();
      glowLoop.stop();
      shakeLoop?.stop();
    };
  }, [avatarState]);

  // Al tocar: mostrar speech bubble
  const handlePress = () => {
    const msgs = cfg.messages;
    const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
    setMessage(randomMsg);
    setShowSpeech(true);

    // Animación de entrada
    speechOpacity.setValue(0);
    speechTranslate.setValue(10);
    Animated.parallel([
      Animated.timing(speechOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(speechTranslate, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    // Squish al tocar
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.08, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    // Ocultar tras 3s
    setTimeout(() => {
      Animated.timing(speechOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(
        () => setShowSpeech(false)
      );
    }, 3000);

    onPress?.();
  };

  return (
    <View style={styles.container}>
      {/* Speech bubble */}
      {showSpeech && (
        <Animated.View
          style={[
            styles.speechBubble,
            {
              opacity: speechOpacity,
              transform: [{ translateY: speechTranslate }],
            },
          ]}
        >
          <Text style={styles.speechText}>{message}</Text>
          <View style={styles.speechTail} />
        </Animated.View>
      )}

      {/* Avatar principal */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={styles.avatarTouchable}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {/* Glow de fondo */}
          <Animated.View
            style={[
              styles.glow,
              {
                backgroundColor: cfg.glowColor,
                opacity: glowAnim,
              },
            ]}
          />
          <AvatarFace
            state={avatarState}
            bobAnim={bobAnim}
            shakeAnim={shakeAnim}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Badge de porcentaje */}
      <View style={[styles.badge, { backgroundColor: cfg.bgColor }]}>
        <Text style={styles.badgeText}>{Math.round(usagePercent)}%</Text>
      </View>
    </View>
  );
}

const AVATAR_SIZE = 110;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },

  // Speech bubble
  speechBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    maxWidth: 240,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#E0D8CC',
  },
  speechText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1410',
    lineHeight: 18,
    textAlign: 'center',
  },
  speechTail: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },

  // Badge %
  badge: {
    marginTop: 12,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Avatar touchable
  avatarTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Glow
  glow: {
    position: 'absolute',
    width: AVATAR_SIZE + 30,
    height: AVATAR_SIZE + 30,
    borderRadius: (AVATAR_SIZE + 30) / 2,
    alignSelf: 'center',
    top: -15,
  },

  // Avatar body
  avatarBody: {
    alignItems: 'center',
    width: AVATAR_SIZE,
  },
  bodyShape: {
    width: 72,
    height: 88,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },

  // Cara
  faceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  normalFace: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  happyEye: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1A1410',
  },
  worriedEye: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1A1410',
    borderTopWidth: 2,
    borderTopColor: '#1A1410',
    transform: [{ scaleY: 0.7 }],
  },
  closedEye: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1A1410',
  },
  deadFace: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 4,
  },
  deadEye: {
    fontSize: 14,
    fontWeight: '900',
    color: '#444',
  },
  deadNose: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
  },

  // Bocas
  happyMouth: {
    width: 24,
    height: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 2.5,
    borderColor: '#1A1410',
    borderTopWidth: 0,
    marginTop: 2,
  },
  worriedMouth: {
    width: 20,
    height: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 2.5,
    borderColor: '#1A1410',
    borderBottomWidth: 0,
    marginTop: 4,
  },
  sleepingMouth: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1A1410',
    marginTop: 6,
    opacity: 0.6,
  },
  deadMouth: {
    width: 22,
    height: 10,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    borderWidth: 2.5,
    borderColor: '#666',
    borderBottomWidth: 0,
    marginTop: 4,
    opacity: 0.7,
  },

  // Decoraciones
  sweatDrop: {
    position: 'absolute',
    top: 4,
    right: -8,
    fontSize: 16,
  },
  zzzContainer: {
    position: 'absolute',
    top: -14,
    right: -18,
  },
  zzzText: {
    fontSize: 12,
    color: '#7EC8E3',
    fontWeight: '800',
    fontStyle: 'italic',
  },

  // Brazos
  arm: {
    position: 'absolute',
    width: 14,
    height: 36,
    borderRadius: 7,
    backgroundColor: '#FFD166',
  },
  armLeft: {
    left: -6,
    top: 20,
    transform: [{ rotate: '-30deg' }],
  },
  armRight: {
    right: -6,
    top: 20,
    transform: [{ rotate: '30deg' }],
  },
  armLeftDead: {
    left: -4,
    top: 30,
    backgroundColor: '#888',
    transform: [{ rotate: '45deg' }],
  },
  armRightDead: {
    right: -4,
    top: 30,
    backgroundColor: '#888',
    transform: [{ rotate: '-45deg' }],
  },

  // Piernas
  legsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  leg: {
    width: 16,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFD166',
  },
  legDead: {
    backgroundColor: '#888',
    transform: [{ rotate: '15deg' }],
  },

  // Estrellas
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 110,
    height: 110,
  },
  star: {
    position: 'absolute',
    fontSize: 14,
    color: '#4CAF82',
    top: 0,
    left: 0,
  },
});
