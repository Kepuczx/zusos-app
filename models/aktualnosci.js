const mongoose = require('mongoose');

const aktualnosciSchema = new mongoose.Schema(
{
    naglowek :{type: String, required: true},
    tresc:{ type: String, required: true},
    zdjecieUrl: {type: String, default: 'https://via.placeholder.com/150'},
    data: {type: Date, default: Date.now }

}
)
module.exports = mongoose.model('aktualnosci', aktualnosciSchema);
