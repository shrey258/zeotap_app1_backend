// utils/ruleUtils.js

// Node class to represent AST nodes
class Node {
    constructor(type, value, left = null, right = null) {
        this.type = type;
        this.value = value;
        this.left = left;
        this.right = right;
    }
}

/**
 * Creates an Abstract Syntax Tree (AST) from a rule string.
 * @param {string} rule_string - The rule string to parse.
 * @returns {Node} The root node of the AST.
 */
const create_rule = (rule_string) => {
    const tokens = rule_string.match(/\(|\)|\w+|[<>=!]+|"[^"]*"|'[^']*'/g);
    
    const buildAST = () => {
        if (tokens.length === 0) return null;

        if (tokens[0] === '(') {
            tokens.shift();
            const node = buildAST();
            tokens.shift(); // Remove closing parenthesis
            return node;
        }

        if (['AND', 'OR'].includes(tokens[0])) {
            const operator = tokens.shift();
            const left = buildAST();
            const right = buildAST();
            return new Node('operator', operator, left, right);
        }

        const field = tokens.shift();
        const comparator = tokens.shift();
        const value = tokens.shift().replace(/['"]/g, '');
        return new Node('operand', { field, comparator, value });
    };

    return buildAST();
};

const combine_rules = (rules) => {
    if (rules.length === 0) return null;
    if (rules.length === 1) return create_rule(rules[0]);

    // Count operator frequencies
    const operatorCount = { 'AND': 0, 'OR': 0 };
    rules.forEach(rule => {
        const ast = create_rule(rule);
        countOperators(ast, operatorCount);
    });

    // Choose the most frequent operator
    const mainOperator = operatorCount['AND'] >= operatorCount['OR'] ? 'AND' : 'OR';

    // Combine rules
    const combinedAST = rules.map(create_rule).reduce((acc, curr) => {
        return new Node('operator', mainOperator, acc, curr);
    });

    return optimizeAST(combinedAST);
};

const countOperators = (node, count) => {
    if (!node) return;
    if (node.type === 'operator') {
        count[node.value]++;
        countOperators(node.left, count);
        countOperators(node.right, count);
    }
};

const optimizeAST = (node) => {
    if (!node) return null;
    if (node.type === 'operand') return node;

    node.left = optimizeAST(node.left);
    node.right = optimizeAST(node.right);

    // Optimization: If both children are the same operator, merge them
    if (node.type === 'operator') {
        if (node.left && node.left.type === 'operator' && node.left.value === node.value) {
            return new Node('operator', node.value, node.left.left, new Node('operator', node.value, node.left.right, node.right));
        }

        if (node.right && node.right.type === 'operator' && node.right.value === node.value) {
            return new Node('operator', node.value, new Node('operator', node.value, node.left, node.right.left), node.right.right);
        }

        // If both children are identical, return one
        if (JSON.stringify(node.left) === JSON.stringify(node.right)) {
            return node.left;
        }
    }

    return node;
};

const evaluate_rule = (ast, data) => {
    if (ast.type === 'operand') {
        const { field, comparator, value } = ast.value;
        const fieldValue = data[field];

        switch (comparator) {
            case '=': return fieldValue == value;
            case '>': return fieldValue > value;
            case '<': return fieldValue < value;
            case '>=': return fieldValue >= value;
            case '<=': return fieldValue <= value;
            case '!=': return fieldValue != value;
            case 'IN': return Array.isArray(value) && value.includes(fieldValue);
            case 'BETWEEN': {
                const [min, max] = value.split(',').map(Number);
                return fieldValue >= min && fieldValue <= max;
            }
            default: throw new Error(`Unknown comparator: ${comparator}`);
        }
    } else if (ast.type === 'operator') {
        const leftResult = evaluate_rule(ast.left, data);
        const rightResult = evaluate_rule(ast.right, data);

        switch (ast.value) {
            case 'AND': return leftResult && rightResult;
            case 'OR': return leftResult || rightResult;
            default: throw new Error(`Unknown operator: ${ast.value}`);
        }
    }

    throw new Error('Invalid AST node type');
};

module.exports = { create_rule, combine_rules, evaluate_rule };
