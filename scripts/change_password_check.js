const password = document.querySelector('#password');
const repassword = document.querySelector('#repassword');
//const submit = document.querySelector('.submit');
const bladMess = document.querySelector('.blad');
const show = document.querySelector("#show");
const show2 = document.querySelector("#show2");


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

show2.addEventListener("click", ()=>{
    if(repassword.type === "password"){
        repassword.type = "text";
        show2.textContent = "Ukryj";
    }
    else{
        repassword.type = "password";
        show2.textContent = "Pokaż";
    }
})

async function zmienHaslo(){
    const login = localStorage.getItem('userLogin');
    const nowe = password.value;

    try{
        const response = await fetch('/api/zmien-haslo',{
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                login:login,
                noweHaslo: nowe
            })
        });
        const data = await response.json();
    
        if(response.ok){
            alert("Sukces: " + data.message);
        
            password.value = "";
            repassword.value ="";
            bladMess.textContent = "";
        }else{
            alert("Błąd: " + data.message);
        }
    }catch(err){
        console.error(err);
        alert("Błąd połączenia z serwerem");
    }

    alert(data.message);
}




document.querySelector('#repasswordForm').addEventListener('submit', (e)=>{
    e.preventDefault();

    let message;
    let correct = true;
    if(password.value.length < 6 || password.value.length > 20){
        message = "Hasło powinno mieć 6-20 znaków!";
        correct = false;
    }
    if(!/[0-9]/.test(password.value)){
        message = "Hasło musi posiadać przynajmniej jedną cyfrę!";
        correct = false;
    }
    if(!/[A-Z]/.test(password.value)){
        message = "Hasło musi posiadać przynajmniej jedną wielką literę!";
        correct = false;
    }
    if(!/[a-z]/.test(password.value)){
        message = "Hasło musi posiadać przynajmniej jedną małą literę!";
        correct = false;
    }
    if(password.value !== repassword.value){
        correct = false;
        message = "Hasła nie są takie same!";
    }



    if(correct === false){
        bladMess.textContent = message;
        return;
        
        
    }else{
        zmienHaslo();
    }

    
    
})