document.addEventListener('DOMContentLoaded', async () => {

    const zajeciaSelect = document.getElementById('zajeciaSelect');
    const dataInput = document.getElementById('dataFrekwencji');
    const pobierzBtn = document.getElementById('pobierzStudentow');
    const tbody = document.querySelector('#listaStudentow tbody');
    const form = document.getElementById('frekwencjaForm');
    const nazwiskoNauczyciela = localStorage.getItem('userNazwisko');


    // ===============================
    // POBIERZ ZAJĘCIA
    // ===============================
    const zajeciaRes = await fetch(
        `/api/zajecia/nauczyciel?prowadzacy=${encodeURIComponent(nazwiskoNauczyciela)}`
    );
    const zajecia = await zajeciaRes.json();

    zajecia.forEach(z => {
        const opt = document.createElement('option');
        opt.value = z._id;
        opt.textContent = `${z.nazwa} (${z.grupaZaj})`;
        opt.dataset.klasa = z.grupaZaj;
        zajeciaSelect.appendChild(opt);
    });


    // ===============================
// POBIERZ STUDENTÓW + WCZYTAJ FREKWENCJĘ
// ===============================
pobierzBtn.addEventListener('click', async () => {
    tbody.innerHTML = '';

    const zajeciaId = zajeciaSelect.value;
    const data = dataInput.value;

    if (!zajeciaId || !data) {
        return alert('Ej stary, wybierz przedmiot i datę');
    }

    // weź klasę z wybranego zajęcia
    const wybraneZajecia = zajecia.find(z => z._id === zajeciaId);
    if (!wybraneZajecia) return alert('Ej stary, wybrany przedmiot nie istnieje!');
    const klasa = wybraneZajecia.grupaZaj;

    // 1️⃣ studenci
    const studRes = await fetch(`/api/studenci?klasa=${klasa}`);
    const studenci = await studRes.json();

    // 2️⃣ zapisana frekwencja (jeśli istnieje)
    const frekRes = await fetch(
        `/api/frekwencja?zajeciaId=${zajeciaId}&data=${data}`
    );
    const zapisanaFrekwencja = await frekRes.json();

    // mapka: studentId -> status
    const frekMapa = {};
    zapisanaFrekwencja.forEach(f => {
        frekMapa[f.studentId] = f.status;
    });

    // 3️⃣ render tabeli
    studenci.forEach(s => {
        const tr = document.createElement('tr');

        const status = frekMapa[s._id] || 'brak';

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
            <td>
                <select data-student="${s._id}">
                    <option value="obecny">obecny</option>
                    <option value="nieobecny">nieobecny</option>
                    <option value="spóźniony">spóźniony</option>
                    <option value="usprawiedliwiony">usprawiedliwiony</option>
                    <option value="brak">brak</option>
                </select>
            </td>
        `;

        tbody.appendChild(tr);
        const sel = tr.querySelector('select');
        sel.value = status;

        // ustawienie początkowego koloru selecta
        const ustawKolor = () => {
            switch(sel.value){
                case 'obecny':
                case 'usprawiedliwiony': sel.className = 'status-select status-obecny'; break;
                case 'nieobecny':
                case 'brak': sel.className = 'status-select status-nieobecny'; break;
                case 'spóźniony': sel.className = 'status-select status-spozniony'; break;
                default: sel.className = 'status-select'; 
            }
        };

        ustawKolor(); // początkowo
        sel.addEventListener('change', ustawKolor); // przy zmianie
    });
});


    // ===============================
    // ZAPIS / EDYCJA FREKWENCJI
    // ===============================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const dane = [];
        document.querySelectorAll('select[data-student]').forEach(sel => {
            dane.push({
                studentId: sel.dataset.student,
                status: sel.value
            });
        });

        const payload = {
            zajeciaId: zajeciaSelect.value,
            data: dataInput.value,
            frekwencja: dane
        };

        const res = await fetch('/api/frekwencja', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('✅ Frekwencja zapisana / zaktualizowana');
        } else {
            alert('❌ Coś się wywaliło');
        }
    });

});
