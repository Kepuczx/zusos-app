async function zaladujOcenyDoTabeli() {
    const login = localStorage.getItem('userLogin'); // Pobieramy login
    const tabelaBody = document.getElementById('tabela-body');

    // Zabezpieczenie: jeśli nie ma loginu (niezalogowany), nic nie rób
    if (!login) return;

    try {
        // 1. Pobieramy dane z API
        const response = await fetch(`/api/oceny/${login}`);
        const przedmioty = await response.json();

        // 2. Czyścimy tabelę (na wypadek dublowania)
        tabelaBody.innerHTML = '';

        if (przedmioty.length === 0) {
            tabelaBody.innerHTML = '<tr><td colspan="5">Brak ocen w systemie.</td></tr>';
            return;
        }

        // 3. Pętla przez każdy przedmiot
        przedmioty.forEach(przedmiot => {
            
            // A. Generujemy ładne "dymki" z ocenami cząstkowymi
            // Jeśli przedmiot nie ma ocen, wstawiamy myślnik "-"
            let ocenyCzastkoweHTML = '-';
            
            if (przedmiot.oceny && przedmiot.oceny.length > 0) {
                ocenyCzastkoweHTML = przedmiot.oceny.map(ocena => {
                // Sprawdzamy czy ocena to 2, jeśli tak dajemy czerwony, jeśli nie - czarny (lub inny)
                const kolor = (ocena.wartosc == 2) ? 'red' : (ocena.wartosc == 2.5) ? 'yellow' : 'inherit';
        
                    return `<span title="${ocena.opis}\nWstawił: ${ocena.wstawil || 'Nieznany'}" class="ocena-badge" style="color: ${kolor}">
                        ${ocena.wartosc}
                        </span>`;
            }).join(', ');
            }

            // B. Tworzymy nowy wiersz tabeli
            const wiersz = document.createElement('tr');

            // C. Wypełniamy HTML wiersza pasujący do Twojej tabeli
            wiersz.innerHTML = `
                <td>${przedmiot.przedmiot}</td>
                <td>${przedmiot.prowadzacy}</td>
                <td>${przedmiot.ects}</td>
                <td>${ocenyCzastkoweHTML}</td>
                <td style="font-weight: bold;">${przedmiot.ocenaKoncowa || '-'}</td>
            `;

            // D. Dodajemy wiersz do tabeli
            tabelaBody.appendChild(wiersz);
        });

    } catch (error) {
        console.error("Błąd:", error);
        tabelaBody.innerHTML = '<tr><td colspan="5" style="color:red">Błąd pobierania danych</td></tr>';
    }
}

// Wywołaj funkcję przy starcie strony
zaladujOcenyDoTabeli();