const express = require('express');
const mongoose = require('mongoose');

const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const { CloudinaryStorage } = require('multer-storage-cloudinary');

const Aktualnosci = require('./models/aktualnosci');
const Student = require('./models/Student');
const Ocena = require('./models/Ocena');
const Zajecia = require('./models/zajecia');
const Frekwencja = require('./models/Frekwencja');

const app = express();
const PORT = process.env.PORT || 3000;

require('dotenv').config();
const MONGO_URI = process.env.MONGO_URI;




mongoose.connect(MONGO_URI)
    .then(()=> console.log('Polaczono z MongoDB!'))
    .catch(err => console.error('Błąd polaczenia z baza: ', err));


app.use(express.static('public'));
app.use(express.json());


// ==========================================
// 1. KONFIGURACJA CLOUDINARY
// ==========================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Wklej z panelu Cloudinary
    api_key: process.env.CLOUDINARY_API_KEY,         // Wklej z panelu Cloudinary
    api_secret: process.env.CLOUDINARY_API_SECRET    // Wklej z panelu Cloudinary
});

// ==========================================
// 2. KONFIGURACJA MULTERA (Żeby wysyłał od razu do chmury)
// ==========================================
const storage = new CloudinaryStorage({
    cloudinary: cloudinary, // Tu przekazujemy skonfigurowaną instancję cloudinary
    params: {
        folder: 'szkola_aktualnosci',       // Nazwa folderu, który sam się utworzy w chmurze
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // Jakie pliki akceptujemy

    },
});

const upload = multer({ storage: storage });




//AKTUALNOSCI

app.get('/api/aktualnosci', async(req,res)=>{
    try{
        const aktualnosci = await Aktualnosci.find().sort({data:-1}).limit(5);
        res.json(aktualnosci);

    }catch(error){
        res.status(500).json({ message: error.message});
    }
});

// --- ZMODYFIKOWANY POST (PODMIEŃ STARY NA TEN) ---
// POST: Dodaj aktualność (zdjęcie leci do Cloudinary)
app.post('/api/aktualnosci', upload.single('zdjecie'), async(req,res)=>{
    try{
        // Cloudinary automatycznie zwraca link w req.file.path
        const sciezkaDoZdjecia = req.file ? req.file.path : 'https://via.placeholder.com/150';

        const newAktualnosci = new Aktualnosci({
            naglowek: req.body.naglowek,
            tresc: req.body.tresc,
            zdjecieUrl: sciezkaDoZdjecia // To teraz będzie link https://res.cloudinary.com/...
        });

        const zapisanyAktualnosci = await newAktualnosci.save();
        res.status(201).json(zapisanyAktualnosci);
    }catch(error){
        res.status(400).json({message:error.message});
    }
});

