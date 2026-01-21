// Zmienna globalna na listę użytkowników
let allUsers = []; 

// 1. Uruchom przy starcie strony
document.addEventListener('DOMContentLoaded', () => {
    pobierzUzytkownikow();
});

// 2. Funkcja pobierająca dane z serwera
async function pobierzUzytkownikow() {
    try {
        const response = await fetch('/api/uzytkownicy');
        allUsers = await response.json();
        renderTable(allUsers); // Rysujemy tabelę
    } catch (error) {
        console.error("Błąd pobierania:", error);
        alert("Nie udało się pobrać listy użytkowników.");
    }
}

// 3. Funkcja rysująca tabelę (HTML)
function renderTable(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = ''; // Czyścimy tabelę przed narysowaniem

    users.forEach(user => {
        const tr = document.createElement('tr');
        
        // --- A. LOGIKA KOLORÓW KLAS ---
        let badgeClass = '';
        const klasaUsera = (user.klasa || '').toLowerCase(); 

        if (klasaUsera === 'szlachta') {
            badgeClass = 'role-szlachta';
        } else if (klasaUsera === 'nauczyciel') {
            badgeClass = 'role-nauczyciel';
        } else {
            badgeClass = 'role-student-class';
        }

        // --- B. LOGIKA IKON STATUSU (NOWE!) ---
        let statusIcon = '';
        // Pobieramy status lub domyślnie 'aktywny'
        const st = (user.status || 'aktywny').toLowerCase();
        
        if(st === 'aktywny') statusIcon = '🟢';       // Zielona kropka
        else if(st === 'skreślony') statusIcon = '🔴'; // Czerwona kropka
        else if(st === 'urlop') statusIcon = '🟡';     // Żółta kropka
        else if(st === 'absolwent') statusIcon = '🎓'; // Czapka absolwenta

        // --- C. TWORZENIE HTML WIERSZA ---
        tr.innerHTML = `
            <td><strong>${user.imie} ${user.nazwisko}</strong></td>
            <td>${user.login}</td>
            <td>
                <span class="role-badge ${badgeClass}">
                    ${user.klasa || 'Brak'}
                </span>
            </td>
            <td style="font-weight:bold; text-transform: capitalize;">
                ${statusIcon} ${user.status || 'aktywny'}
            </td>
            <td>
                <button class="action-btn btn-edit" onclick="otworzEdycje('${user._id}')">Edytuj</button>
                <button class="action-btn btn-delete" onclick="usunUzytkownika('${user._id}')">Usuń</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 4. Funkcja otwierająca Modal
function otworzEdycje(id) {
    const user = allUsers.find(u => u._id === id);
    if (!user) return;

    document.getElementById('edit_id').value = user._id;
    document.getElementById('edit_imie').value = user.imie;
    document.getElementById('edit_nazwisko').value = user.nazwisko;
    document.getElementById('edit_login').value = user.login;
    document.getElementById('edit_klasa').value = user.klasa; 
    document.getElementById('edit_status').value = user.status || 'aktywny';

    // Resetujemy pole pliku (nie da się ustawić wartości pliku z kodu ze względów bezpieczeństwa)
    document.getElementById('edit_zdjecie_plik').value = "";

    // Opcjonalnie: Pokaż podgląd aktualnego zdjęcia
    const preview = document.getElementById('edit_preview');
    if(user.zdjecieURL && user.zdjecieURL !== '../images/awatar.png') {
        preview.src = user.zdjecieURL;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }

    document.getElementById('editModal').classList.add('active');
}

// 5. Funkcja zamykająca Modal
function zamknijModal() {
    document.getElementById('editModal').classList.remove('active');
}

// 6. Funkcja zapisująca zmiany (Wersja z PLIKIEM - FormData)
async function zapiszZmiany() {
    const id = document.getElementById('edit_id').value;
    const plikInput = document.getElementById('edit_zdjecie_plik');

    // Tworzymy FormData zamiast JSON
    const formData = new FormData();
    
    formData.append('imie', document.getElementById('edit_imie').value);
    formData.append('nazwisko', document.getElementById('edit_nazwisko').value);
    formData.append('login', document.getElementById('edit_login').value);
    formData.append('klasa', document.getElementById('edit_klasa').value);
    formData.append('status', document.getElementById('edit_status').value);

    // Dodajemy plik TYLKO jeśli został wybrany
    if (plikInput.files.length > 0) {
        formData.append('zdjecie', plikInput.files[0]);
    }

    try {
        // UWAGA: Przy FormData NIE ustawiamy nagłówka 'Content-Type': 'application/json'
        // Przeglądarka sama ustawi odpowiedni typ 'multipart/form-data'
        const response = await fetch(`/api/uzytkownicy/${id}`, {
            method: 'PUT',
            body: formData 
        });

        if (response.ok) {
            alert("Zapisano zmiany!");
            zamknijModal();
            pobierzUzytkownikow(); // Odśwież listę
        } else {
            const err = await response.json();
            alert("Błąd: " + err.message);
        }
    } catch (error) {
        console.error("Błąd zapisu:", error);
    }
}

// 7. Funkcja usuwająca użytkownika
async function usunUzytkownika(id) {
    if (!confirm("Czy na pewno chcesz trwale usunąć tego użytkownika?")) return;

    try {
        const response = await fetch(`/api/uzytkownicy/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            pobierzUzytkownikow(); // Odśwież listę
        } else {
            alert("Błąd usuwania.");
        }
    } catch (error) {
        console.error("Błąd usuwania:", error);
    }
}

// 8. Wyszukiwarka
function filtrujUzytkownikow() {
    const input = document.getElementById('userSearch');
    if (!input) return; 
    
    const szukanyTekst = input.value.toLowerCase();
    
    const przefiltrowani = allUsers.filter(user => {
        const imie = (user.imie || '').toLowerCase();
        const nazwisko = (user.nazwisko || '').toLowerCase();
        const login = String(user.login || '').toLowerCase();
        
        const pelneImie = imie + ' ' + nazwisko;

        return imie.includes(szukanyTekst) || 
               nazwisko.includes(szukanyTekst) || 
               login.includes(szukanyTekst) ||
               pelneImie.includes(szukanyTekst);
    });
    
    renderTable(przefiltrowani);
}