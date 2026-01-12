document.addEventListener('DOMContentLoaded', async () => {
    const zajeciaSelect = document.getElementById('zajeciaSelectProc');
    const sprawdzBtn = document.getElementById('btnSprawdzProc');
    const wynikDiv = document.getElementById('wynikProcDiv');

    const nazwiskoNauczyciela = localStorage.getItem('userNazwisko');

    // ===== 1️⃣ Pobierz przedmioty nauczyciela =====
    const zajeciaRes = await fetch(`/api/zajecia/nauczyciel?prowadzacy=${encodeURIComponent(nazwiskoNauczyciela)}`);
    const zajecia = await zajeciaRes.json();

    zajecia.forEach(z => {
        const opt = document.createElement('option');
        opt.value = z._id;
        opt.textContent = `${z.nazwa} (${z.grupaZaj})`;
        opt.dataset.klasa = z.grupaZaj;
        zajeciaSelect.appendChild(opt);
    });

    // ===== 2️⃣ Obsługa przycisku =====
    sprawdzBtn.addEventListener('click', async () => {
        wynikDiv.innerHTML = '';

        const zajeciaId = zajeciaSelect.value;
        if (!zajeciaId) return alert('Ej stary, wybierz przedmiot 😎');

        const wybraneZajecia = zajecia.find(z => z._id === zajeciaId);
        const klasa = wybraneZajecia.grupaZaj;
        const progZaliczenia = wybraneZajecia.procentZaliczenia ?? 50; // domyślnie 50%

        // 1️⃣ pobierz studentów
        const studRes = await fetch(`/api/studenci?klasa=${klasa}`);
        const studenci = await studRes.json();
        if (!studenci.length) return wynikDiv.innerHTML = '<p>Brak studentów w tej klasie 😕</p>';

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

        // 4️⃣ Renderujemy tabelę z frekwencją procentową
        const tabela = document.createElement('table');
        tabela.innerHTML = `
            <thead>
                <tr>
                    <th>Student</th>
                    <th>Klasa</th>
                    <th>Suma %</th>
                    <th>Obecny %</th>
                    <th>Spóźniony %</th>
                    <th>Uspr%</th>
                    <th>Nieobecny %</th>
                    <th>Brak %</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = tabela.querySelector('tbody');

        studenci.forEach(s => {
            const wpisy = frekMapa[s._id] || [];
            const total = wpisy.length || 1; // unikamy dzielenia przez 0
            const stat = { obecny: 0, 'spóźniony': 0, usprawiedliwiony: 0, nieobecny: 0, brak: 0 };

            wpisy.forEach(f => {
                const key = f.status.trim().toLowerCase();
                if (stat[key] !== undefined) stat[key]++;
                else stat.brak++;
            });

            const procent = key => ((stat[key] / total) * 100).toFixed(0) + '%';
            const sumaObecnosciVal = ((stat.obecny + stat['spóźniony'] + stat.usprawiedliwiony) / total * 100).toFixed(0);

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
                <td>${sumaObecnosciVal}% (${progZaliczenia}% aby zdać)</td>
                <td>${procent('obecny')}</td>
                <td>${procent('spóźniony')}</td>
                <td>${procent('usprawiedliwiony')}</td>
                <td>${procent('nieobecny')}</td>
                <td>${procent('brak')}</td>
            `;
            tbody.appendChild(tr);

            // ===== podświetlamy tylko Suma % =====
            const sumaCell = tr.querySelector('td:nth-child(3)');
            if (sumaObecnosciVal >= progZaliczenia) {
                sumaCell.style.color = '#2fbf71'; // zielony
            } else {
                sumaCell.style.color = '#ff4d4d'; // czerwony
            }
        });

        wynikDiv.appendChild(tabela);
    });
});
