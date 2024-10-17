const Node = require('../models/Rule');
const NodeCache = require('node-cache');
const Joi = require('joi');

const ruleCache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

// Helper function to parse rule string into an AST
const parseRuleString = (ruleString) => {
    console.log('Parsing rule string:', ruleString);

    if (typeof ruleString !== 'string') {
        throw new Error(`Invalid rule string: expected a string, got ${typeof ruleString}`);
    }

    // Tokenize the ruleString (split into components like operators, values, etc.)
    const tokens = ruleString.match(/[\w\.]+|AND|OR|>|<|=|'[^']*'|\(|\)/g);
    console.log('Tokens:', tokens);

    if (!tokens) {
        throw new Error('Invalid rule string: no valid tokens found');
    }

    let index = 0;

    const parseExpression = () => {
        console.log('Parsing expression, current token:', tokens[index]);

        if (tokens[index] === '(') {
            index++; // Skip '('
            const expr = parseCondition();

            if (index >= tokens.length || tokens[index] !== ')') {
                throw new Error('Missing closing parenthesis');
            }

            index++; // Skip ')'
            return expr;
        } else {
            return parseCondition();
        }
    };

    const parseCondition = () => {
        const left = parseOperand();

        if (index < tokens.length && (tokens[index] === 'AND' || tokens[index] === 'OR')) {
            const operator = tokens[index++];
            const right = parseCondition();
            return {
                type: 'operator',
                value: operator,
                left: left,
                right: right,
            };
        }

        return left;
    };

    const parseOperand = () => {
        if (index + 2 >= tokens.length) {
            throw new Error('Invalid operand: not enough tokens');
        }

        const field = tokens[index++];
        const comparator = tokens[index++];
        const value = tokens[index++].replace(/'/g, ''); // Remove quotes for strings

        return {
            type: 'operand',
            value: { field, comparator, value },
        };
    };

    try {
        const result = parseExpression();
        console.log('Parsed result:', result);
        
        // Check if there are any remaining tokens
        if (index < tokens.length) {
            const operator = tokens[index++];
            const right = parseExpression();
            return {
                type: 'operator',
                value: operator,
                left: result,
                right: right,
            };
        }
        
        return result;
    } catch (error) {
        console.error('Error parsing rule string:', error);
        throw error;
    }
};


const createRuleSchema = Joi.object({
    ruleString: Joi.string().required()
});

const createRule = async (req, res) => {
    try {
        const { ruleString } = req.body;

        if (!ruleString || typeof ruleString !== 'string' || ruleString.trim() === '') {
            return res.status(400).json({ message: 'Invalid or empty rule string' });
        }

        // Parse the rule string and create the AST
        try {
            const ast = parseRuleString(ruleString);
            
            // Verify AST structure
            if (!verifyASTStructure(ast)) {
                return res.status(400).json({ message: 'Invalid rule structure' });
            }

            // Save the AST to the database
            const savedNode = await Node.create({ ruleString, ast });
            res.status(201).json({ 
                message: 'Rule created successfully', 
                node: savedNode,
                ast: ast // Include AST in response for verification
            });
        } catch (parseError) {
            return res.status(400).json({ message: 'Invalid rule syntax', error: parseError.message });
        }
    } catch (error) {
        console.error('Error creating rule:', error);
        res.status(500).json({ message: 'Error creating rule', error: error.message });
    }
};

const verifyASTStructure = (ast) => {
    if (ast.type === 'operand') {
        return ast.value && ast.value.field && ast.value.comparator && 'value' in ast.value;
    } else if (ast.type === 'operator') {
        return ast.value && ast.left && ast.right && 
               verifyASTStructure(ast.left) && verifyASTStructure(ast.right);
    }
    return false;
};


const combineRules = async (req, res) => {
    try {
        const { rules, operator } = req.body;

        if (!Array.isArray(rules) || rules.length < 2 || !['AND', 'OR'].includes(operator)) {
            return res.status(400).json({ message: 'Invalid input for combining rules' });
        }

        console.log('Rules received:', rules);

        // Parse each rule if it's a string, or use it directly if it's already an AST
        const astNodes = rules.map((rule, index) => {
            console.log(`Processing rule ${index}:`, rule);
            if (typeof rule === 'string') {
                try {
                    return parseRuleString(rule);
                } catch (error) {
                    console.error(`Error parsing rule ${index}:`, error);
                    throw new Error(`Error parsing rule ${index}: ${error.message}`);
                }
            }
            return rule;
        });

        // Combine them using the specified operator (AND/OR)
        let combinedAST = astNodes[0];
        for (let i = 1; i < astNodes.length; i++) {
            combinedAST = {
                type: 'operator',
                value: operator,
                left: combinedAST,
                right: astNodes[i],
            };
        }

        // Generate the combined rule string
        const combinedRuleString = rules.join(` ${operator} `);

        // Save the combined AST to the database
        const savedNode = await Node.create({ 
            ruleString: combinedRuleString,
            ast: combinedAST 
        });

        res.status(201).json({ message: 'Rules combined successfully', node: savedNode });
    } catch (error) {
        console.error('Error combining rules:', error);
        res.status(500).json({ message: 'Error combining rules', error: error.message });
    }
};


const evaluateRule = (ast, data) => {
    if (ast.type === 'operand') {
        const { field, comparator, value } = ast.value;
        switch (comparator) {
            case '>':
                return data[field] > Number(value);
            case '<':
                return data[field] < Number(value);
            case '=':
                return data[field] === value;
            case 'IN':
                return Array.isArray(value) && value.includes(data[field]);
            default:
                throw new Error(`Unsupported comparator: ${comparator}`);
        }
    } else if (ast.type === 'operator') {
        switch (ast.value) {
            case 'AND':
                return evaluateRule(ast.left, data) && evaluateRule(ast.right, data);
            case 'OR':
                return evaluateRule(ast.left, data) || evaluateRule(ast.right, data);
            case 'NOT':
                return !evaluateRule(ast.right, data);
            default:
                throw new Error(`Unsupported operator: ${ast.value}`);
        }
    }
};

const evaluateRuleAPI = async (req, res) => {
    try {
        const { ruleId, data } = req.body;

        // Check cache first
        let rule = ruleCache.get(ruleId);
        if (!rule) {
            rule = await Node.findById(ruleId);
            if (!rule) {
                return res.status(404).json({ message: 'Rule not found' });
            }
            // Set cache
            ruleCache.set(ruleId, rule);
        }

        const result = evaluateRule(rule.ast, data);
        res.status(200).json({ result });
    } catch (error) {
        console.error('Error evaluating rule:', error);
        res.status(500).json({ message: 'Error evaluating rule', error: error.message });
    }
};

const listRules = async (req, res) => {
    try {
        const rules = await Node.find({}, 'ruleString createdAt');
        res.status(200).json({ rules });
    } catch (error) {
        console.error('Error listing rules:', error);
        res.status(500).json({ message: 'Error listing rules', error: error.message });
    }
};

const updateRule = async (req, res) => {
    try {
        const { ruleId, ruleString } = req.body;

        if (!ruleId || !ruleString) {
            return res.status(400).json({ message: 'Rule ID and new rule string are required' });
        }

        const ast = parseRuleString(ruleString);
        const updatedRule = await Node.findByIdAndUpdate(
            ruleId,
            { ruleString, ast },
            { new: true }
        );

        if (!updatedRule) {
            return res.status(404).json({ message: 'Rule not found' });
        }

        res.status(200).json({ message: 'Rule updated successfully', rule: updatedRule });
    } catch (error) {
        console.error('Error updating rule:', error);
        res.status(500).json({ message: 'Error updating rule', error: error.message });
    }
};

const deleteRule = async (req, res) => {
    try {
        const { ruleId } = req.params;

        const deletedRule = await Node.findByIdAndDelete(ruleId);

        if (!deletedRule) {
            return res.status(404).json({ message: 'Rule not found' });
        }

        res.status(200).json({ message: 'Rule deleted successfully' });
    } catch (error) {
        console.error('Error deleting rule:', error);
        res.status(500).json({ message: 'Error deleting rule', error: error.message });
    }
};

module.exports = {
    createRule,
    combineRules,
    evaluateRule: evaluateRuleAPI,
    listRules,
    updateRule,
    deleteRule,
};
