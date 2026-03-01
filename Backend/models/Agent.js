const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, "Company ID is required"],
        index: true,
    },
    name: {
        type: String,
        required: [true, "Agent name is required"],
        trim: true,
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
    },
    phone: String,
    commissionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Agent", agentSchema);
