/**
 * @typedef {import('./condition.jsdoc').Condition} Condition
 */

/**
 * @method
 * @name getConditionsByRoleId
 * @param {Array<Object>} rules
 * @param {string} id
 * @returns {Condition|Array<Condition>}
 * @description Validates a rule. It checks if the rule is a valid JSON object and if it contains at least one condition.
 */
module.exports = function (rules, id) {
    const rule = [].find.call(rules, (r) => r.custom.id === id);

    return rule
        ? JSON.parse(rule.custom.conditions)
        : {}
}
