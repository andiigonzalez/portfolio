console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const ARE_WE_HOME = document.documentElement.classList.contains('home');

const pages = [
  { url: "index.html", title: "Home" },
  { url: "projects/index.html", title: "Projects" },
  { url: "contact/index.html", title: "Contact" },
  { url: "resume.html", title: "Resume" },
  { url: "https://github.com/andiigonzalez", title: "GitHub", external: true },
];

const nav = document.createElement("nav");
const ul = document.createElement("ul");
nav.appendChild(ul);
document.body.prepend(nav);

pages.forEach((page) => {
  const li = document.createElement("li");
  const a = document.createElement("a");

  // Adjust URL for non-home pages
  let url = page.url;
  if (!ARE_WE_HOME && !url.startsWith('http')) {
    url = '../' + url;
  }
  a.href = url;
  a.textContent = page.title;

  // Highlight current page
  if (a.href === location.href) {
    a.classList.add("current");
  }

  // Open external links in a new tab
  if (page.external) {
    a.target = "_blank";
  }

  li.appendChild(a);
  ul.appendChild(li);
});
