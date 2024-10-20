const mongoose = require('mongoose');

// Schema for individual nodes in the Abstract Syntax Tree (AST)
const NodeSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['operand', 'operator'],
        required: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    left: this, // Reference to the left child node
    right: this // Reference to the right child node
}, { _id: false });

const RuleSchema = new mongoose.Schema({
    ruleString: {
        type: String,
        required: true,
        index: true
    },
    ast: {
        type: NodeSchema,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

RuleSchema.index({ ruleString: 1 }, { unique: true });

module.exports = mongoose.model('Rule', RuleSchema);