// DELETE: Usuń aktualność i zdjęcie z Cloudinary
app.delete('/api/aktualnosci/:id', async (req, res) => {
    try {
        const artykul = await Aktualnosci.findById(req.params.id);
        if (!artykul) return res.status(404).json({ message: "Nie znaleziono" });

        // Jeśli zdjęcie jest z Cloudinary, musimy je usunąć
        if (artykul.zdjecieUrl && artykul.zdjecieUrl.includes('cloudinary')) {
            // Wyciąganie "public_id" z linku URL (trochę magii stringów)
            // Link wygląda np. tak: .../szkola_aktualnosci/abcde.jpg
            const nazwaPliku = artykul.zdjecieUrl.split('/').pop().split('.')[0];
            const publicId = `szkola_aktualnosci/${nazwaPliku}`;

            // Usuwanie z chmury
            await cloudinary.uploader.destroy(publicId);
        }

        await Aktualnosci.findByIdAndDelete(req.params.id);
        res.json({ message: "Usunięto wpis i zdjęcie z chmury" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Błąd usuwania" });
    }
});




// ==========================================
// SEKCJA ZARZĄDZANIA UŻYTKOWNIKAMI (ADMIN)
// ==========================================

// 1. GET: Pobierz listę wszystkich użytkowników
app.get('/api/uzytkownicy', async (req, res) => {
    try {
        // Pobieramy wszystkich, ale bez pola 'haslo' (bezpieczeństwo)
        const users = await Student.find().select('-haslo');
        res.json(users);
    } catch (error) {
        console.error("Błąd pobierania użytkowników:", error);
        res.status(500).json({ message: "Błąd serwera" });
    }
});

// 2. DELETE: Usuń użytkownika po ID
app.delete('/api/uzytkownicy/:id', async (req, res) => {
    try {
        const idDoUsuniecia = req.params.id;
        await Student.findByIdAndDelete(idDoUsuniecia);
        res.json({ message: "Użytkownik został usunięty" });
    } catch (error) {
        console.error("Błąd usuwania:", error);
        res.status(500).json({ message: "Błąd podczas usuwania" });
    }
});

// 3. PUT: Edytuj dane użytkownika (Imie, Nazwisko, Login, Klasa)
app.put('/api/uzytkownicy/:id', async (req, res) => {
    try {
        const idDoEdycji = req.params.id;
        // Pobieramy dane z formularza. UWAGA: używamy pola 'klasa'
        const { imie, nazwisko, login, klasa ,status} = req.body;

        const zaktualizowanyUzytkownik = await Student.findByIdAndUpdate(
            idDoEdycji,
            { 
                imie: imie, 
                nazwisko: nazwisko, 
                login: login, 
                klasa: klasa,
                status: status
            },
            { new: true } // Opcja, żeby baza zwróciła już nowy, poprawiony obiekt
        );

        res.json(zaktualizowanyUzytkownik);

    } catch (error) {
        console.error("Błąd edycji:", error);
        res.status(500).json({ message: "Błąd edycji danych" });
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
            data: new Date(),
            wstawil: nowaOcena.wstawil || "Nieznany"
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


// GET: Pobierz listę wszystkich unikalnych przedmiotów w systemie
app.get('/api/lista-przedmiotow', async (req, res) => {
    try {
        // "distinct" wyciąga unikalne wartości z pola "przedmiot"
        const przedmioty = await Ocena.distinct("przedmiot");
        res.json(przedmioty);
    } catch (error) {
        res.status(500).json({ message: "Błąd: " + error.message });
    }
});

// 1. GET: Pobierz wszystkie oceny wystawione przez konkretnego nauczyciela
app.get('/api/nauczyciel/wystawione-oceny/:nauczycielId', async (req, res) => {
    const { nauczycielId } = req.params;

    try {
        // Szukamy dokumentów, które w tablicy 'oceny' mają wpis z danym 'wstawil'
        const dokumenty = await Ocena.find({ "oceny.wstawil": nauczycielId });

        let znalezioneOceny = [];

        // Musimy "ręcznie" przefiltrować tablice, żeby wyciągnąć tylko te konkretne oceny
        dokumenty.forEach(doc => {
            doc.oceny.forEach(ocena => {
                if (ocena.wstawil === nauczycielId) {
                    znalezioneOceny.push({
                        // Musimy wiedzieć KOGO i Z CZEGO dotyczy ocena, żeby ją potem usunąć
                        studentIndeks: doc.indeks,
                        przedmiot: doc.przedmiot,
                        // Dane samej oceny
                        ocenaId: ocena._id, // WAŻNE: To unikalne ID oceny
                        wartosc: ocena.wartosc,
                        opis: ocena.opis,
                        data: ocena.data
                    });
                }
            });
        });

        res.json(znalezioneOceny);

    } catch (error) {
        res.status(500).json({ message: "Błąd serwera: " + error.message });
    }
});

// 2. DELETE: Usuń konkretną ocenę cząstkową
app.delete('/api/oceny/usun', async (req, res) => {
    // Potrzebujemy 3 informacji, żeby trafić w cel
    const { studentIndeks, przedmiot, ocenaId } = req.body;

    try {
        // Używamy $pull - to komenda MongoDB "wyciągnij z tablicy element o danym ID"
        const wynik = await Ocena.updateOne(
            { indeks: studentIndeks, przedmiot: przedmiot },
            { $pull: { oceny: { _id: ocenaId } } }
        );

        if (wynik.modifiedCount > 0) {
            res.json({ message: "Ocena została usunięta." });
        } else {
            res.status(404).json({ message: "Nie znaleziono oceny lub już została usunięta." });
        }

    } catch (error) {
        res.status(500).json({ message: "Błąd usuwania: " + error.message });
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



app.get('/api/zajecia/nauczyciel', async (req, res) => {
    const { prowadzacy } = req.query;

    try {
        let zajecia;

        if (prowadzacy) {
            zajecia = await Zajecia.find({ prowadzacy });
        } else {
            zajecia = await Zajecia.find();
        }

        res.json(zajecia);
    } catch (err) {
        res.status(500).json({ error: 'Błąd pobierania zajęć' });
    }
});




app.get('/api/studenci', async (req, res) => {
    const { klasa } = req.query;

    try {
        let filter = {};

        // tylko studenci z danej klasy
        if (klasa) {
            filter.klasa = klasa;
        }

        // ❗ wywal adminów i nauczycieli
        filter.klasa = {
            $nin: ['Admin', 'admin', 'Nauczyciel', 'nauczyciel'],
            ...(klasa ? { $eq: klasa } : {})
        };

        const studenci = await Student.find(filter);
        res.json(studenci);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd pobierania studentów' });
    }
});


// FREKWENCJA ITD

app.get('/api/zajecia/nauczyciel', async (req, res) => {
    const { prowadzacy } = req.query;

    try {
        let zajecia;

        if (prowadzacy) {
            zajecia = await Zajecia.find({ prowadzacy });
        } else {
            zajecia = await Zajecia.find();
        }

        res.json(zajecia);
    } catch (err) {
        res.status(500).json({ error: 'Błąd pobierania zajęć' });
    }
});




app.get('/api/studenci', async (req, res) => {
    const { klasa } = req.query;

    try {
        let filter = {};

        // tylko studenci z danej klasy
        if (klasa) {
            filter.klasa = klasa;
        }

        // ❗ wywal adminów i nauczycieli
        filter.klasa = {
            $nin: ['Admin', 'admin', 'Nauczyciel', 'nauczyciel'],
            ...(klasa ? { $eq: klasa } : {})
        };

        const studenci = await Student.find(filter);
        res.json(studenci);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd pobierania studentów' });
    }
});




app.get('/api/frekwencja', async (req, res) => {
    const { zajeciaId, data } = req.query;

    if (!zajeciaId || !data) {
        return res.status(400).json({ error: 'Brak danych' });
    }

    try {
        const frekwencja = await Frekwencja.find({
            zajeciaId,
            data: new Date(data)
        }).select('studentId status');

        res.json(frekwencja); // może być pusta tablica
    } catch (err) {
        res.status(500).json({ error: 'Błąd pobierania frekwencji' });
    }
});

// pobierz wszystkie frekwencje dla zajęć (nauczyciel)
app.get('/api/frekwencja/wszystkie', async (req, res) => {
    const { zajeciaId } = req.query;

    if (!zajeciaId) {
        return res.status(400).json({ error: 'Brak zajeciaId' });
    }

    try {
        const frekwencja = await Frekwencja.find({ zajeciaId })
            .populate('studentId', 'imie nazwisko klasa'); // 👈 ważne, żeby dostać dane studenta

        res.json(frekwencja);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd pobierania frekwencji' });
    }
});


app.post('/api/frekwencja', async (req, res) => {
    const { zajeciaId, data, frekwencja } = req.body;

    if (!zajeciaId || !data || !frekwencja) {
        return res.status(400).json({ error: 'Brak danych' });
    }

    try {
        // 🔥 USUŃ STARĄ FREKWENCJĘ (JEŚLI JEST)
        await Frekwencja.deleteMany({
            zajeciaId,
            data: new Date(data)
        });

        // 🔥 ZAPISZ NOWĄ
        const zapisy = frekwencja.map(f => ({
            zajeciaId,
            studentId: f.studentId,
            data: new Date(data),
            status: f.status
        }));

        await Frekwencja.insertMany(zapisy);

        res.json({ message: 'Frekwencja zapisana / zaktualizowana' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd zapisu frekwencji' });
    }
});


// ===============================
// FREKWENCJA – STUDENT (MOJA)
// ===============================
app.get('/api/frekwencja/student', async (req, res) => {
    const { zajeciaId, login } = req.query;

    if (!zajeciaId || !login) {
        return res.status(400).json({ error: 'Brak danych' });
    }

    try {
        const frekwencja = await Frekwencja.find({ zajeciaId })
            .populate('studentId', 'imie nazwisko klasa login');

        // tylko frekwencja zalogowanego studenta
        const moja = frekwencja.filter(f =>
            f.studentId && f.studentId.login === login
        );

        res.json(moja);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd pobierania frekwencji studenta' });
    }
});






app.use((req, res) =>{
    res.status(404).send('<h1>404 - Nie znaleziono takiej strony uniwersytetu!</h1>');
});

app.listen(PORT, ()=>{
    console.log(`Serwer uniwersytetu działa na : http.//localhost:${PORT}`);
});