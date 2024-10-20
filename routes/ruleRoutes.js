const express = require('express');
const router = express.Router();
const { createRule, combineRules, evaluateRule, getAllRules } = require('../controllers/ruleController');
const validateRequest = require('../middleware/validateRequest');
const { createRuleSchema, combineRulesSchema, evaluateRuleSchema } = require('../validators/ruleValidators');

router.get('/', getAllRules);
router.post('/create', validateRequest(createRuleSchema), createRule);
router.post('/combine', validateRequest(combineRulesSchema), combineRules);
router.post('/evaluate', validateRequest(evaluateRuleSchema), evaluateRule);

module.exports = router;
