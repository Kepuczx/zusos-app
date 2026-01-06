const mongoose = require('mongoose');

const ocenaCzastkowaSchema = new mongoose.Schema({
    wartosc:{
        type: String,
        required: true
    },
    opis:{
        type: String,
        required: true
    },
    data:{
        type: Date,
        default: Date.now
    }

})


const ocenaSchema = new mongoose.Schema({
    indeks:{type: String, required: true},
    przedmiot:{type: String, required:true},
    prowadzacy:{type: String, required:true},
    ects:{type: String, required: true},
    oceny:[ocenaCzastkowaSchema],
    ocenaKoncowa:{type:String, default: null}


})

module.exports = mongoose.model('Ocena', ocenaSchema);