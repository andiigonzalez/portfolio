console.log("IT’S ALIVE!");


function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}


const ARE_WE_HOME = document.documentElement.classList.contains("home");


let pages = [
  { url: "index.html", title: "Home" },
  { url: "projects/index.html", title: "Projects" },
  { url: "contact/index.html", title: "Contact" },
  { url: "resume.html", title: "Resume" },
  { url: "https://github.com/andiigonzalez", title: "GitHub", external: true },
];

let nav = document.createElement("nav");
let ul = document.createElement("ul");
nav.appendChild(ul);
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  url = !ARE_WE_HOME && !url.startsWith("http") ? "../" + url : url;

  const a = document.createElement("a");
  a.href = url;
  a.textContent = title;


  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );


  if (p.external) {
    a.target = "_blank";
  }


  const li = document.createElement("li");
  li.appendChild(a);
  ul.appendChild(li);
}

document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);


const select = document.querySelector(".color-scheme select");
const savedScheme = localStorage.colorScheme;
if (savedScheme) {
  document.documentElement.style.setProperty("color-scheme", savedScheme);
  select.value = savedScheme;
}


select.addEventListener("input", function (event) {
  const colorScheme = event.target.value;
  document.documentElement.style.setProperty("color-scheme", colorScheme);
  localStorage.colorScheme = colorScheme; // Save to localStorage
});

