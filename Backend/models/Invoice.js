const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, "Company ID is required"],
        index: true,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: 0,
    },
    status: {
        type: String,
        enum: ["Unpaid", "Partial", "Paid", "Cancelled"],
        default: "Unpaid",
    },
    dueDate: {
        type: Date,
    },
    issuedDate: {
        type: Date,
        default: Date.now,
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Invoice", invoiceSchema);
