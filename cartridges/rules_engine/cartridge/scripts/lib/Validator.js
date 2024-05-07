const Class = require('~/cartridge/scripts/util/Class').Class;
const ObjectDiscovery = require('~/cartridge/scripts/lib/ObjectDiscovery');

/**
 * @typedef {import('./rule.jsdoc').Rule} Rule
 * @typedef {import('./rule.jsdoc').Constraint} Constraint
 * @typedef {import('./rule.jsdoc').Operator} Operator
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Indicates if the validation was successful.
 * @property {Object} [error] - Contains error details, if any.
 * @property {string} error.message - The error message.
 * @property {Object} error.element - The element that caused the error.
 */

/**
 * @class
 * @name Validator
 * @description A class that validates rules. It checks if the rule is a valid JSON object and if it contains at least one condition.
 */
const Validator = Class.extend({
  /**
   * @constructor
   * @description Initializes the Validator with an ObjectDiscovery.
   */
  init: function () {
    this._objectDiscovery = new ObjectDiscovery();
  },

  /**
   * @method
   * @name validate
   * @param {Object} rule - The rule to validate.
   * @returns {Object} - The result of the validation.
   * @description Validates a rule. It checks if the rule is a valid JSON object and if it contains at least one condition.
   */
  validate: function (rule) {
    const result = {isValid: true};

    // Check the rule is a valid JSON
    if (!this._objectDiscovery.isObject(rule)) {
      return {
        isValid: false,
        error: {
          message: "The rule must be a valid JSON object.",
          element: rule,
        },
      };
    }

    const conditions =
      rule.conditions instanceof Array ? rule.conditions : [rule.conditions];

    if (
      conditions.length === 0 ||
      (this._objectDiscovery.isObject(conditions[0]) &&
        !Object.keys(conditions[0]).length)
    ) {
      return {
        isValid: false,
        error: {
          message:
            "The conditions property must contain at least one condition.",
          element: rule,
        },
      };
    }

    return result;
  },

  /**
   * @method
   * @name _validateCondition
   * @param {Object} condition - The condition to validate.
   * @param {number} depth - The depth of the condition in the rule.
   * @description Validates a condition. It is a private method.
   * @private
   */
  _validateCondition: function (condition, depth) {
    if (typeof depth === 'undefined') {
      depth = 0;
    }
  },

  /**
   * @method
   * @name _validateConstraint
   * @param {Object} constraint - The constraint to validate.
   * @returns {Object} - The result of the validation.
   * @description Validates a constraint. It checks if the field is a string and if the operator is valid.
   * @private
   */
  _validateConstraint: function (constraint) {
    if ("string" !== typeof constraint.field) {
      return {
        isValid: false,
        error: {
          message: 'Constraint "field" must be of type string.',
          element: constraint,
        },
      };
    }

    /**
     *
     * @type {Array<Operator>}
     */
    const operators = [
      "equals",
      "does not equal",
      "greater than",
      "less than",
      "greater than or equal",
      "less than or equal",
      "exists",
      "does not exist",
      "in",
      "not in",
      "contains",
      "not contains",
      "contains any",
      "not contains any",
      "matches",
      "does not match",
    ];

    if (!operators.includes(constraint.operator)) {
      return {
        isValid: false,
        error: {
          message: 'Constraint "operator" has invalid type.',
          element: constraint,
        },
      };
    }
  },

  /**
   * @method
   * @name _isValidCondition
   * @param {Object} obj - The object to check.
   * @returns {Object} - The result of the check.
   * @description Checks if an object is a valid condition. It checks if the object has more than one "any", "all", or "none" property.
   * @private
   */
  _isValidCondition: function (obj) {
    const isAny = "any" in obj;
    const isAll = "all" in obj;
    const isNone = "none" in obj;

    if ((isAny && isAll) || (isAny && isNone) || (isAll && isNone)) {
      return {
        isValid: false,
        error: {
          message: 'A condition cannot have more than one "any", "all", or "none" property.',
          element: obj,
        },
      };
    }

    return {isValid: true};
  }
});

module.exports = Validator;
