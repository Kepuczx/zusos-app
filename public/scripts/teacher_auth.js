
function sprawdznauczyciela(){
    if(window.location.pathname.includes('login.html')){
        return;
    }
    const czyNauczyciel = localStorage.getItem('userklasa');

    const oceny = document.querySelector('.grades');
    const addOcene = document.querySelector('.add-grade');

    if(!oceny || !addOcene) return;


    if(czyNauczyciel === 'Nauczyciel'){
        addOcene.style.setProperty('display', 'block', 'important');
        
    }
    if(czyNauczyciel !== 'Nauczyciel'){
        oceny.style.setProperty('display', 'block', 'important');
    }



}
sprawdznauczyciela();
