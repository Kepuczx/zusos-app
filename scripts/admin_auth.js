function sprawdzAdmina(){
    if(window.location.pathname.includes('login.html')){
        return;
    }
    const czyZalogowany = localStorage.getItem('zalogowany');
    const admin = localStorage.getItem('userLogin');

    if(!czyZalogowany && admin !== 'admin'){
        window.location.href = '/sites/login.html';
    }
}

sprawdzAdmina();

