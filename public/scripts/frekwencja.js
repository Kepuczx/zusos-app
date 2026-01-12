document.addEventListener('DOMContentLoaded', () => {

    const btnDodaj = document.getElementById('btnDodajFrekwencje');
    const btnSprawdz = document.getElementById('btnSprawdzFrekwencje');
    const btnSprawdzProc = document.getElementById('btnSprawdzFrekwencjeProc');
    const btnMojaFrekwencja = document.getElementById('btnSprawdzMojaFrekwencje');
    const btnZarzadzajProgZal = document.getElementById('btnZarzadzajProgZal');

    const userKlasa = localStorage.getItem('userklasa');

    const isNauczyciel =
        userKlasa === 'Nauczyciel' ||
        userKlasa === 'nauczyciel' ||
        userKlasa === 'Admin' ||
        userKlasa === 'admin';

    // ===============================
    // NAUCZYCIEL / ADMIN
    // ===============================
    if (isNauczyciel) {
        btnDodaj.style.display = 'flex';
        btnSprawdz.style.display = 'flex';
        btnSprawdzProc.style.display = 'flex';
        btnZarzadzajProgZal.style.display = 'flex';

        if (btnMojaFrekwencja) {
            btnMojaFrekwencja.style.display = 'none';
        }
    }
    // ===============================
    // STUDENT
    // ===============================
    else {
        btnDodaj.style.display = 'none';
        btnSprawdz.style.display = 'none';
        btnSprawdzProc.style.display = 'none';
        btnZarzadzajProgZal.style.display = 'none';

        if (btnMojaFrekwencja) {
            btnMojaFrekwencja.style.display = 'flex';
        }
    }

    // ===============================
    // PRZEKIEROWANIA
    // ===============================
    btnDodaj?.addEventListener('click', () => {
        window.location.href = 'dodaj_frekwencje.html';
    });

    btnSprawdz?.addEventListener('click', () => {
        window.location.href = 'sprawdz_frekwencje.html';
    });

    btnSprawdzProc?.addEventListener('click', () => {
        window.location.href = 'sprawdz_frekwencje_proc.html';
    });

    btnMojaFrekwencja?.addEventListener('click', () => {
        window.location.href = 'moja_frekwencja.html';
    });

    btnZarzadzajProgZal?.addEventListener('click', () => {
    window.location.href = 'zarzadzaj_prog_zal.html';
    });

});
