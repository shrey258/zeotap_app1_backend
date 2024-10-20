const Joi = require('joi');

const createRuleSchema = Joi.object({
    ruleString: Joi.string().required().min(3).max(500)
});

const combineRulesSchema = Joi.object({
    rules: Joi.array().items(Joi.string()).min(2).required(),
    operator: Joi.string().valid('AND', 'OR').required()
});

const evaluateRuleSchema = Joi.object({
    data: Joi.object().required()
});

module.exports = { createRuleSchema, combineRulesSchema, evaluateRuleSchema };
