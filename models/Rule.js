// models/Rule.js
const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed, // To store different types of values
        required: true
    },
    left: {
        type: mongoose.Schema.Types.Mixed, // Recursive object for left node
        required: false
    },
    right: {
        type: mongoose.Schema.Types.Mixed, // Recursive object for right node
        required: false
    }
}, { _id: false });

const RuleSchema = new mongoose.Schema({
    ruleString: {
        type: String,
        required: true
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

module.exports = mongoose.model('Rule', RuleSchema);
