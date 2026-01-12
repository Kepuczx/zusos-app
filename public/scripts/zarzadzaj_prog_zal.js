document.addEventListener('DOMContentLoaded', async () => {

    const zajeciaSelect = document.getElementById('zajeciaSelect');
    const procentInput = document.getElementById('procentZaliczenia');
    const saveBtn = document.getElementById('saveProcentBtn');

    const nazwiskoNauczyciela = localStorage.getItem('userNazwisko');
    console.log('Nazwisko nauczyciela z localStorage:', nazwiskoNauczyciela);

    if (!zajeciaSelect || !procentInput || !saveBtn) {
        console.error('Brak elementów HTML (select, input lub button)');
        return;
    }

    if (!nazwiskoNauczyciela) {
        alert('Nie znaleziono nazwiska nauczyciela w localStorage!');
        return;
    }

    // ===============================
    // POBIERZ ZAJĘCIA NAUCZYCIELA
    // ===============================
    let zajecia = [];
    try {
        const res = await fetch(`/api/zajecia/nauczyciel?prowadzacy=${encodeURIComponent(nazwiskoNauczyciela)}`);
        zajecia = await res.json();
        console.log('Pobrane zajęcia:', zajecia);

        if (!Array.isArray(zajecia) || zajecia.length === 0) {
            zajeciaSelect.innerHTML = '<option>Brak zajęć</option>';
            procentInput.disabled = true;
            saveBtn.disabled = true;
            return;
        }

        // wypełniamy select
        zajeciaSelect.innerHTML = '<option value="">-- wybierz zajęcia --</option>';
        zajecia.forEach(z => {
            const opt = document.createElement('option');
            opt.value = z._id;
            opt.textContent = `${z.nazwa} (${z.grupaZaj})`;
            zajeciaSelect.appendChild(opt);
        });

        // ustaw procent przy zmianie lub przy pierwszym wyborze
        const ustawProcent = () => {
            const zajId = zajeciaSelect.value;
            if (!zajId) {
                procentInput.value = '';
                return;
            }
            const zaj = zajecia.find(z => z._id === zajId);
            procentInput.value = zaj && zaj.procentZaliczenia !== undefined ? zaj.procentZaliczenia : 50;
        };

        zajeciaSelect.addEventListener('change', ustawProcent);
        ustawProcent();

    } catch (err) {
        console.error('Błąd pobierania zajęć:', err);
        zajeciaSelect.innerHTML = '<option>Błąd pobierania zajęć</option>';
        procentInput.disabled = true;
        saveBtn.disabled = true;
    }

    // ===============================
    // ZAPIS PROGU ZALICZENIA
    // ===============================
    saveBtn.addEventListener('click', async () => {
        const zajId = zajeciaSelect.value;
        if (!zajId) {
            alert('Ej, wybierz zajęcia!');
            return;
        }

        let procent = parseInt(procentInput.value);
        if (isNaN(procent) || procent < 1 || procent > 100) {
            alert('Ej, podaj poprawny procent od 1 do 100');
            return;
        }

        try {
            const res = await fetch(`/api/zajecia/${zajId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ procentZaliczenia: procent })
            });

            if (res.ok) {
                alert(`✅ Zaktualizowano próg zaliczenia na ${procent}%`);
                // aktualizujemy lokalnie zajęcia
                const zaj = zajecia.find(z => z._id === zajId);
                if (zaj) zaj.procentZaliczenia = procent;
            } else {
                const txt = await res.text();
                console.error('Błąd zapisu:', txt);
                alert('❌ Błąd podczas zapisu 😅');
            }
        } catch (err) {
            console.error('Błąd fetch PUT:', err);
            alert('❌ Błąd podczas zapisu 😅');
        }
    });

});
