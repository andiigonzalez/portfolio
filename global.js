console.log("IT’S ALIVE!");


function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}


const ARE_WE_HOME = document.documentElement.classList.contains("home");


const pages = [
  { url: "", title: "Home" },
  { url: "projects/index.html", title: "Projects" },
  { url: 'https://andiigonzalez.github.io/portfolio/meta/index.html', title: 'Meta Analysis' },
  { url: "https://andiigonzalez.github.io/portfolio/contact/index.html", title: "Contact" },
  { url: "https://andiigonzalez.github.io/portfolio/resume.html", title: "Resume" },
  { url: "https://github.com/andiigonzalez", title: "GitHub", external: true },
];
const BASE_URL = "https://andiigonzalez.github.io/portfolio/";
let nav = document.createElement("nav");
let ul = document.createElement("ul");
nav.appendChild(ul);
document.body.prepend(nav);

for (const p of pages) {
  let url = p.url;
  let title = p.title;

  if (!url.startsWith("http")) {
  url = BASE_URL + url;
}

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

  localStorage.colorScheme = colorScheme;
  document.documentElement.offsetHeight; 
});


const form = document.querySelector("#contact-form");
form?.addEventListener("submit", function (event) {
  event.preventDefault();

  const data = new FormData(form);
  const email = data.get("subject");
  const subject = data.get("body");
  const url = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}`;


  location.href = url;
});

// PROJECTS//
export async function fetchJSON(url) {
  try {
    console.log(`Fetching: ${url}`); 
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Fetched Data:", data);
    return data;


  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement,  headingLevel = 'h2') {
  if (!containerElement) {
      console.error("Container element not found.");
      return;
  }

  const validHeadings = ["h1", "h2", "h3", "h4", "h5", "h6"];
    if (!validHeadings.includes(headingLevel)) {
        console.warn(`Invalid heading level "${headingLevel}". Defaulting to h2.`);
        headingLevel = "h2";
    }

  containerElement.innerHTML = ''; // Clear existing content

  if (!projects || projects.length === 0) {
    containerElement.innerHTML = '<p>No projects found.</p>';
    return;
}

  projects.forEach((project) => {
      const article = document.createElement('article');
      const title = project.title ? project.title : "Untitled Project"; // Default title if missing
      const image = project.image ? project.image : "https://vis-society.github.io/labs/2/images/empty.svg"; 
      const description = project.description ? project.description : "No Description Available"
      const year = project.year ? project.year : "No Date Available" 
  

      article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <p>${project.description}</p>
      <p class="project-year">${project.year}</p>
      `;

      containerElement.appendChild(article);
  });
}

// Step 3 Lab 4 //
export async function fetchGitHubData(username) {
  try {
    const response = await fetchJSON(`https://api.github.com/users/${username}`);
    return response; 
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    return {}; 
}
}
