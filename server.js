const express = require('express');
const mongoose = require('mongoose');
const Aktualnosci = require('./models/aktualnosci');
const Student = require('./models/Student');
const Ocena = require('./models/Ocena');
const Zajecia = require('./models/zajecia');

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
    console.log("1. Przyszło zapytanie POST /api/dodaj-przedmiot");
    console.log("2. Otrzymane dane (req.body):", req.body);

    try {
        const nowaOcena = new Ocena({
            indeks: req.body.indeks,
            przedmiot: req.body.przedmiot,
            prowadzacy: req.body.prowadzacy, // Upewnij się, że nazwa pola pasuje do modelu!
            ects: req.body.ects,
            oceny: req.body.oceny || [], 
            ocenaKoncowa: req.body.ocenaKoncowa
        });

        console.log("3. Próba zapisu do bazy...");
        await nowaOcena.save();
        
        console.log("4. SUKCES! Zapisano.");
        res.status(201).json({ message: "Przedmiot dodany pomyślnie!" });

    } catch (error) {
        console.error("5. BŁĄD KRYTYCZNY:", error); // <-- To pokaże nam przyczynę w terminalu
        res.status(400).json({ message: "Błąd serwera: " + error.message });
    }
});

// --- Endpoint do dodawania oceny cząstkowej ---
app.put('/api/dodaj-ocene-czastkowa', async (req, res) => {
    // 1. Pobieramy dane z formularza
    const { indeks, przedmiot, nowaOcena } = req.body;
    
    // Logujemy dla pewności co przyszło
    console.log("Dodawanie oceny dla:", indeks, przedmiot); 
    console.log("Dane oceny:", nowaOcena);

    try {
        // 2. Szukamy przedmiotu tego studenta
        // UWAGA: Musi się zgadzać INDEKS i NAZWA PRZEDMIOTU
        const przedmiotDb = await Ocena.findOne({ 
            indeks: indeks, 
            przedmiot: przedmiot 
        });

        // 3. Sprawdzamy czy znaleziono
        if (!przedmiotDb) {
            console.log("Nie znaleziono przedmiotu!");
            return res.status(404).json({ message: "Nie znaleziono takiego przedmiotu dla tego studenta" });
        }

        // 4. Dodajemy ocenę do tablicy (push)
        przedmiotDb.oceny.push({
            wartosc: nowaOcena.wartosc,
            opis: nowaOcena.opis,
            data: new Date()
        });

        // 5. Zapisujemy zmiany
        await przedmiotDb.save();

        console.log("Sukces! Ocena dodana.");
        res.json({ message: "Dodano ocenę cząstkową!" });

    } catch (error) {
        console.error("Błąd serwera:", error);
        res.status(500).json({ message: "Błąd serwera: " + error.message });
    }
});



//ZAJECIA

// GET – wszystkie zajęcia
app.get('/api/zajecia', async (req, res) => {
    try {
        const zajecia = await Zajecia.find();
        res.json(zajecia);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/plan', async (req, res) => {
    try {
        const { klasa, nazwisko } = req.query;

        let filter = {};

        if (klasa === 'Nauczyciel' || klasa === 'szlachta') {
            if (!nazwisko) {
                return res.json([]); // brak nazwiska = brak planu
            }
            filter = {
                prowadzacy: { $regex: nazwisko, $options: 'i' }
            };
        } else {
            filter = {
                grupaZaj: klasa
            };
        }

        const zajecia = await Zajecia.find(filter);
        res.json(zajecia);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// POST – dodaj zajęcia
app.post('/api/zajecia', async (req, res) => {
    console.log(req.body); // 👈 ZOBACZ CO PRZYCHODZI
    try {
        const zajecia = new Zajecia(req.body);
        const zapisane = await zajecia.save();
        res.status(201).json(zapisane);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
});


// PUT – edycja zajęć
app.put('/api/zajecia/:id', async (req, res) => {
    try {
        const updated = await Zajecia.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// DELETE – usuń zajęcia
app.delete('/api/zajecia/:id', async (req, res) => {
    try {
        await Zajecia.findByIdAndDelete(req.params.id);
        res.json({ message: 'Zajęcia usunięte 🗑️' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});






app.use((req, res) =>{
    res.status(404).send('<h1>404 - Nie znaleziono takiej strony uniwersytetu!</h1>');
});

app.listen(PORT, ()=>{
    console.log(`Serwer uniwersytetu działa na : http.//localhost:${PORT}`);
});