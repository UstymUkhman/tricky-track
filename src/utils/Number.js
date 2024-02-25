/** @param {number} min @param {number} max @param {number} value */
export const smoothstep = (min, max, value) => Math.max(0, Math.min(1, (value - min) / (max - min)));

/** @param {number} value1 @param {number} value2 @param {number} percent */
export const mix = (value1, value2, percent) => value1 * (1 - percent) + value2 * percent;

/** @param {number} value @param {number} min @param {number} max */
export const map = (value, min, max) => clamp((value - min) / (max - min), min, max);

/** @param {number} min @param {number} max */
export const randomInt = (min, max) => (Math.random() * (max - min + 1) | 0) + min;

/** @param {number} value */
export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(value, max));
/** @param {number} min @param {number} max */

export const random = (min, max) => Math.random() * (max - min) + min;

/** @param {number} v0 @param {number} v1 @param {number} t */
export const lerp = (v0, v1, t) => v0 + t * (v1 - v0);

export const PI = Object.freeze({ m2: Math.PI * 2, d2: Math.PI * 0.5 });

/** @param {number} value */
export const toFixed = (value, mantissa = 2) => {
  const pow10 = Math.pow(10, mantissa);
  return ~~(pow10 * value) / pow10;
};

export const PHI = Math.sqrt(5) * 0.5 + 0.5;
export const DELTA_UPDATE = 1 / 0.06;
export const DELTA_FRAME = 1 / 60;
