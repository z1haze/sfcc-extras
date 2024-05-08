const CustomObjectMgr = require('dw/object/CustomObjectMgr');

const Class = require('~/cartridge/scripts/util/Class').Class;

const Validator = require('~/cartridge/scripts/lib/Validator');
const Evaluator = require('~/cartridge/scripts/lib/Evaluator');

/**
 * @typedef {import('./rule.jsdoc').Rule} Rule
 * @typedef {import('./condition.jsdoc').Condition} Condition
 */

/**
 * @class
 * @name RulesEngine
 * @description A class that represents a rules engine. It is responsible for validating and evaluating rules.
 * @property {Validator} _validator - The validator used to validate rules.
 * @property {Evaluator} _evaluator - The evaluator used to evaluate rules.
 * @property {Array<Object>} _rules - The evaluator used to evaluate rules.
 */

const RulesEngine = Class.extend({
    /**
     * @constructor
     * @description Initializes the RulesEngine with a Validator and an Evaluator.
     */
    init: function () {
        // get all the rules
        const rulesItr = CustomObjectMgr.getAllCustomObjects('Rule');

        this._rules = [];

        while (rulesItr.hasNext()) {
            this._rules.push(rulesItr.next());
        }

        // pass them into the validator and the evaluator
        this._validator = new Validator(this._rules);
        this._evaluator = new Evaluator(this._rules);
    },

    /**
     * @method
     * @name _getById
     * @param {string} id
     * @returns {id: string, label: string, conditions: Condition|Array<Condition>, lastModified: string} - The rule that matches the id.
     * @description Validates a rule. It checks if the rule is a valid JSON object and if it contains at least one condition.
     * @private
     */
    _getById: function (id) {
        const rule = [].find.call(this._rules, (r) => r.custom.id === id);

        if (!rule) {
            dw.system.Logger.error('Invalid rule reference. ' + id + ' does not reference any known rule.');
        }

        return {
            id: rule.custom.id,
            label: rule.custom.label,
            conditions: JSON.parse(rule.custom.conditions),
            lastModified: rule.lastModified.toString(),
        };
    },

    /**
     * @method
     * @name validate
     * @param {Rule} rule - The rule to validate.
     * @returns {Object} - The result of the validation.
     * @description Validates a rule using the Validator.
     */
    validate: function (rule) {
        // if the rule is a string, it is a reference to another rule
        if (typeof rule === 'string') {
            rule = this._getById(rule);
        }

        return this._validator.validate(rule);
    },

    /**
     * @method
     * @name evaluate
     * @param {Rule} rule - The rule to evaluate.
     * @param {Object} criteria - The criteria to evaluate the rule against.
     * @returns {boolean} - The result of the evaluation.
     * @description Evaluates a rule using the Evaluator. If the rule is not valid, it logs an error and returns false.
     */
    evaluate: function (rule, criteria) {
        // if the rule is a string, it is a reference to another rule
        if (typeof rule === 'string') {
            rule = this._getById(rule);
        }

        const validationResult = this.validate(rule);

        if (!validationResult.isValid) {
            dw.system.Logger.error('Rule is not valid: ' + validationResult.message + ': ' + JSON.stringify(rule));
            return false;
        }

        return this._evaluator.evaluate(rule, criteria);
    }
});

module.exports = RulesEngine
