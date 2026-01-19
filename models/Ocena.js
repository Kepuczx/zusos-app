const mongoose = require('mongoose');

// Schemat pojedynczej oceny (np. z kartkówki)
const ocenaCzastkowaSchema = new mongoose.Schema({
    wartosc: {
        type: String,
        required: true
    },
    opis: {
        type: String,
        required: true
    },
    wstawil: {
        type: String 
    },
    data: {
        type: Date,
        default: Date.now
    }
});

const ocenaSchema = new mongoose.Schema({
    indeks: { type: String, required: true },   
    przedmiot: { type: String, required: true }, 

    typ: { 
        type: String, 
        required: true, 
        default: "Wykład" 
    },

    prowadzacy: { type: String, required: true },
    ects: { type: String, required: true }, 
    
    oceny: [ocenaCzastkowaSchema], 
    
    ocenaKoncowa: { type: String, default: null }
});

ocenaSchema.index({ indeks: 1, przedmiot: 1, typ: 1 }, { unique: true });

module.exports = mongoose.model('Ocena', ocenaSchema);