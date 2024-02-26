/** @param {number} value */
export function clamp(value, min = 0, max = 1)
{
    return Math.max(min, Math.min(value, max));
}

/** @param {number} value1 @param {number} value2 @param {number} percent */
export function mix(value1, value2, percent)
{
    return value1 * (1 - percent) + value2 * percent;
}

/** @param {number} min @param {number} max @param {number} value */
export function smoothstep(min, max, value)
{
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/** @param {number} value @param {number} min @param {number} max */
export function map(value, min, max)
{
    return clamp((value - min) / (max - min), min, max);
}

/** @param {number} min @param {number} max */
export function randomInt(min, max)
{
    return (Math.random() * (max - min + 1) | 0) + min;
}

/** @param {number} min @param {number} max */
export function random(min, max)
{
    return Math.random() * (max - min) + min;
}

/** @param {number} v0 @param {number} v1 @param {number} t */
export function lerp(v0, v1, t)
{
    return v0 + t * (v1 - v0);
}

/** @param {number} value */
export function toFixed(value, mantissa = 2)
{
  const pow10 = Math.pow(10, mantissa);
  return ~~(pow10 * value) / pow10;
};

export const PHI = Math.sqrt(5) * 0.5 + 0.5;
export const DELTA_UPDATE = 1 / 0.06;
export const DELTA_FRAME = 1 / 60;

export const PI = Object.freeze(
    {
        m2: Math.PI * 2,
        d2: Math.PI * 0.5
    }
);
