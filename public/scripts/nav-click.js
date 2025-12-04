const nav_links = document.querySelector(".nav-links");
const hamburger = document.querySelector(".hamburger");

const avatar_links = document.querySelector(".avatar-links");
const avatar = document.querySelector(".avatar");

// pokaz/ukryj menu hamburgera
hamburger.onclick = function(event) {
  event.stopPropagation(); // zatrzymuje kliknięcie, żeby nie zamknęło menu od razu
  nav_links.style.display = 
    nav_links.style.display === "block" ? "none" : "block";

  hamburger.classList.toggle('active');
};

// pokaz/ukryj menu avatara
avatar.onclick = function(event) {
  event.stopPropagation();
  avatar_links.style.display = 
    avatar_links.style.display === "block" ? "none" : "block";
    nav_links.style.display === "none";
};

// kliknięcie poza menu — ukryj oba
document.addEventListener("click", (event) => {
  if (!nav_links.contains(event.target) && event.target !== hamburger) {
    nav_links.style.display = "none";
    hamburger.classList.remove('active');
  }
  if (!avatar_links.contains(event.target) && event.target !== avatar) {
    avatar_links.style.display = "none";
  }
});
