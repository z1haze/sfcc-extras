const CustomObjectMgr = require('dw/object/CustomObjectMgr');

const Class = require('~/cartridge/scripts/util/Class').Class;

const Validator = require('~/cartridge/scripts/lib/Validator');
const Evaluator = require('~/cartridge/scripts/lib/Evaluator');

/**
 * @typedef {import('./rule.jsdoc').Rule} Rule
 */

/**
 * @class
 * @name RulesEngine
 * @description A class that represents a rules engine. It is responsible for validating and evaluating rules.
 * @property {Validator} _validator - The validator used to validate rules.
 * @property {Evaluator} _evaluator - The evaluator used to evaluate rules.
 */

const RulesEngine = Class.extend({
    /**
     * @constructor
     * @description Initializes the RulesEngine with a Validator and an Evaluator.
     */
    init: function () {
        // get all the rules
        const rulesItr = CustomObjectMgr.getAllCustomObjects('Rule');
        const rules = [];

        while (rulesItr.hasNext()) {
            rules.push(rulesItr.next());
        }

        // pass them into the validator and the evaluator
        this._validator = new Validator(rules);
        this._evaluator = new Evaluator(rules);
    },

    /**
     * @method
     * @name validate
     * @param {Object} rule - The rule to validate.
     * @returns {Object} - The result of the validation.
     * @description Validates a rule using the Validator.
     */
    validate: function (rule) {
        return this._validator.validate(rule);
    },

    /**
     * @method
     * @name evaluate
     * @param {Object} rule - The rule to evaluate.
     * @param {Object} criteria - The criteria to evaluate the rule against.
     * @returns {boolean} - The result of the evaluation.
     * @description Evaluates a rule using the Evaluator. If the rule is not valid, it throws an error.
     */
    evaluate: function (rule, criteria) {
        const validationResult = this.validate(rule);

        if (!validationResult.isValid) {
            throw new Error('Rule is not valid');
        }

        return this._evaluator.evaluate(rule, criteria);
    }
});

module.exports = RulesEngine
