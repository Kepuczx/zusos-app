const mongoose = require('mongoose');

const FrekwencjaSchema = new mongoose.Schema({
    zajeciaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zajecia', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    data: { type: Date, required: true },
    status: {
        type: String,
        enum: ['obecny','nieobecny','spóźniony','usprawiedliwiony','brak'],
        default: 'brak'
    }
}, { timestamps: true });

// dla szybkiego filtrowania po zajęciach/studencie
FrekwencjaSchema.index({ zajeciaId: 1, studentId: 1, data: 1 });

module.exports = mongoose.model('Frekwencja', FrekwencjaSchema);