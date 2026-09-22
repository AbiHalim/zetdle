/**
 * A tiny seeded random number generator.
 *
 * Math.random() gives a different sequence every time, which is useless for a
 * daily puzzle: two players would see different problems. Instead we turn the
 * date string into a number (the "seed") and use it to drive a deterministic
 * generator, so the same date always replays the exact same sequence.
 */

/**
 * xmur3: hashes a string into a 32-bit seed.
 * Two different strings almost always give very different seeds.
 */
export function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }
}

/**
 * mulberry32: given a seed, returns a function that produces numbers in [0, 1)
 * just like Math.random() - but always the same sequence for the same seed.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Convenience: hash a string and return a random function seeded with it. */
export function createRng(seedString: string): () => number {
  return mulberry32(xmur3(seedString)())
}

/** Random whole number between min and max, both inclusive. */
export function randInt(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1))
}
