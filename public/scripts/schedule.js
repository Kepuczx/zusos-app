const dni = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'];

// generujemy godziny od 8:00 do 15:00 co 15 minut
function generujBloki(start = 8, end = 15) {
    const bloki = [];
    for (let h = start; h <= end; h++) {
        [0, 15, 30, 45].forEach(min => {
            const czas = `${h.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
            bloki.push(czas);
        });
    }
    return bloki;
}

const bloki = generujBloki();

function czasNaMinuty(czas) {
    const [h, m] = czas.split(':').map(Number);
    return h * 60 + m;
}

function obliczSpan(godzinaOd, godzinaDo) {
    const startMin = czasNaMinuty(godzinaOd);
    const endMin = czasNaMinuty(godzinaDo);
    const trwanieMin = endMin - startMin;
    return Math.max(1, Math.ceil(trwanieMin / 15));
}

// Funkcja normalizująca typ zajęć do CSS
function typNaKlase(typ) {
    if (!typ) return '';
    return typ
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,'') // usuwa akcenty
        .replace(/ł/g,'l').replace(/Ł/g,'L') // zamiana ł na l
        .toLowerCase()                    // małe litery
        .replace(/\s+/g,'');              // usuwa spacje
}


async function pobierzPlan() {
    const klasa = localStorage.getItem('userklasa');
    const nazwisko = localStorage.getItem('userNazwisko');

    if (!klasa) {
        console.error('Brak klasy w localStorage');
        return;
    }

    let url = `/api/plan?klasa=${encodeURIComponent(klasa)}`;
    if (klasa === 'Nauczyciel' || klasa === 'szlachta') {
        url += `&nazwisko=${encodeURIComponent(nazwisko)}`;
    }

    try {
        const res = await fetch(url);
        const zajecia = await res.json();
        console.log('PLAN:', zajecia);

        const container = document.getElementById('schedule');
        container.querySelectorAll('.schedule-row').forEach(e => e.remove());

        // Tworzymy pustą siatkę
        bloki.forEach(blok => {
            const row = document.createElement('div');
            row.className = 'schedule-row';
            row.dataset.hour = blok;

            const [godzina, minuty] = blok.split(':');
            const hourCell = document.createElement('div');
            hourCell.className = 'hour';
            hourCell.textContent = minuty === "00" ? `${godzina}:00` : "";
            row.appendChild(hourCell);

            dni.forEach(() => {
                const cell = document.createElement('div');
                cell.className = 'schedule-cell';
                row.appendChild(cell);
            });

            container.appendChild(row);
        });

        // Wypełniamy zajęciami
        zajecia.forEach(z => {
            const dzienIdx = dni.indexOf(z.dzien);
            if (dzienIdx === -1) return;

            const startMin = czasNaMinuty(z.godzinaOd);
            const blokIndex = Math.floor((startMin - czasNaMinuty('08:00')) / 15);
            if (blokIndex < 0 || blokIndex >= bloki.length) return;

            const spanRows = obliczSpan(z.godzinaOd, z.godzinaDo);
            const rows = container.querySelectorAll('.schedule-row');
            const startRow = rows[blokIndex];
            if (!startRow) return;

            const targetCell = startRow.querySelectorAll('.schedule-cell')[dzienIdx];
            if (!targetCell) return;

            const cssClass = typNaKlase(z.typ); // <-- użycie normalizacji
            const lesson = document.createElement('div');
            lesson.className = `lesson ${cssClass}`;
            lesson.dataset.span = spanRows;
            lesson.style.height = `calc(${spanRows} * 60px - 4px)`;

            lesson.innerHTML = `
    <div class="lesson-time">${z.godzinaOd} - ${z.godzinaDo}</div>
    <strong>${z.nazwa}</strong>
    ${z.sala ? `<div class="lesson-sala">Sala: ${z.sala}</div>` : ''}
    ${z.prowadzacy ? `<div class="lesson-prowadzacy">Prowadzący: ${z.prowadzacy}</div>` : ''}
`;

            targetCell.innerHTML = '';
            targetCell.appendChild(lesson);

            for (let i = 1; i < spanRows; i++) {
                const nextRowIdx = blokIndex + i;
                if (nextRowIdx >= rows.length) break;
                const nextCell = rows[nextRowIdx].querySelectorAll('.schedule-cell')[dzienIdx];
                if (nextCell) nextCell.innerHTML = '';
            }
        });

    } catch (err) {
        console.error('Błąd pobierania planu:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('schedule');
    const klasa = localStorage.getItem('userklasa');
    const nazwisko = localStorage.getItem('userNazwisko');

    // Tworzymy nagłówek
    const header = document.createElement('h2');
    header.className = 'schedule-title';

    if (klasa && klasa !== 'Nauczyciel' && klasa !== 'szlachta') {
        header.textContent = `Plan zajęć dla ${klasa}`;
    } else if (nazwisko) {
        header.textContent = `Plan zajęć dla ${nazwisko}`;
    } else {
        header.textContent = `Plan zajęć`;
    }

    container.parentNode.insertBefore(header, container);

    // Teraz reszta funkcji pobierania planu
    pobierzPlan();
});


document.addEventListener('DOMContentLoaded', pobierzPlan);
