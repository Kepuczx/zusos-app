// ==========================================
// 1. CZEKAJ NA ZAŁADOWANIE STRONY (BEZPIECZNIK)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Skrypt grades.js wystartował!");

    // --- A. POBIERANIE DANYCH ---
    const userLogin = localStorage.getItem('userLogin');
    const userImie = localStorage.getItem('userImie');
    const userNazwisko = localStorage.getItem('userNazwisko');
    // Pobieramy klasę i zamieniamy na małe litery dla pewności porównania
    const rawKlasa = localStorage.getItem('userklasa') || ""; 
    const userKlasa = rawKlasa.toLowerCase(); 
    const userAvatar = localStorage.getItem('userAvatar');

    console.log(`👤 Zalogowany: ${userLogin}, Klasa: ${rawKlasa}`);

    // --- B. SPRAWDZENIE CZY ZALOGOWANY ---
    if (!userLogin) {
        alert("Brak sesji. Zaloguj się ponownie.");
        window.location.href = '../index.html';
        return;
    }

    // --- C. UI: POWITANIE I AWATAR ---
    const nameDisplay = document.getElementById('userNameDisplay');
    if (nameDisplay) nameDisplay.innerText = userImie || "Użytkowniku";

    // Zabezpieczenie awatara (Twoje poprzednie źródło błędu)
    const avatarImg = document.getElementById('userAvatarImg');
    if (avatarImg && userAvatar && userAvatar !== "undefined") {
        avatarImg.src = userAvatar;
    } else if (!avatarImg) {
        console.warn("⚠️ Nie znaleziono elementu <img id='userAvatarImg'> w HTML.");
    }

    // --- D. ROZDZIELENIE WIDOKÓW ---
    const studentView = document.getElementById('studentView');
    const teacherView = document.getElementById('teacherView');

    if (!studentView || !teacherView) {
        console.error("❌ BŁĄD KRYTYCZNY: Nie znaleziono divów 'studentView' lub 'teacherView' w HTML!");
        return;
    }

    // Sprawdzamy rolę (czy zawiera słowo nauczyciel lub admin)
    if (userKlasa.includes('nauczyciel') || userKlasa.includes('admin')) {
        // ---> NAUCZYCIEL
        console.log("🎓 Tryb: Nauczyciel");
        studentView.classList.add('hidden');
        teacherView.classList.remove('hidden');
        await zaladujZajeciaNauczyciela(userNazwisko); 
    } else {
        // ---> UCZEŃ
        console.log("🎒 Tryb: Uczeń");
        teacherView.classList.add('hidden');
        studentView.classList.remove('hidden');
        await pobierzOcenyStudenta(userLogin, rawKlasa);
    }
    
    // --- E. OBSŁUGA SELECTA (DZIENNIK NAUCZYCIELA) ---
    const selectZajecia = document.getElementById('selectZajecia');
    if (selectZajecia) {
        selectZajecia.addEventListener('change', async function() {
            const zajeciaId = this.value;
            console.log("Wybrano zajęcia ID:", zajeciaId);
            await zaladujDziennik(zajeciaId);
        });
    }

    // --- F. OBSŁUGA FORMULARZA DODAWANIA OCEN ---
    const formOcena = document.getElementById('formOcena');
    if (formOcena) {
        formOcena.addEventListener('submit', async (e) => {
            e.preventDefault();
            await dodajOcene(userNazwisko);
        });
    }

}); // Koniec DOMContentLoaded


// ==========================================
// 2. FUNKCJE LOGIKI (WEWNĘTRZNE)
// ==========================================

