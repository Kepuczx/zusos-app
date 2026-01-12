document.addEventListener('DOMContentLoaded', async () => {
    const zajeciaSelect = document.createElement('select');
zajeciaSelect.classList.add('status-select'); // <- dodajemy klasę
zajeciaSelect.innerHTML = '<option value="">-- wybierz przedmiot --</option>';
    const sprawdzBtn = document.createElement('button');
sprawdzBtn.classList.add('sprawdz-btn'); // <- dodajemy klasę
sprawdzBtn.textContent = '📊 Sprawdź frekwencję';

    const wynikDiv = document.createElement('div');
    wynikDiv.id = 'wynikDiv'; // <- tutaj dodajemy ID!

    const nazwiskoNauczyciela = localStorage.getItem('userNazwisko');

    // Dodajemy elementy do strony
    const menu = document.querySelector('.frekwencja-menu');
    zajeciaSelect.innerHTML = '<option value="">-- wybierz przedmiot --</option>';
    sprawdzBtn.textContent = '📊 Sprawdź frekwencję';
    menu.appendChild(zajeciaSelect);
    menu.appendChild(sprawdzBtn);
    menu.appendChild(wynikDiv);

    // ===============================
    // POBIERZ PRZEDMIOTY NAUCZYCIELA
    // ===============================
    const zajeciaRes = await fetch(`/api/zajecia/nauczyciel?prowadzacy=${encodeURIComponent(nazwiskoNauczyciela)}`);
    const zajecia = await zajeciaRes.json();

    zajecia.forEach(z => {
        const opt = document.createElement('option');
        opt.value = z._id;
        opt.textContent = `${z.nazwa} (${z.grupaZaj})`;
        opt.dataset.klasa = z.grupaZaj; // zachowujemy info o klasie
        zajeciaSelect.appendChild(opt);
    });

    // ===============================
    // SPRAWDŹ FREKWENCJĘ
    // ===============================
    sprawdzBtn.addEventListener('click', async () => {
        wynikDiv.innerHTML = '';

        const zajeciaId = zajeciaSelect.value;

        if (!zajeciaId) {
            return alert('Ej stary, wybierz przedmiot 😎');
        }

        // znajdź klasę przypisaną do wybranego zajęcia
        const wybraneZajecia = zajecia.find(z => z._id === zajeciaId);
        const klasa = wybraneZajecia.grupaZaj;

        // 1️⃣ pobierz wszystkich studentów z tej klasy
        const studRes = await fetch(`/api/studenci?klasa=${klasa}`);
        const studenci = await studRes.json();

        if (!studenci.length) {
            return wynikDiv.innerHTML = '<p>Brak studentów w tej klasie 😕</p>';
        }

        // 2️⃣ pobierz wszystkie frekwencje dla tego przedmiotu
        const frekRes = await fetch(`/api/frekwencja/wszystkie?zajeciaId=${zajeciaId}`);
        const wszystkieFrek = await frekRes.json();

        // 3️⃣ grupujemy po studentach
        const frekMapa = {}; // studentId -> [{data, status}, ...]
        wszystkieFrek.forEach(f => {
            const sId = f.studentId._id;
            if (!frekMapa[sId]) frekMapa[sId] = [];
            frekMapa[sId].push({
                data: new Date(f.data).toLocaleDateString(),
                status: f.status
            });
        });

        // 4️⃣ renderujemy tabelę
const tabela = document.createElement('table');
tabela.innerHTML = `
    <thead>
        <tr>
            <th>Student</th>
            <th>Klasa</th>
            <th>Data</th>
            <th>Status</th>
        </tr>
    </thead>
    <tbody></tbody>
`;
const tbody = tabela.querySelector('tbody');

const defaultAvatar = '../images/awatar.png'; // <-- ścieżka do domyślnego awatara

studenci.forEach(s => {
    const wpisy = frekMapa[s._id] || [];
    
    if (wpisy.length === 0) {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td class="student-name-cell">
                <img 
    src="${s.zdjecieURL && s.zdjecieURL.trim() !== '' ? s.zdjecieURL : '/images/awatar.png'}" 
    alt="avatar" 
    class="student-avatar"
    onerror="this.onerror=null; this.src='/images/awatar.png';"
/>

                ${s.imie} ${s.nazwisko}
            </td>
            <td>${s.klasa}</td>
            <td>-</td>
            <td class="status-brak">brak danych</td>
        `;
        tbody.appendChild(tr);
    } else {
        wpisy.forEach(f => {
            const tr = document.createElement('tr');

            // klasa statusu
            let statusClass = '';
            switch(f.status.trim().toLowerCase()) {
                case 'obecny': statusClass = 'status-obecny'; break;
                case 'usprawiedliwiony': statusClass = 'status-usprawiedliwiony'; break;
                case 'nieobecny': statusClass = 'status-nieobecny'; break;
                case 'brak': statusClass = 'status-brak'; break;
                case 'spóźniony': statusClass = 'status-spozniony'; break;
                default: statusClass = '';
            }

            tr.innerHTML = `
                <td class="student-name-cell">
                    <img 
    src="${s.zdjecieURL && s.zdjecieURL.trim() !== '' ? s.zdjecieURL : '/images/awatar.png'}" 
    alt="avatar" 
    class="student-avatar"
    onerror="this.onerror=null; this.src='/images/awatar.png';"
/>

                    ${s.imie} ${s.nazwisko}
                </td>
                <td>${s.klasa}</td>
                <td>${f.data}</td>
                <td class="${statusClass}">${f.status}</td>
            `;
            tbody.appendChild(tr);
        });
    }
});

wynikDiv.appendChild(tabela);

    });
});
