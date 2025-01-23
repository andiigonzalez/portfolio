console.log("IT’S ALIVE!");


function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}


const ARE_WE_HOME = document.documentElement.classList.contains("home");


let pages = [
  { url: "", title: "Home" },
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
// Automatic detection of the OS color scheme
const osDarkMode = matchMedia("(prefers-color-scheme: dark)").matches;
const osLightMode = matchMedia("(prefers-color-scheme: light)").matches;

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
const savedScheme = localStorage.colorScheme || (osDarkMode ? "dark" : "light dark");
document.documentElement.style.setProperty("color-scheme", savedScheme);
if (savedScheme === "dark") {
  document.documentElement.classList.add("dark-mode");
} else if (savedScheme === "light") {
  document.documentElement.classList.add("light-mode");
}
select.value = savedScheme;


select.addEventListener("input", function (event) {
  const colorScheme = event.target.value;
  document.documentElement.classList.remove("dark-mode", "light-mode");

  if (colorScheme === "dark") {
    document.documentElement.classList.add("dark-mode");
    document.documentElement.style.setProperty("color-scheme", "dark");
  } else if (colorScheme === "light") {
    document.documentElement.classList.add("light-mode");
    document.documentElement.style.setProperty("color-scheme", "light");
  } else {
  
    document.documentElement.style.setProperty("color-scheme", "light dark");
  }

  localStorage.colorScheme = colorScheme; // Save preference
  document.documentElement.offsetHeight; // Trigger a reflow
});


const form = document.querySelector("#contact-form");
form?.addEventListener("submit", function (event) {
  event.preventDefault();

  const data = new FormData(form);
  const email = data.get("subject");
  const subject = data.get("body");
  const url = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}`;

  // Open the mailto URL
  location.href = url;
});