// --- STUDENT: POBIERANIE OCEN I PLANU ---
async function pobierzOcenyStudenta(login, klasa) {
    const tbody = document.getElementById('tabela-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Ładowanie danych...</td></tr>';

    try {
        console.log(`📡 Pobieram oceny dla: ${login} i plan dla: ${klasa}`);
        const [resOceny, resPlan] = await Promise.all([
            fetch(`/api/oceny/${login}`),
            fetch(`/api/plan?klasa=${klasa}`)
        ]);

        if (!resOceny.ok || !resPlan.ok) throw new Error("Błąd sieci (API)");

        const ocenyDb = await resOceny.json();
        const planDb = await resPlan.json();

        // Łączenie danych
        const listaPrzedmiotow = {};

        planDb.forEach(z => {
            const klucz = `${z.nazwa}-${z.typ}`;
            listaPrzedmiotow[klucz] = {
                przedmiot: z.nazwa, typ: z.typ, prowadzacy: z.prowadzacy,
                ects: "-", oceny: [], ocenaKoncowa: null
            };
        });

        ocenyDb.forEach(o => {
            const klucz = `${o.przedmiot}-${o.typ}`;
            if (!listaPrzedmiotow[klucz]) {
                listaPrzedmiotow[klucz] = {
                    przedmiot: o.przedmiot, typ: o.typ, prowadzacy: o.prowadzacy,
                    ects: o.ects, oceny: [], ocenaKoncowa: null
                };
            }
            listaPrzedmiotow[klucz].oceny = o.oceny;
            listaPrzedmiotow[klucz].ocenaKoncowa = o.ocenaKoncowa;
            listaPrzedmiotow[klucz].ects = o.ects;
        });

        const finalnaLista = Object.values(listaPrzedmiotow).sort((a, b) => a.przedmiot.localeCompare(b.przedmiot));

        tbody.innerHTML = '';
        if (finalnaLista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Brak przedmiotów.</td></tr>';
            return;
        }

        finalnaLista.forEach(item => {
            let htmlOceny = item.oceny.length > 0 
                ? item.oceny.map(o => `<span class="ocena-circle ${window.dajKolorOceny(o.wartosc)}" title="${o.opis}">${o.wartosc}</span>`).join('')
                : '<small style="color:#999">Brak</small>';

            let htmlKoncowa = '-';
            if (item.ocenaKoncowa) {
                htmlKoncowa = `<span class="ocena-circle ${window.dajKolorOceny(item.ocenaKoncowa)}" style="width:30px; height:30px; margin:0 auto; display:inline-flex;">${item.ocenaKoncowa}</span>`;
            }

            let badge = item.typ === 'Lab' ? 'bg-lab' : 'bg-wyklad';

            tbody.innerHTML += `
                <tr>
                    <td><strong>${item.przedmiot}</strong> <span class="badge-typ ${badge}">${item.typ}</span></td>
                    <td>${item.prowadzacy}</td>
                    <td>${item.ects}</td>
                    <td>${htmlOceny}</td>
                    <td style="text-align:center; vertical-align:middle">${htmlKoncowa}</td>
                </tr>`;
        });

    } catch (err) {
        console.error("Błąd studenta:", err);
        tbody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center">Błąd pobierania danych.</td></tr>';
    }
}

// --- NAUCZYCIEL: ŁADOWANIE ZAJĘĆ ---
async function zaladujZajeciaNauczyciela(nazwisko) {
    const select = document.getElementById('selectZajecia');
    try {
        const res = await fetch(`/api/zajecia/nauczyciel?prowadzacy=${nazwisko}`);
        const zajecia = await res.json();
        
        select.innerHTML = '<option value="" disabled selected>-- Wybierz przedmiot --</option>';
        if (zajecia.length === 0) {
            select.innerHTML = '<option disabled>Brak przypisanych zajęć</option>';
        } else {
            zajecia.forEach(z => {
                const opt = document.createElement('option');
                opt.value = z._id;
                opt.text = `${z.nazwa} (${z.typ}) - ${z.grupaZaj}`;
                select.appendChild(opt);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

// --- NAUCZYCIEL: ŁADOWANIE DZIENNIKA ---
async function zaladujDziennik(zajeciaId) {
    const container = document.getElementById('dziennikContainer');
    container.innerHTML = '<p>Ładowanie...</p>';
    
    try {
        const res = await fetch(`/api/dziennik/zajecia/${zajeciaId}`);
        const data = await res.json();

        if (!data.studenci || data.studenci.length === 0) {
            container.innerHTML = '<p>Brak uczniów.</p>';
            return;
        }

        let html = `<table class="styled-table" style="width:100%"><thead><tr><td>Student</td><td>Oceny</td><td>Końcowa</td><td>Akcja</td></tr></thead><tbody>`;
        
        data.studenci.forEach(s => {
            let oceny = s.ocenyCzastkowe.map(o => `<span class="ocena-circle ${window.dajKolorOceny(o.wartosc)}">${o.wartosc}</span>`).join('');
            
            // Select oceny końcowej
            const obecna = s.ocenaKoncowa || "";
            const selectKoncowa = `
                <select id="koncowa-${s.login}" style="padding:5px;">
                    <option value="" ${obecna === "" ? "selected" : ""}>-</option>
                    <option value="2" ${obecna === "2" ? "selected" : ""}>2</option>
                    <option value="3" ${obecna === "3" ? "selected" : ""}>3</option>
                    <option value="3.5" ${obecna === "3.5" ? "selected" : ""}>3.5</option>
                    <option value="4" ${obecna === "4" ? "selected" : ""}>4</option>
                    <option value="4.5" ${obecna === "4.5" ? "selected" : ""}>4.5</option>
                    <option value="5" ${obecna === "5" ? "selected" : ""}>5</option>
                </select>
                <button onclick="window.zapiszKoncowa('${s.login}', '${zajeciaId}')">💾</button>
            `;

            html += `<tr>
                <td>${s.imie} ${s.nazwisko} <br><small>${s.login}</small></td>
                <td>${oceny || '<small>Brak</small>'}</td>
                <td>${selectKoncowa}</td>
                <td><button onclick="window.wybierzStudenta('${s.login}')">➕ Ocena</button></td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p style="color:red">Błąd dziennika.</p>';
    }
}

// --- NAUCZYCIEL: DODAWANIE OCENY ---
async function dodajOcene(nauczyciel) {
    const zajeciaId = document.getElementById('selectZajecia').value;
    const indeks = document.getElementById('o_indeks').value;
    const wartosc = document.getElementById('o_wartosc').value;
    const opis = document.getElementById('o_opis').value;
    const log = document.getElementById('logOcena');

    if (!zajeciaId) { alert("Wybierz przedmiot!"); return; }

    try {
        const res = await fetch('/api/dodaj-ocene-czastkowa', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                indeks, zajeciaId,
                nowaOcena: { wartosc, opis, wstawil: nauczyciel }
            })
        });
        const data = await res.json();
        log.innerText = res.ok ? "✅ Dodano!" : "❌ " + data.message;
        
        if (res.ok) {
            document.getElementById('o_wartosc').value = "";
            document.getElementById('o_opis').value = "";
            // Odśwież dziennik
            zaladujDziennik(zajeciaId);
        }
    } catch (err) {
        console.error(err);
    }
}


// ==========================================
// 3. FUNKCJE GLOBALNE (DLA HTML onclick="")
// ==========================================
// Te funkcje muszą być w 'window', bo są wywoływane z HTML-a, a nie z kodu JS

window.dajKolorOceny = function(ocena) {
    const val = String(ocena);
    if (val.startsWith('5')) return 'grade-super';
    if (val.startsWith('4')) return 'grade-good';
    if (val.startsWith('3')) return 'grade-ok';
    if (val.startsWith('2')) return 'grade-bad';
    return 'grade-none';
};

window.wybierzStudenta = function(indeks) {
    const inp = document.getElementById('o_indeks');
    if (inp) {
        inp.value = indeks;
        document.getElementById('teacherView').scrollIntoView({behavior:'smooth'});
        inp.style.border = "2px solid green";
    }
};

window.losujOcene = function() {
    const oceny = ["2", "3", "3.5", "4", "4.5", "5"];
    const el = document.getElementById('o_wartosc');
    if (el) el.value = oceny[Math.floor(Math.random() * oceny.length)];
};

window.zapiszKoncowa = async function(indeks, zajeciaId) {
    const val = document.getElementById(`koncowa-${indeks}`).value;
    if(!confirm(`Wstawić ocenę końcową: ${val}?`)) return;

    try {
        const res = await fetch('/api/wstaw-ocene-koncowa', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ indeks, zajeciaId, ocenaKoncowa: val })
        });
        if(res.ok) alert("Zapisano!");
        else alert("Błąd zapisu");
    } catch(e) { console.error(e); }
};

window.wyloguj = function() {
    localStorage.clear();
    window.location.href = '../index.html';
};