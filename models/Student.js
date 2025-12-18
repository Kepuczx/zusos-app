const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    login:{ type: String, required:true, unique:true},
    haslo: {type:String, required:true},
    imie: {type:String},
    nazwisko: {type:String},
    zdjecieURL:{type:String, default:'images/awatar.png'},
    klasa:{type:String, require:true}
});

module.exports = mongoose.model('Student', studentSchema);