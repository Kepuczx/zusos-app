const express = require('express');
const mongoose = require('mongoose');
const Aktualnosci = require('./models/aktualnosci');
const Student = require('./models/Student');

const app = express();
const PORT = process.env.PORT || 3000;

require('dotenv').config();
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(()=> console.log('Polaczono z MongoDB!'))
    .catch(err => console.error('Błąd polaczenia z baza: ', err));


app.use(express.static('public'));
app.use(express.json());


//AKTUALNOSCI

app.get('/api/aktualnosci', async(req,res)=>{
    try{
        const aktualnosci = await Aktualnosci.find().sort({data:-1}).limit(5);
        res.json(aktualnosci);

    }catch(error){
        res.status(500).json({ message: error.message});
    }
});

app.post('/api/aktualnosci', async(req,res)=>{
    try{
        const newAktualnosci = new Aktualnosci({
            naglowek: req.body.naglowek,
            tresc: req.body.tresc,
            zdjecieUrl:req.body.zdjecieUrl
        });
        const zapisanyAktualnosci = await newAktualnosci.save();
        res.status(201).json(zapisanyAktualnosci);
    }catch(error){
        res.status(400).json({message:error.message});

    }
});


//STUDENT

app.post('/api/login', async(req, res) =>{
    const {login, haslo} = req.body;

    try{
        const student = await Student.findOne({login : login});

        if(!student || student.haslo !== haslo){
            return res.status(401).json({message: "Błędny login lub hasło"});
        }
        res.json({
            imie: student.imie,
            nazwisko: student.nazwisko,
            zdjecieURL: student.zdjecieURL,
            klasa: student.klasa,
            login: student.login
        });
    }catch(error){
        res.status(500).json({message: "Błąd serwera"});
    }
});

app.post('/api/register', async(req,res)=>{
    try{
        const nowyStudent = new Student(req.body);
        await nowyStudent.save();
        res.json({message: "Dodano Studenta!"});

    }catch(error){
        res.json({message: error.message});
    }
})






app.use((req, res) =>{
    res.status(404).send('<h1>404 - Nie znaleziono takiej strony uniwersytetu!</h1>');
});

app.listen(PORT, ()=>{
    console.log(`Serwer uniwersytetu działa na : http.//localhost:${PORT}`);
});