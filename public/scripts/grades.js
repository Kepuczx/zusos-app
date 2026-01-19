// 1. POBIERANIE DANYCH Z LOCALSTORAGE (Poprawione nazwy kluczy!)
        // Twój system logowania zapisuje: userLogin, userImie, userNazwisko, userklasa, userAvatar
        
        const userLogin = localStorage.getItem('userLogin');       // Indeks / Login
        const userImie = localStorage.getItem('userImie');         // Imię
        const userNazwisko = localStorage.getItem('userNazwisko'); // Nazwisko
        const userKlasa = localStorage.getItem('userklasa');       // Klasa (np. "1A" lub "Nauczyciel")
        const userAvatar = localStorage.getItem('userAvatar');     // URL do zdjęcia

        // 2. SPRAWDZENIE CZY UŻYTKOWNIK JEST ZALOGOWANY
        if (!userLogin) {
            alert("Nie jesteś zalogowany!");
            window.location.href = '../index.html';
        }

        // 3. WYŚWIETLANIE DANYCH W NAGŁÓWKU
        if(userAvatar && userAvatar !== "undefined") {
            document.getElementById('userAvatarImg').src = userAvatar;
        }

        // Elementy widoku
        const studentView = document.getElementById('studentView');
        const teacherView = document.getElementById('teacherView');

        // =========================================
        // ROZDZIELENIE WIDOKU (NAUCZYCIEL vs UCZEŃ)
        // =========================================
        
        // Sprawdzamy czy w polu 'klasa' jest słowo Nauczyciel, Admin lub staff
        if (userKlasa === 'Nauczyciel' || userKlasa === 'Admin' || userKlasa === 'nauczyciel') {
            
            // ---> JESTEM NAUCZYCIELEM
            console.log("Tryb Nauczyciela aktywny");
            studentView.classList.add('hidden');    // Ukryj tabelę ucznia
            teacherView.classList.remove('hidden'); // Pokaż panel nauczyciela
            
            zaladujZajeciaNauczyciela(); // Pobierz listę przedmiotów do selecta

        } else {
            
            // ---> JESTEM STUDENTEM
            console.log("Tryb Studenta aktywny");
            teacherView.classList.add('hidden');    // Ukryj panel nauczyciela
            studentView.classList.remove('hidden'); // Pokaż tabelę ocen
            
            pobierzOcenyStudenta(); // Pobierz oceny
        }

        // Funkcja pomocnicza: Koloruje oceny wg skali 2-5 z połówkami
