function addAdminLink(){
    const afterHim = document.getElementById('oceny');

    const adminLink = document.createElement('a');
    adminLink.href = '/admin/admin.html';
    adminLink.textContent = 'PANEL ADMINISTRATORA';

    afterHim.insertAdjacentElement('afterend', adminLink);
    console.log('DODANO PANEL ADMINISTRATORA');
}

const adminLogin = localStorage.getItem('userLogin');

document.addEventListener('DOMContentLoaded', ()=>{
    if(adminLogin === 'admin'){
        addAdminLink();
    }

})