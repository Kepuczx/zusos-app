const show = document.querySelector('#show');
const password = document.querySelector('#password');

document.getElementById("loginForm").addEventListener("submit", function(e) {
    const login = document.getElementById("login").value;
    const haslo = password.value;
    const errorSpan = document.querySelector('.blad');
    if (login === "admin" && haslo === "admin") {
        
    } else {
        e.preventDefault();
        errorSpan.textContent = "Błędny login lub hasło!"
    }
});

show.addEventListener("click", ()=>{
    if(password.type==="password"){
        password.type = "text";
        show.textContent = "Ukryj";
    }
    else{
        password.type="password";
        show.textContent = "Pokaż";
    }
})

