function addAdminLink(){
    const afterHim = document.getElementById('frekwencja');
    const liOceny = document.getElementById('liOceny');

    const adminLink = document.createElement('a');
    const noweLi = document.createElement('li');

    adminLink.href = '/admin/admin.html';
    adminLink.textContent = 'PANEL ADMINISTRATORA';

    noweLi.innerHTML = '<a href="/admin/admin.html">PANEL ADMINISTRATORA</a>';

    afterHim.insertAdjacentElement('afterend', adminLink);
    liOceny.after(noweLi);
    console.log('DODANO PANEL ADMINISTRATORA');
}

const adminLogin = localStorage.getItem('userklasa');



document.addEventListener('DOMContentLoaded', ()=>{
    if(adminLogin === 'admin' || adminLogin === 'szlachta'){
        addAdminLink();
    }
})


