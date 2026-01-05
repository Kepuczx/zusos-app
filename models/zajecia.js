const mongoose = require('mongoose');

const ZajeciaSchema = new mongoose.Schema({
    nazwa: {
        type: String,
        required: true
    },
    prowadzacy: {
        type: String,
        required: true
    },
    dzien: {
        type: String, // np. "Poniedziałek"
        required: true
    },
    godzinaOd: {
        type: String, // "08:00"
        required: true
    },
    godzinaDo: {
        type: String, // "09:30"
        required: true
    },
    sala: {
        type: String
    }
}
)

module.exports = mongoose.model('Zajecia', ZajeciaSchema);

