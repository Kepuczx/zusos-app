// === CZĘŚĆ 1: OCHRONIARZ (Sprawdzamy przy wejściu) ===

function sprawdzLogowanie() {
    // Sprawdź, czy jesteśmy na stronie logowania (żeby nie robić pętli nieskończonej!)
    // Jeśli adres zawiera "login.html", przerywamy sprawdzanie.
    if (window.location.pathname.includes('login.html')) {
        return;
    }

    const czyZalogowany = localStorage.getItem('zalogowany');

    if (!czyZalogowany) {
        // Jeśli brak wejściówki -> wyrzucamy do logowania
        // Używamy ścieżki bezwzględnej (/), zadziała z każdego folderu
        window.location.href = '/sites/login.html';
    }
}

// Uruchamiamy sprawdzanie NATYCHMIAST (zanim załaduje się reszta strony)
sprawdzLogowanie();


// === CZĘŚĆ 2: AWATAR (Ładujemy zdjęcie) ===

// Czekamy, aż HTML się zbuduje, żeby znaleźć obrazek
document.addEventListener('DOMContentLoaded', () => {
    const avatarImg = document.querySelector('.avatar img'); // Szukamy obrazka w klasie .avatar
    const zapisanyAvatar = localStorage.getItem('userAvatar');

    // Jeśli znaleźliśmy miejsce na obrazek I mamy zapisany link
    if (avatarImg && zapisanyAvatar) {
        avatarImg.src = zapisanyAvatar;
    }
});


// === CZĘŚĆ 3: WYLOGOWYWANIE (Funkcja dla przycisku) ===

function wyloguj() {
    // Czyścimy pamięć
    localStorage.removeItem('zalogowany');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('userLogin');
    localStorage.removeItem('userImie');
    localStorage.removeItem('userNazwisko');
    localStorage.removeItem('userklasa');
    
    // Przekierowujemy do logowania
    window.location.href = '/sites/login.html';
}