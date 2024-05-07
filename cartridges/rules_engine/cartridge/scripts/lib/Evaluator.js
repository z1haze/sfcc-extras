const Class = require('~/cartridge/scripts/util/Class').Class;
const ObjectDiscovery = require('~/cartridge/scripts/lib/ObjectDiscovery');

/**
 * @typedef {import('./condition.jsdoc').Condition} Condition
 * @typedef {import('./constraint.jsdoc').Constraint} Constraint
 * @typedef {import('./rule.jsdoc').Rule} Rule
 * @typedef {import('./operator.jsdoc').Operator} Operator
 * @typedef {import('./condition-type.jsdoc').ConditionType} ConditionType
 */

/**
 * @class Evaluator
 * @property {ObjectDiscovery} _objectDiscovery - An instance of the ObjectDiscovery class.
 * @property {Array.<Rule>} _rules - The rules that are existing in the system.
 */
const Evaluator = Class.extend({
    /**
     * @constructs Evaluator
     * @param {Array.<Rule>} rules - The rules that are existing in the system.
     */
    init: function (rules) {
        this._objectDiscovery = new ObjectDiscovery();
        this._rules = rules;
    },

    /**
     * @method
     * @name evaluate
     * @param {Rule | Array<Rule>} rule - The rule to evaluate.
     * @param {Object | Array.<Object>} criteria - The criteria to evaluate the rule against.
     * @returns {boolean | Array.<boolean>} - The result of the evaluation.
     */
    evaluate: function (rule, criteria) {
        const conditions = rule.conditions instanceof Array ? rule.conditions : [rule.conditions];

        if (criteria instanceof Array) {
            let result = [];

            for (let c of criteria) {
                result.push(this._evaluateRule(conditions, c));
            }

            return result;
        }

        return this._evaluateRule(conditions, criteria);
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
     * @name _evaluateRule
     * @param {Array.<Condition>} conditions - The conditions to evaluate.
     * @param {Object} criteria - The criteria to evaluate the conditions against.
     * @returns {boolean} - The result of the evaluation.
     * @private
     */
    _evaluateRule: function (conditions, criteria) {
        for (let condition of conditions) {
            let result = this._evaluateCondition(condition, criteria);

            if (result) {
                return typeof condition.result === 'boolean' ? condition.result : true;
            }
        }

        return false;
    },

    /**
     * @method
     * @name _evaluateCondition
     * @param {Condition} condition - The condition to evaluate.
     * @param {Object} criteria - The criteria to evaluate the condition against.
     * @returns {boolean} - The result of the evaluation.
     * @private
     */
    _evaluateCondition: function (condition, criteria) {
        const type = this._objectDiscovery.conditionType(condition);

        if (!type) {
            return false;
        }

        let result = ['all', 'none'].includes(type);

        for (let node of condition[type]) {
            let fn;

            // Check if the condition is a reference to another rule.
            if (typeof node === 'string') {
                node = this._getById(node);
            }

            if (this._objectDiscovery.isCondition(node)) {
                fn = '_evaluateCondition';
            } else if (this._objectDiscovery.isConstraint(node)) {
                fn = '_checkConstraint';
            }

            if (!fn) {
                dw.system.Logger.error('Invalid node type in condition. {0}', JSON.stringify(node));
                return false;
            }

            // Process the node
            switch (type) {
                case 'any':
                    result = result || this[fn](node, criteria);
                    break;
                case 'all':
                    result = result && this[fn](node, criteria);
                    break;
                case 'none':
                    result = result && !this[fn](node, criteria);
            }
        }

        return result;
    },

    /**
     * @method
     * @name _checkConstraint
     * @param {Constraint} constraint - The constraint to check.
     * @param {Object} criteria - The criteria to check the constraint against.
     * @returns {boolean} - The result of the check.
     * @private
     */
    _checkConstraint: function (constraint, criteria) {
        const criterion = constraint.field.includes('.')
            ? this._objectDiscovery.resolveNestedProperty(constraint.field, criteria)
            : criteria[constraint.field];

        if (undefined === criterion) {
            return false;
        }

        // do all the checks

        switch (constraint.operator) {
            case 'equals':
                return criterion === constraint.value;
            case 'does not equal':
                return criterion !== constraint.value;
            case 'greater than':
                return criterion > constraint.value;
            case 'greater than or equal':
                return criterion >= constraint.value;
            case 'less than':
                return criterion < constraint.value;
            case 'less than or equal':
                return criterion <= constraint.value;
            case 'exists':
                return !empty(criterion);
            case 'does not exist':
                return empty(criterion);
            case 'in':
                return (
                    Array.isArray(constraint.value) &&
                    constraint.value.includes(criterion)
                );
            case 'not in':
                return (
                    !Array.isArray(constraint.value) ||
                    !constraint.value.includes(criterion)
                );
            case 'contains':
                return Array.isArray(criterion) && criterion.includes(constraint.value);
            case 'not contains':
                return (
                    !Array.isArray(criterion) || !criterion.includes(constraint.value)
                );
            case 'contains any':
                return (
                    Array.isArray(constraint.value) &&
                    constraint.value.some((x) => criterion.includes(x))
                );
            case 'not contains any':
                return (
                    !Array.isArray(constraint.value) ||
                    !constraint.value.some((x) => criterion.includes(x))
                );
            case 'matches':
                return new RegExp(criterion).test(`${constraint.value}`);
            case 'does not match':
                return !new RegExp(criterion).test(`${constraint.value}`);
            default:
                return false;
        }
    }
});

module.exports = Evaluator;