// Funkcja pomocnicza: Koloruje oceny wg skali 2-5 z połówkami
function dajKolorOceny(ocena) {
    const val = String(ocena); // Zamiana na tekst, żeby działało startsWith

    // 5.0
    if (val === '5' || val === '5.0' || val === '5,0') return 'grade-super';
    
    // 4.0 i 4.5
    if (val.startsWith('4')) return 'grade-good';
    
    // 3.0 i 3.5
    if (val.startsWith('3')) return 'grade-ok';
    
    // 2.0 i 2.5 (Niedostateczne)
    if (val.startsWith('2')) return 'grade-bad';

    // Inne (np. nb, zwolniony)
    return 'grade-none'; 
}

        // =========================================
        // LOGIKA STUDENTA (Pobieranie Planu + Ocen)
        // =========================================
        async function pobierzOcenyStudenta() {
            const tbody = document.getElementById('tabela-body');
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Ładowanie przedmiotów...</td></tr>';

            try {
                // 1. Pobieramy DWA źródła danych naraz:
                // a) Oceny, które już są wstawione
                // b) Plan zajęć dla klasy ucznia (żeby widzieć puste przedmioty)
                const [resOceny, resPlan] = await Promise.all([
                    fetch(`/api/oceny/${userLogin}`),
                    fetch(`/api/plan?klasa=${userKlasa}`)
                ]);

                const ocenyDb = await resOceny.json(); // To co jest w bazie Oceny
                const planDb = await resPlan.json();   // To co jest w bazie Zajęcia

                // 2. TWORZYMY LISTĘ UNIKALNYCH PRZEDMIOTÓW
                // Używamy obiektu (mapy), żeby nie dublować przedmiotów (np. Matematyka jest 2 razy w tygodniu w planie)
                const listaPrzedmiotow = {};

                // A. Najpierw wrzucamy wszystko z PLANU (nawet to bez ocen)
                planDb.forEach(zajecia => {
                    // Klucz to np. "Matematyka-Wykład" lub "Fizyka-Lab"
                    const klucz = `${zajecia.nazwa}-${zajecia.typ}`;

                    if (!listaPrzedmiotow[klucz]) {
                        listaPrzedmiotow[klucz] = {
                            przedmiot: zajecia.nazwa,
                            typ: zajecia.typ,
                            prowadzacy: zajecia.prowadzacy,
                            ects: "-", // Tego nie ma w planie, pojawi się jak nauczyciel założy kartę
                            oceny: [],
                            ocenaKoncowa: null
                        };
                    }
                });

                // B. Teraz nakładamy na to OCENY z bazy
                ocenyDb.forEach(ocena => {
                    const klucz = `${ocena.przedmiot}-${ocena.typ}`;

                    // Jeśli przedmiot był w planie -> aktualizujemy go ocenami
                    if (listaPrzedmiotow[klucz]) {
                        listaPrzedmiotow[klucz].oceny = ocena.oceny;
                        listaPrzedmiotow[klucz].ocenaKoncowa = ocena.ocenaKoncowa;
                        listaPrzedmiotow[klucz].ects = ocena.ects;
                        listaPrzedmiotow[klucz].prowadzacy = ocena.prowadzacy; // Nadpisujemy, bo w ocenach może być inny
                    } else {
                        // Jeśli przedmiotu NIE MA w planie (np. przedmiot z poprzedniego semestru), a są oceny -> dodajemy go
                        listaPrzedmiotow[klucz] = {
                            przedmiot: ocena.przedmiot,
                            typ: ocena.typ,
                            prowadzacy: ocena.prowadzacy,
                            ects: ocena.ects,
                            oceny: ocena.oceny,
                            ocenaKoncowa: ocena.ocenaKoncowa
                        };
                    }
                });

                // 3. Konwertujemy obiekt z powrotem na tablicę i sortujemy
                const finalnaLista = Object.values(listaPrzedmiotow).sort((a, b) => a.przedmiot.localeCompare(b.przedmiot));

                // 4. Wyświetlanie (Renderowanie)
                if (finalnaLista.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Brak przedmiotów w planie i brak ocen.</td></tr>';
                    return;
                }

                tbody.innerHTML = '';

                finalnaLista.forEach(item => {
                    // 1. Generowanie kółeczek z ocenami CZĄSTKOWYMI
                    let htmlOceny = '';
                    if (item.oceny.length > 0) {
                        htmlOceny = item.oceny.map(o => 
                            `<span class="ocena-circle ${dajKolorOceny(o.wartosc)}" title="${o.opis}">${o.wartosc}</span>`
                        ).join('');
                    } else {
                        htmlOceny = '<small style="color:#999; font-style:italic;">Brak ocen</small>';
                    }

                    // 2. Generowanie kółeczka dla oceny KOŃCOWEJ (Nowość!)
                    let htmlKoncowa = '-';
                    if (item.ocenaKoncowa) {
                        // Używamy tej samej funkcji do koloru, ale dodajemy style inline, żeby kółko było większe
                        htmlKoncowa = `
                            <span class="ocena-circle ${dajKolorOceny(item.ocenaKoncowa)}" 
                                  style="width: 30px; height: 30px; font-size: 16px; border-width: 3px; margin: 0; font-weight: 1000; display: inline-flex; justify-content: center; align-items: center;">
                                ${item.ocenaKoncowa}
                            </span>`;
                    }

                    // 3. Kolor plakietki Typu (Wykład/Lab)
                    let badgeClass = 'bg-wyklad';
                    if (item.typ === 'Lab' || item.typ === 'Laboratorium') badgeClass = 'bg-lab';
                    if (item.typ === 'Projekt') badgeClass = 'bg-projekt';

                    // 4. Sklejanie wiersza
                    const row = `
                        <tr>
                            <td>
                                <strong>${item.przedmiot}</strong>
                                <span class="badge-typ ${badgeClass}">${item.typ}</span>
                            </td>
                            <td>${item.prowadzacy}</td>
                            <td>${item.ects}</td>
                            <td>${htmlOceny}</td>
                            
                            <td style="text-align: center; vertical-align: middle;">
                                ${htmlKoncowa}
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });

            } catch (err) {
                console.error("Błąd łączenia danych:", err);
                tbody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center">Błąd ładowania danych.</td></tr>';
            }
        }

        // =========================================
        // LOGIKA NAUCZYCIELA
        // =========================================
        
        // 1. Wypełnij <select> zajęciami tego nauczyciela
        async function zaladujZajeciaNauczyciela() {
            const select = document.getElementById('selectZajecia');
            try {
                // Backend szuka po polu 'prowadzacy'. Musi ono pasować do 'userNazwisko'
                const res = await fetch(`/api/zajecia/nauczyciel?prowadzacy=${userNazwisko}`);
                const zajecia = await res.json();

                select.innerHTML = '<option value="" disabled selected>-- Wybierz przedmiot i grupę --</option>';
                
                if(zajecia.length === 0) {
                    select.innerHTML = '<option disabled>Brak przypisanych zajęć (sprawdź pisownię nazwiska)</option>';
                    return;
                }

                zajecia.forEach(z => {
                    const option = document.createElement('option');
                    option.value = z._id; // ID zajęć jest kluczowe dla backendu
                    option.text = `${z.nazwa} (${z.typ}) - Klasa: ${z.grupaZaj}`;
                    select.appendChild(option);
                });

            } catch (err) {
                console.error(err);
                select.innerHTML = '<option disabled>Błąd ładowania listy</option>';
            }
        }

        // ============================================================
        // 2. ZMODYFIKOWANA OBSŁUGA WYBORU ZAJĘĆ (Z Oceną Końcową)
        // ============================================================
        document.getElementById('selectZajecia').addEventListener('change', async function() {
            const zajeciaId = this.value;
            if(!zajeciaId) return;

            const container = document.getElementById('dziennikContainer');
            container.innerHTML = '<p style="color:white">Ładowanie listy uczniów...</p>';

            try {
                const res = await fetch(`/api/dziennik/zajecia/${zajeciaId}`);
                const data = await res.json();

                if(!data.studenci || data.studenci.length === 0) {
                    container.innerHTML = '<p style="color:orange">Brak uczniów w tej grupie.</p>';
                    return;
                }

                // Budujemy tabelę dziennika
                let html = `
                    <table class="styled-table" style="width:100%; margin-top:10px;">
                        <thead>
                            <tr>
                                <td>Student</td>
                                <td>Oceny cząstkowe</td>
                                <td>Ocena Końcowa</td> <td>Akcja</td>
                            </tr>
                        </thead>
                        <tbody>
                `;

                data.studenci.forEach(s => {
                    // Generowanie kółeczek z ocenami
                    let ocenyHtml = s.ocenyCzastkowe.length > 0
                        ? s.ocenyCzastkowe.map(o => 
                            // Tu też używamy dajKolorOceny
                            `<span class="ocena-circle ${dajKolorOceny(o.wartosc)}" title="${o.opis}">${o.wartosc}</span>`
                          ).join('')
                        : '<small style="color:#777">Brak</small>';

                    // Logika selecta dla oceny końcowej (zaznaczamy obecną ocenę)
                    const obecna = s.ocenaKoncowa || "";
                    
                    // Tworzymy Select dla każdego ucznia
                    const selectKoncowa = `
                        <select id="koncowa-${s.login}" style="padding:5px; border-radius:4px; background:#eee; color:#333; font-weight:bold;">
                            <option value="" ${obecna === "" ? "selected" : ""}>-</option>
                            <option value="2" ${obecna === "2" ? "selected" : ""}>2</option>
                            <option value="3" ${obecna === "3" ? "selected" : ""}>3</option>
                            <option value="3.5" ${obecna === "3.5" ? "selected" : ""}>3.5</option>
                            <option value="4" ${obecna === "4" ? "selected" : ""}>4</option>
                            <option value="4.5" ${obecna === "4.5" ? "selected" : ""}>4.5</option>
                            <option value="5" ${obecna === "5" ? "selected" : ""}>5</option>
                            <option value="Zal" ${obecna === "Zal" ? "selected" : ""}>Zal</option>
                        </select>
                        <button onclick="zapiszKoncowa('${s.login}', '${zajeciaId}')" 
                                title="Zapisz ocenę końcową"
                                style="cursor:pointer; background:none; border:none; font-size:1.2em;">
                            💾
                        </button>
                    `;

                    html += `
                        <tr>
                            <td>
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <img src="${s.awatar}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
                                    <div>
                                        ${s.imie} ${s.nazwisko}<br>
                                        <small style="color:#aaa">${s.login}</small>
                                    </div>
                                </div>
                            </td>
                            <td>${ocenyHtml}</td>
                            <td style="text-align:center;">${selectKoncowa}</td>
                            <td>
                                <button type="button" onclick="wybierzStudenta('${s.login}')"
                                        style="padding: 5px 10px; background: #2196F3; border: none; color: white; cursor: pointer; border-radius:4px; font-size:0.8em;">
                                    ➕ Cząstkowa
                                </button>
                            </td>
                        </tr>
                    `;
                });

                html += '</tbody></table>';
                container.innerHTML = html;

            } catch (err) {
                console.error(err);
                container.innerHTML = '<p style="color:red">Błąd pobierania dziennika.</p>';
            }
        });

        // ============================================================
        // NOWA FUNKCJA: Zapisywanie Oceny Końcowej
        // ============================================================
        async function zapiszKoncowa(indeksStudenta, zajeciaId) {
            // Pobieramy wartość z selecta przypisanego do tego studenta
            const selectElem = document.getElementById(`koncowa-${indeksStudenta}`);
            const wybranaOcena = selectElem.value;

            if(!confirm(`Czy na pewno chcesz wystawić ocenę końcową: ${wybranaOcena || "BRAK"} dla studenta ${indeksStudenta}?`)) {
                return;
            }

            try {
                const res = await fetch('/api/wstaw-ocene-koncowa', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        indeks: indeksStudenta,
                        zajeciaId: zajeciaId,
                        ocenaKoncowa: wybranaOcena
                    })
                });

                const data = await res.json();

                if(res.ok) {
                    alert("✅ " + data.message);
                    // Opcjonalnie: Zmień kolor selecta na zielony, żeby dać znać że zapisano
                    selectElem.style.backgroundColor = "lightgreen";
                    setTimeout(() => selectElem.style.backgroundColor = "#eee", 2000);
                } else {
                    alert("❌ Błąd: " + data.message);
                }

            } catch (err) {
                console.error(err);
                alert("❌ Błąd połączenia z serwerem");
            }
        }

        // 3. Pomocnik - kliknięcie "Wstaw ocenę" przepisuje login do formularza
        function wybierzStudenta(indeks) {
            document.getElementById('o_indeks').value = indeks;
            // Przewiń do góry
            document.getElementById('teacherView').scrollIntoView({ behavior: 'smooth' });
            // Efekt podświetlenia inputa
            const input = document.getElementById('o_indeks');
            input.style.border = "2px solid #4CAF50";
            setTimeout(() => input.style.border = "1px solid #555", 1000);
        }

        // 4. Wysyłanie formularza (Dodawanie oceny)
        document.getElementById('formOcena').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const zajeciaId = document.getElementById('selectZajecia').value;
            const indeksStudenta = document.getElementById('o_indeks').value;
            const wartosc = document.getElementById('o_wartosc').value;
            const opis = document.getElementById('o_opis').value;
            const log = document.getElementById('logOcena');

            if(!zajeciaId) {
                alert("Najpierw wybierz przedmiot z listy!");
                return;
            }

            try {
                const res = await fetch('/api/dodaj-ocene-czastkowa', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        indeks: indeksStudenta,
                        zajeciaId: zajeciaId,
                        nowaOcena: {
                            wartosc: wartosc,
                            opis: opis,
                            wstawil: userNazwisko // Wpisujemy nazwisko nauczyciela jako autora
                        }
                    })
                });

                const data = await res.json();

                if(res.ok) {
                    log.innerText = "✅ " + data.message;
                    log.style.color = "lightgreen";
                    
                    // Wyczyść pola oceny
                    document.getElementById('o_wartosc').value = '';
                    document.getElementById('o_opis').value = '';
                    
                    // Odśwież listę uczniów na dole (symulując ponowne wybranie selecta)
                    document.getElementById('selectZajecia').dispatchEvent(new Event('change'));

                } else {
                    log.innerText = "❌ " + data.message;
                    log.style.color = "red";
                }

            } catch (err) {
                console.error(err);
                log.innerText = "❌ Błąd połączenia";
            }
        });

        // Funkcja losowania oceny (bajer)
        function losujOcene() {
            // Twoja nowa skala ocen
            const oceny = ["2", "2.5", "3", "3.5", "4", "4.5", "5"];
            const los = oceny[Math.floor(Math.random() * oceny.length)];
                
            // Ustawiamy wylosowaną wartość w selectcie
            document.getElementById('o_wartosc').value = los;
        }

        // Wylogowanie
        function wyloguj() {
            localStorage.clear();
            window.location.href = '../index.html';
        }