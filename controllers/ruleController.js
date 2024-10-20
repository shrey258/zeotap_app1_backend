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
        const { rules, operator = 'OR' } = req.body; // Default to 'OR' if not provided
        
        // Fetch existing rule strings from the database
        const ruleStrings = await Promise.all(rules.map(async (ruleId) => {
            const rule = await Rule.findById(ruleId);
            return rule.ruleString;
        }));

        // Combine rules using the utility function
        const combinedAst = combine_rules(ruleStrings, operator);
        const combinedRuleString = JSON.stringify(combinedAst);

        // Check if the combined rule already exists in the database
        const existingCombinedRule = await Rule.findOne({ ruleString: combinedRuleString });
        if (existingCombinedRule) {
            return res.status(400).json({ message: 'Combined rule already exists' });
        }

        // Create and save the new combined rule
        const newRule = new Rule({ ruleString: combinedRuleString, ast: combinedAst });
        await newRule.save();
        res.status(200).json({ message: 'Rules combined successfully', rule: newRule });
    } catch (error) {
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
