/**
 * Converts a camelCase string to snake_case.
 * @param {string} str
 * @returns {string}
 */
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Transforms all top-level keys of an object from camelCase to snake_case.
 * @param {Object} obj
 * @returns {Object}
 */
function camelToSnakeKeys(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  const newObj = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = camelToSnake(key);
    newObj[snakeKey] = obj[key];
  }

  return newObj;
}

module.exports = { camelToSnake, camelToSnakeKeys };
