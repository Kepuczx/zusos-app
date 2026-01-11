// --- ZMIENNE POMOCNICZE ---
const loginNauczyciela = localStorage.getItem('userLogin');
const listaOcenDiv = document.getElementById('lista-ocen');
const logOcena = document.getElementById('logOcena');

// --- 1. FUNKCJA POBIERAJĄCA I WYŚWIETLAJĄCA LISTĘ ---
async function odswiezListeOcen() {
    if (!loginNauczyciela) return;

    try {
        // Pobieramy oceny wystawione przez tego nauczyciela
        const res = await fetch(`/api/nauczyciel/wystawione-oceny/${loginNauczyciela}`);
        let oceny = await res.json();

        oceny.sort((a, b) => new Date(b.data) - new Date(a.data));

        // Czyścimy obecną listę
        listaOcenDiv.innerHTML = '';

        if (oceny.length === 0) {
            listaOcenDiv.innerHTML = '<p style="text-align:center; color:#888;">Brak wystawionych ocen.</p>';
            return;
        }

        // Generujemy HTML dla każdej oceny
        oceny.forEach(ocena => {
            const wiersz = document.createElement('div');
            wiersz.className = 'wiersz-oceny'; // Klasa do stylowania w CSS
            
            wiersz.innerHTML = `
                <div class="info">
                    <span class="student">Indeks: ${ocena.studentIndeks}</span>
                    <span class="przedmiot">${ocena.przedmiot}</span>
                    <span class="ocena-wartosc">${ocena.wartosc}</span>
                    <span class="opis">(${ocena.opis})</span>
                </div>
                <button class="btn-usun" onclick="usunOcene('${ocena.studentIndeks}', '${ocena.przedmiot}', '${ocena.ocenaId}')">
                    &times;
                </button>
            `;
            listaOcenDiv.appendChild(wiersz);
        });

    } catch (err) {
        console.error("Błąd odświeżania listy:", err);
    }
}

// --- 2. OBSŁUGA FORMULARZA (DODAWANIE) ---
document.getElementById('formOcena').addEventListener('submit', async (e) => {
    e.preventDefault();
    logOcena.textContent = "Wysyłanie...";
    logOcena.style.color = "#aaa";

    const data = {
        indeks: document.getElementById('o_indeks').value,
        przedmiot: document.getElementById('o_przedmiot').value,
        nowaOcena: {
            wartosc: document.getElementById('o_wartosc').value,
            opis: document.getElementById('o_opis').value,
            wstawil: loginNauczyciela // Ważne!
        }
    };

    try {
        const res = await fetch('/api/dodaj-ocene-czastkowa', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();

        if(res.ok) {
            logOcena.textContent = "Dodano pomyślnie!";
            logOcena.style.color = "green";
            
            // Czyścimy pola formularza (oprócz przedmiotu, bo często dodaje się kilka ocen z rzędu)
            document.getElementById('o_indeks').value = '';
            document.getElementById('o_wartosc').value = '';
            document.getElementById('o_opis').value = '';

            // KLUCZOWE: Odświeżamy listę na dole!
            odswiezListeOcen();
        } else {
            throw new Error(json.message);
        }
    } catch (err) {
        logOcena.textContent = "Błąd: " + err.message;
        logOcena.style.color = "red";
    }
});

// --- 3. FUNKCJA USUWANIA ---
async function usunOcene(indeks, przedmiot, idOceny) {
    if(!confirm("Usunąć tę ocenę?")) return;

    try {
        const res = await fetch('/api/oceny/usun', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentIndeks: indeks,
                przedmiot: przedmiot,
                ocenaId: idOceny
            })
        });

        if(res.ok) {
            odswiezListeOcen(); // Odśwież listę po usunięciu
        } else {
            alert("Błąd usuwania");
        }
    } catch (err) {
        console.error(err);
    }
}

// --- 4. OBSŁUGA PRZYCISKU "LOSUJ" ---
document.querySelector('.losuj').addEventListener('click', () => {
    const oceny = ['2.0', '3.0', '3.5', '4.0', '4.5', '5.0'];
    const losowa = oceny[Math.floor(Math.random() * oceny.length)];
    document.getElementById('o_wartosc').value = losowa;
});

// NA START: Załaduj listę przy wejściu na stronę
odswiezListeOcen();

// Funkcja pobierająca listę przedmiotów do Selecta
async function zaladujListePrzedmiotow() {
    const select = document.getElementById('o_przedmiot');

    try {
        const res = await fetch('/api/lista-przedmiotow');
        const przedmioty = await res.json();

        // Pętla po każdym przedmiocie z bazy
        przedmioty.forEach(nazwaPrzedmiotu => {
            const opcja = document.createElement('option');
            opcja.value = nazwaPrzedmiotu; // To co pójdzie do bazy
            opcja.textContent = nazwaPrzedmiotu; // To co widzi człowiek
            
            select.appendChild(opcja);
        });

    } catch (err) {
        console.error("Nie udało się pobrać przedmiotów", err);
        // Opcjonalnie: Dodaj opcję awaryjną, jakby serwer padł
        const opcja = document.createElement('option');
        opcja.text = "Błąd pobierania listy";
        select.appendChild(opcja);
    }
}

// WAŻNE: Wywołaj to na starcie, razem z odświeżaniem listy ocen!
document.addEventListener('DOMContentLoaded', () => {
    zaladujListePrzedmiotow();
    // odswiezListeOcen(); // <-- Tu pewnie masz już wywołanie swojej starej funkcji
});