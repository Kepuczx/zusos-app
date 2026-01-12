document.addEventListener('DOMContentLoaded', async () => {

    const wynikDiv = document.getElementById('frekwencjaWynik');

    const userImie = localStorage.getItem('userImie') || '—';
    const userNazwisko = localStorage.getItem('userNazwisko') || '—';
    const userKlasa = localStorage.getItem('userklasa') || '—';
    const userLogin = localStorage.getItem('userLogin') || '';

    // Tworzymy div na info o studencie
    let studentInfoDiv = document.getElementById('studentInfo');
    if (!studentInfoDiv) {
        studentInfoDiv = document.createElement('div');
        studentInfoDiv.id = 'studentInfo';
        studentInfoDiv.style.marginBottom = '20px';
        wynikDiv.parentNode.insertBefore(studentInfoDiv, wynikDiv);
    }

    studentInfoDiv.innerHTML = `
        <h3>${userImie} ${userNazwisko}</h3>
        <p><b>Klasa:</b> ${userKlasa}</p>
        <hr>
    `;

    // Kontener na przedmioty
    let przedmiotyDiv = document.getElementById('przedmiotyDiv');
    if (!przedmiotyDiv) {
        przedmiotyDiv = document.createElement('div');
        przedmiotyDiv.id = 'przedmiotyDiv';
        przedmiotyDiv.style.display = 'flex';
        przedmiotyDiv.style.flexWrap = 'wrap';
        przedmiotyDiv.style.gap = '15px';
        przedmiotyDiv.style.marginBottom = '20px';
        studentInfoDiv.parentNode.insertBefore(przedmiotyDiv, wynikDiv);
    }

    // ============================================
    // POBIERANIE PRZEDMIOTÓW
    // ============================================
    let zajecia = [];
    try {
        const res = await fetch(`/api/plan?klasa=${encodeURIComponent(userKlasa)}`);
        zajecia = await res.json();
        if (!Array.isArray(zajecia) || zajecia.length === 0) {
            przedmiotyDiv.innerHTML = '<p>Brak zajęć dla Twojej grupy</p>';
            return;
        }
    } catch (err) {
        console.error(err);
        przedmiotyDiv.innerHTML = '<p>Błąd pobierania zajęć</p>';
        return;
    }

    // ============================================
    // Funkcja pobierająca % obecności dla przedmiotu
    // ============================================
    const fetchProcent = async (zajeciaId) => {
        try {
            const res = await fetch(`/api/frekwencja/student?zajeciaId=${zajeciaId}&login=${userLogin}`);
            const frekwencje = await res.json();
            if (!frekwencje.length) return { procent: 0, frekwencje: [] };

            const obecnosci = frekwencje.filter(f =>
                ['obecny', 'usprawiedliwiony', 'spóźniony', 'spozniony'].includes(f.status.toLowerCase())
            ).length;

            const procent = Math.round((obecnosci / frekwencje.length) * 100);
            return { procent, frekwencje };
        } catch {
            return { procent: 0, frekwencje: [] };
        }
    };

    // Generujemy przyciski przedmiotów
    for (const z of zajecia) {
        const karta = document.createElement('button');
        karta.style.padding = '10px 15px';
        karta.style.border = '1px solid #333';
        karta.style.borderRadius = '8px';
        karta.style.cursor = 'pointer';
        karta.style.backgroundColor = '#f0f0f0';
        karta.style.display = 'flex';
        karta.style.flexDirection = 'column';
        karta.style.alignItems = 'flex-start';
        karta.style.minWidth = '180px';
        karta.style.transition = 'all 0.2s';
        karta.onmouseover = () => karta.style.backgroundColor = '#e0e0e0';
        karta.onmouseout = () => karta.style.backgroundColor = '#f0f0f0';

        const nazwa = document.createElement('span');
        nazwa.textContent = `${z.nazwa} | ${z.dzien} ${z.godzinaOd}-${z.godzinaDo}`;

        const procentSpan = document.createElement('span');
        procentSpan.style.fontWeight = 'bold';
        procentSpan.style.marginTop = '5px';
        procentSpan.textContent = '...%';

        karta.appendChild(nazwa);
        karta.appendChild(procentSpan);
        przedmiotyDiv.appendChild(karta);

        // Pobierz % obecności dla tego przedmiotu
        fetchProcent(z._id).then(({procent, frekwencje}) => {
            const progZaliczenia = z.procentZaliczenia ?? 50;
            procentSpan.textContent = `${procent}% (${progZaliczenia}% aby zdać)`;
            procentSpan.style.color = procent >= progZaliczenia ? '#2fbf71' : '#ff4d4d';
        });

        // Kliknięcie – wyświetlamy tabelę frekwencji
        karta.addEventListener('click', async () => {
            // zaznacz aktywną kartę
            document.querySelectorAll('#przedmiotyDiv button').forEach(b => b.classList.remove('active'));
            karta.classList.add('active');

            const { procent, frekwencje } = await fetchProcent(z._id);
            const progZaliczenia = z.procentZaliczenia ?? 50;

            if (!frekwencje.length) {
                wynikDiv.innerHTML = '<p>Brak frekwencji dla tego przedmiotu.</p>';
                return;
            }

            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            frekwencje.forEach(f => {
                let statusClass = '';
                switch(f.status.toLowerCase()) {
                    case 'obecny': statusClass = 'status-obecny'; break;
                    case 'usprawiedliwiony': statusClass = 'status-usprawiedliwiony'; break;
                    case 'nieobecny': statusClass = 'status-nieobecny'; break;
                    case 'spóźniony':
                    case 'spozniony': statusClass = 'status-spozniony'; break;
                    default: statusClass = 'status-brak';
                }

                html += `
                    <tr>
                        <td>${new Date(f.data).toLocaleDateString()}</td>
                        <td class="${statusClass}">${f.status}</td>
                    </tr>
                `;
            });

            html += `
                    </tbody>
                </table>
                <p style="margin-top:10px; font-weight:bold; color:${procent >= progZaliczenia ? '#2fbf71' : '#ff4d4d'}">
                    Suma obecności: ${procent}% (${progZaliczenia}% aby zdać)
                </p>
            `;

            wynikDiv.innerHTML = html;
        });
    }

});
