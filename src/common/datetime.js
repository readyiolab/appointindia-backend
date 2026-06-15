/**
 * Converts ISO / JS date strings to MySQL DATETIME format (YYYY-MM-DD HH:mm:ss).
 */
function toMySQLDatetime(value) {
  if (value == null || value === '') {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = { toMySQLDatetime };
