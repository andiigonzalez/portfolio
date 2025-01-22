console.log("IT’S ALIVE!");

// Helper function to select elements
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Step 3: Check if we are on the homepage
const ARE_WE_HOME = document.documentElement.classList.contains("home");

// Step 3.1: Define the navigation pages
const pages = [
  { url: "index.html", title: "Home" },
  { url: "projects/index.html", title: "Projects" },
  { url: "contact/index.html", title: "Contact" },
  { url: "resume.html", title: "Resume" },
  { url: "https://github.com/andiigonzalez", title: "GitHub", external: true },
];

// Step 3.1: Create the <nav> and <ul> elements
const nav = document.createElement("nav");
const ul = document.createElement("ul");
nav.appendChild(ul);
document.body.prepend(nav);

// Step 3.1: Loop through the pages and create links
for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Adjust URL for non-home pages
  url = !ARE_WE_HOME && !url.startsWith("http") ? "../" + url : url;

  // Create the link element
  const a = document.createElement("a");
  a.href = url;
  a.textContent = title;

  // Highlight the current page
  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links in a new tab
  if (p.external) {
    a.target = "_blank";
  }

  // Create the list item and append the link
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

