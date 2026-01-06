const express = require('express');
const mongoose = require('mongoose');
const Aktualnosci = require('./models/aktualnosci');
const Student = require('./models/Student');
const Ocena = require('./models/Ocena');

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

    console.log("Próba logowania dla:", login); // LOG 1

    try{
        // Sprawdzamy czy model Student jest poprawnie załadowany
        if (!Student) {
            throw new Error("Model Student nie został załadowany!");
        }

        const student = await Student.findOne({login : login});
        console.log("Wynik szukania w bazie:", student); // LOG 2

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
        // TO JEST KLUCZOWE - wypisz błąd w konsoli serwera!
        console.error("SZCZEGÓŁY BŁĘDU LOGOWANIA:", error); 
        res.status(500).json({message: "Błąd serwera: " + error.message});
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

app.put('/api/zmien-haslo', async (req,res)=>{

    const {login, noweHaslo} = req.body;

    try{
        const student = await Student.findOne({login:login});

        if(!student){
            return res.status(404).json({message: "Nie znaleziono użytkownika"});

        }

        student.haslo = noweHaslo;

        await student.save();

        res.json({message: "Haslo zostalo zmienione pomyślnie!"});

    
    }catch(error){
        res.status(500).json({message: "Błąd serwera: " + error.message });

    }
});


//Oceny

// GET – wszystkie przedmioty z ocenami
app.get('/api/oceny/:indeks', async (req, res) => {
    try{
        const indeksStudenta = req.params.indeks;

        const oceny = await Ocena.find({ indeks: indeksStudenta});

        res.json(oceny);
    }
    catch(error)
    {
        res.status(500).json({message: "Błąd pobierania ocen: " + error.message});

    }
});

// POST – dodaj nowy przedmiot
app.post('/api/dodaj-przedmiot', async (req, res) => {
    try{
        const nowaOcena = new Ocena({
            indeks: req.body.indeks, 
            przedmiot: req.body.przedmiot,
            prowadzący: req.body.prowadzący,
            ects: req.body.ects,
            oceny: req.body.oceny,     
            ocenaKoncowa: req.body.ocenaKoncowa

        });
    }
    catch(error){
        res.status(400).json({message: "Błąd dodawania przedmiotu: " + error.message});
    }
});

// POST – dodaj ocenę cząstkową
app.post('/api/dodaj-ocene-czastkowa', async (req, res) => {
    const {indeks, przedmiot, nowaOcena} = req.body;

    try{
        const przedmiotDb = await Ocena.findOne({})
    }
    catch{

    }


});

// PUT – ustaw ocenę końcową
app.put('/:id/koncowa', async (req, res) => {
    const { ocenaKoncowa } = req.body;

    const ocena = await Ocena.findByIdAndUpdate(
        req.params.id,
        { ocenaKoncowa },
        { new: true }
    );

    res.json(ocena);
});






app.use((req, res) =>{
    res.status(404).send('<h1>404 - Nie znaleziono takiej strony uniwersytetu!</h1>');
});

app.listen(PORT, ()=>{
    console.log(`Serwer uniwersytetu działa na : http.//localhost:${PORT}`);
});