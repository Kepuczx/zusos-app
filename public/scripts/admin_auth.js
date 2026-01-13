function sprawdzAdmina(){
    if(window.location.pathname.includes('login.html')){
        return;
    }
    const czyZalogowany = localStorage.getItem('zalogowany');
    const admin = localStorage.getItem('userklasa');

    if(!czyZalogowany || admin !== 'szlachta' && admin !== 'admin'){
        alert("Wstęp wzbroniony! To strefa tylko dla Szlachty. 👑");
        window.location.href = '../index.html';
    }
}

sprawdzAdmina();

