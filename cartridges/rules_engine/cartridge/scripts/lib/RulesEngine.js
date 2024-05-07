const Class = require('~/cartridge/scripts/util/Class').Class;

const Validator = require('~/cartridge/scripts/lib/Validator');
const Evaluator = require('~/cartridge/scripts/lib/Evaluator');

/**
 * @class
 * @name RulesEngine
 * @description A class that represents a rules engine. It is responsible for validating and evaluating rules.
 */
const RulesEngine = Class.extend({
  /**
   * @constructor
   * @description Initializes the RulesEngine with a Validator and an Evaluator.
   */
  init: function () {
    this._validator = new Validator();
    this._evaluator = new Evaluator();
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
