const { create_rule, combine_rules, evaluate_rule } = require('../utils/ruleUtils');
const Rule = require('../models/Rule');

const getAllRules = async (req, res) => {
    try {
        const rules = await Rule.find();
        res.status(200).json(rules);
    } catch (error) {
        res.status(400).json({ message: 'Error retrieving rules', error: error.message });
    }
};

const createRule = async (req, res) => {
    try {
        const { ruleString } = req.body;

        // Check for existing rule
        const existingRule = await Rule.findOne({ ruleString });
        if (existingRule) {
            return res.status(400).json({ message: 'Rule already exists' });
        }

        const ast = create_rule(ruleString);
        const newRule = new Rule({ ruleString, ast });
        await newRule.save();
        res.status(201).json({ message: 'Rule created successfully', rule: newRule });
    } catch (error) {
        res.status(400).json({ message: 'Error creating rule', error: error.message });
    }
};


const combineRules = async (req, res) => {
    try {
        const { rules: ruleIds, operator } = req.body;
        
        // Validate input
        if (!ruleIds || !Array.isArray(ruleIds) || ruleIds.length === 0) {
            return res.status(400).json({ message: 'Invalid or empty rules array.' });
        }

        if (operator !== 'AND' && operator !== 'OR') {
            return res.status(400).json({ message: 'Invalid operator. Must be AND or OR.' });
        }

        // Retrieve rules based on the provided rule IDs
        const rules = await Promise.all(ruleIds.map(async (ruleId) => {
            const rule = await Rule.findById(ruleId);
            if (!rule) {
                throw new Error(`Rule with ID ${ruleId} not found`);
            }
            return rule.ruleString; // Return only the ruleString
        }));

        // Check if we have valid rules
        if (rules.length === 0) {
            return res.status(400).json({ message: 'No valid rules found for the provided IDs.' });
        }

        // Combine rules and generate the combined AST and rule string
        const { ast: combinedAst, ruleString: combinedRuleString } = combine_rules(rules, operator);

        // Check for duplicate rule
        const existingRule = await Rule.findOne({ ruleString: combinedRuleString });
        if (existingRule) {
            return res.status(400).json({ message: 'Duplicate rule. This rule already exists.' });
        }

        // Save the new rule in the database
        const newRule = new Rule({ ruleString: combinedRuleString, ast: combinedAst });
        await newRule.save();

        res.status(200).json({
            message: 'Rules combined successfully',
            rule: {
                ruleString: newRule.ruleString,
                ast: newRule.ast,
                _id: newRule._id,
                createdAt: newRule.createdAt,
                __v: newRule.__v
            }
        });
    } catch (error) {
        console.error('Error combining rules:', error);
        res.status(400).json({ message: 'Error combining rules', error: error.message });
    }
};





const evaluateRule = async (req, res) => {
    try {
        const { data } = req.body;
        const rules = await Rule.find();

        const results = rules.map(rule => ({
            ruleId: rule._id,
            result: evaluate_rule(rule.ast, data)
        }));

        res.status(200).json({ results });
    } catch (error) {
        res.status(400).json({ message: 'Error evaluating rules', error: error.message });
    }
};

module.exports = { createRule, combineRules, evaluateRule, getAllRules };
