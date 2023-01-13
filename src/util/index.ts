export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function wrap(value: number, max: number) {
  return ((value % max) + max) % max;
}

/**
 * Escape special characters that would cause errors if we interpolated them
 * into a regex.
 * @param expression The string to escape.
 * @returns The escaped string, usable in a regular expression constructor.
 */
export function escapeForRegex(expression: string): string {
  return expression.replaceAll(/[\\^$*+?.()|[\]{}]/g, "\\$&");
}

/* eslint-disable no-param-reassign, @typescript-eslint/unified-signatures */

/** Returns a random number between min (inclusive) and max (inclusive). */
export function randomFloat(max: number): number;
export function randomFloat(min: number, max: number): number;
export function randomFloat(min: number, max?: number): number {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  if (max < min) {
    [min, max] = [max, min];
  }
  return Math.random() * (max - min) + min;
}

/** Returns a random number between min (inclusive) and max (exclusive). */
export function randomInt(max: number): number;
export function randomInt(min: number, max: number): number;
export function randomInt(min: number, max?: number): number {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  if (max < min) {
    [min, max] = [max, min];
  }
  return Math.floor(Math.random() * (max - min)) + min;
}

export function randomInArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomBag<T>(arr: T[], count = 1): T[] {
  if (count === 1) return [randomInArray(arr)];
  const values = [];
  const bag = [...arr];
  while (count > 0 && bag.length > 0) {
    values.push(...bag.splice(Math.floor(Math.random() * bag.length), 1));
    count--;
  }
  return values;
}

/* eslint-enable no-param-reassign, @typescript-eslint/unified-signatures */

export interface WeightedValues {
  [value: string]: number;
}
export function randomByWeight<T>(weights: [T, number][] | Map<T, number>): T;
export function randomByWeight<T extends WeightedValues, K extends keyof T>(
  weights: T
): K;
export function randomByWeight(
  weights: [any, number][] | Map<any, number> | WeightedValues
): any {
  const weightPairs: [any, number][] =
    weights instanceof Map
      ? [...weights.entries()]
      : Array.isArray(weights)
      ? weights
      : Object.entries(weights);

  const keys: any[] = [];
  const values: number[] = [];
  for (const [k, v] of weightPairs) {
    keys.push(k);
    values.push(v);
  }

  const sum = values.reduce((p, c) => {
    if (c < 0) throw new Error("Negative weight!");
    return p + c;
  }, 0);
  if (sum === 0) throw new Error("Weights add up to zero!");
  const choose = Math.floor(Math.random() * sum);

  for (let i = 0, count = 0; i < keys.length; i++) {
    count += values[i];
    if (count > choose) {
      return keys[i];
    }
  }
  throw new Error("We goofed!");
}

/**
 * @param rgb A tuple with values in the interval [0-255].
 * @returns A tuple with values in the interval [0-360] for hue and [0-100] for
 * saturation and value.
 */
export function rgbToHSV(
  rgb: [number, number, number]
): [number, number, number] {
  const r = clamp(rgb[0] / 255, 0, 1);
  const g = clamp(rgb[1] / 255, 0, 1);
  const b = clamp(rgb[2] / 255, 0, 1);

  let h: number;
  let s: number;
  const v = Math.max(r, g, b);

  const diff = v - Math.min(r, g, b);
  const diffc = (c: number) => (v - c) / 6 / diff + 1 / 2;

  if (diff === 0) {
    h = 0;
    s = 0;
  } else {
    s = diff / v;
    const rdif = diffc(r);
    const gdif = diffc(g);
    const bdif = diffc(b);

    if (r === v) {
      h = bdif - gdif;
    } else if (g === v) {
      h = 1 / 3 + rdif - bdif;
    } else {
      h = 2 / 3 + gdif - rdif;
    }

    if (h < 0) {
      h += 1;
    } else if (h > 1) {
      h -= 1;
    }
  }

  return [h * 360, s * 100, v * 100];
}

/**
 * @param hsv A tuple with values in the interval [0-360] for hue and [0-100] for
 * saturation and value.
 * @returns A tuple with values in the interval [0-255].
 */
export function hsvToRGB(
  hsv: [number, number, number]
): [number, number, number] {
  const h = wrap(hsv[0], 360) / 60;
  const s = clamp(hsv[1], 0, 100) / 100;
  let v = clamp(hsv[2], 0, 100) / 100;

  const hi = Math.floor(h) % 6;

  const f = h - Math.floor(h);
  const p = 255 * v * (1 - s);
  const q = 255 * v * (1 - s * f);
  const t = 255 * v * (1 - s * (1 - f));
  v *= 255;

  switch (hi) {
    case 0:
      return [v, t, p];
    case 1:
      return [q, v, p];
    case 2:
      return [p, v, t];
    case 3:
      return [p, q, v];
    case 4:
      return [t, p, v];
    case 5:
      return [v, p, q];
    default:
      throw new Error(`Invalid hue interval: ${hi}`);
  }
}
