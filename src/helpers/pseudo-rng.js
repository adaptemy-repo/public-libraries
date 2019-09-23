"use strict";
/**
 * Creates a pseudo-random value generator. The seed must be an integer.
 *
 * Uses an optimized version of the Park-Miller PRNG.
 * http://www.firstpr.com.au/dsp/rand31/
 */
export function Random(seed) {
  this._seed = seed % 2147483647;
  if (this._seed <= 0) this._seed += 2147483646;
}

/**
 * Returns a pseudo-random value between 1 and 2^32 - 2.
 */
Random.prototype.next = function() {
  this._seed = (this._seed * 16807) % 2147483647;
  return this._seed;
};

/**
 * Returns a pseudo-random floating point number in range [0, 1).
 */
Random.prototype.nextFloat = function(opt_minOrMax, opt_max) {
  // We know that result of next() will be 1 to 2147483646 (inclusive).
  return (this.next() - 1) / 2147483646;
};

function getRandomArray(seed, length) {
  var prng = new Random(seed),
    arr = [];
  for (var count = 0; count < length; count++) {
    arr.push(prng.next());
  }
  return arr;
}

export function sortArrayRandomly(seed, arr) {
  var ordering = getRandomArray(seed, arr.length);
  var newArr = [].concat(arr);
  return newArr.sort(function(a, b) {
    var locationA = newArr.indexOf(a);
    var locationB = newArr.indexOf(b);
    return ordering[locationA] - ordering[locationB];
  });
}
