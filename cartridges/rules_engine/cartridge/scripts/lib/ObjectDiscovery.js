const Class = require('~/cartridge/scripts/util/Class').Class;

/**
 * @class
 * @name ObjectDiscovery
 *
 * @description A utility class for discovering and checking the types of objects.
 *
 * @method conditionType Returns the type of condition.
 * @method isObject Checks if a given parameter is an object.
 * @method isCondition Checks if a given object is a condition.
 * @method isConstraint Checks if a given object is a constraint.
 * @method resolveNestedProperty Resolves a nested property from a string as an object path.
 */
const ObjectDiscovery = Class.extend({
  conditionType(condition) {
    if ('any' in condition) return 'any';
    if ('all' in condition) return 'all';
    if ('none' in condition) return 'none';

    return null;
  },

  /**
   * Checks if the param is an object
   * @param {unknown} obj
   * @returns {boolean}
   */
  isObject(obj) {
    return 'object' === typeof obj && !Array.isArray(obj) && obj !== null;
  },

  /**
   * Checks if the object is a condition
   * @param {unknown} obj
   * @returns {boolean}
   */
  isCondition(obj) {
    return !this.isObject(obj)
      ? false
      : 'any' in obj || 'all' in obj || 'none' in obj;
  },

  /**
   * Checks if the object is a constraint
   * @param {unknown} obj
   * @returns {boolean}
   */
  isConstraint(obj) {
    return !this.isObject(obj)
      ? false
      : 'field' in obj && 'operator' in obj && 'value' in obj;
  },

  /**
   * Resolves a nested property from a sting as an object path.
   * @param {string} path
   * @param {Object} obj
   * @returns {any}
   */
  resolveNestedProperty(path, obj) {
    return path.split('.').reduce((prev, curr) => {
      return prev ? prev[curr] : undefined;
    }, obj);
  }
});

module.exports = ObjectDiscovery;
