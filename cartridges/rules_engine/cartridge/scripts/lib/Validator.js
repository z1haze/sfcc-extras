const Class = require('~/cartridge/scripts/util/Class').Class;
const ObjectDiscovery = require('~/cartridge/scripts/lib/ObjectDiscovery');

/**
 * @typedef {import('./rule.jsdoc').Rule} Rule
 * @typedef {import('./constraint.jsdoc').Constraint} Constraint
 * @typedef {import('./operator.jsdoc').Operator} Operator
 * @typedef {import('./condition.jsdoc').Condition} Condition
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
 * @property {ObjectDiscovery} _objectDiscovery - The rules that are existing in the system.
 * @property {Array.<Rule>} _rules - The rules that are existing in the system.
 */
const Validator = Class.extend({
    /**
     * @constructor
     * @param {Array.<Rule>} rules - The rules that are existing in the system.
     */
    init: function (rules) {
        this._objectDiscovery = new ObjectDiscovery();
        this._rules = rules;
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
                    message: 'The rule must be a valid JSON object.',
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
                    message: 'The conditions property must contain at least one condition.',
                    element: rule,
                },
            };
        }

        // Validate each condition in the rule.
        for (let condition of conditions) {
            let subResult = this._validateCondition(condition);

            result.isValid = result.isValid && subResult.isValid;
            result.error = result.error ? result.error : subResult.error;
        }

        return result;
    },

    /**
     * @method
     * @name _getById
     * @param {string} id
     * @returns {Condition|Array<Condition>}
     * @description Validates a rule. It checks if the rule is a valid JSON object and if it contains at least one condition.
     * @private
     */
    _getById: function (id) {
        const rule = [].find.call(this._rules, (r) => r.custom.id === id);

        if (!rule) {
            throw new Error('Invalid rule reference. ' + id + ' does not reference any known rule.');
        }

        return JSON.parse(rule.custom.conditions);
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

        // Check if the condition is a reference to another rule.
        if (typeof condition === 'string') {
            condition = this._getById(condition);
        }

        const result = this._isValidCondition(condition);

        if (!result.isValid) {
            return result;
        }

        const type = this._objectDiscovery.conditionType(condition);

        if (!Array.isArray(condition[type])) {
            return {
                isValid: false,
                error: {
                    message: `The condition '${type}' should be iterable.`,
                    element: condition,
                },
            };
        }

        for (let node of condition[type]) {
            if (typeof node === 'string') {
                node = this._getById(node);
            }

            let isCondition = this._objectDiscovery.isCondition(node);
            let isConstraint = this._objectDiscovery.isConstraint(node);

            if (isCondition) {
                let subResult = this._validateCondition(node, depth + 1);

                result.isValid = result.isValid && subResult.isValid;
                result.error = result.error ? result.error : subResult.error;
            } else if (isConstraint) {
                let subResult = this._validateConstraint(node);

                result.isValid = result.isValid && subResult.isValid;
                result.error = result.error ? result.error : subResult.error;
            }

            if (!isConstraint && !isCondition) {
                return {
                    isValid: false,
                    error: {
                        message: 'Each node should be a condition or constraint.',
                        element: node,
                    },
                };
            }

            // Result is only valid on the root condition.
            if (depth > 0 && 'result' in condition) {
                return {
                    isValid: false,
                    error: {
                        message: 'Nested conditions cannot have a property "result".',
                        element: node,
                    },
                };
            }

            // If any part fails validation there is no point to continue.
            if (!result.isValid) {
                break;
            }
        }

        return result;
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
        if ('string' !== typeof constraint.field) {
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
            'equals',
            'does not equal',
            'greater than',
            'less than',
            'greater than or equal',
            'less than or equal',
            'exists',
            'does not exist',
            'in',
            'not in',
            'contains',
            'not contains',
            'contains any',
            'not contains any',
            'matches',
            'does not match',
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

        if (
            ['in', 'not in', 'contains any', 'not contains any'].includes(constraint.operator)
            && !Array.isArray(constraint.value)
        ) {
            return {
                isValid: false,
                error: {
                    message: 'Constraint "value" must be an array if the "operator" is in ["in", "not in", "contains any", "not contains any"]',
                    element: constraint,
                },
            };
        }

        if (['matches', 'does not match'].includes(constraint.operator)) {
            try {
                new RegExp(constraint.value);
            } catch (e) {
                return {
                    isValid: false,
                    error: {
                        message: 'Constraint "value" must be a valid regular expression if the "operator" is in ["matches", "not matches"]',
                        element: constraint,
                    },
                };
            }
        }

        return {isValid: true};
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
        if (!this._objectDiscovery.isCondition(obj)) {
            return {
                isValid: false,
                error: {
                    message: 'Invalid condition structure.',
                    element: obj,
                },
            };
        }

        const isAny = 'any' in obj;
        const isAll = 'all' in obj;
        const isNone = 'none' in obj;

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
