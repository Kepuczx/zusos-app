document.addEventListener('DOMContentLoaded', ()=>{
    const imie = document.querySelector('#imie');
    const nazwisko = document.querySelector('#nazwisko');
    const indeks = document.querySelector('#indeks');
    const klasa = document.querySelector('#klasa');

    const userImie = localStorage.getItem('userImie');
    const userNazwisko = localStorage.getItem('userNazwisko');
    const userLogin = localStorage.getItem('userLogin');
    const userKlasa = localStorage.getItem('userklasa');
    const userAvatar = localStorage.getItem('userAvatar');

    const miejsceZdj = document.querySelector('.zdjecie img');


    if(miejsceZdj && userAvatar){
        miejsceZdj.src = userAvatar;
    }
    if(imie && userImie){
        imie.innerHTML = `Imie: ${userImie}`;
    }
    if(nazwisko && userNazwisko){
        nazwisko.innerHTML = `Nazwisko: ${userNazwisko}`;
    }
    if(indeks && userLogin){
        indeks.innerHTML = `Indeks: ${userLogin}`;
    }
    if(klasa && userKlasa){
        klasa.innerHTML = `Klasa: ${userKlasa}`;
    }

});