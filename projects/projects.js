import { fetchJSON, renderProjects } from '../global.js';

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

(async function () {
    try {
        // Fetch projects data
        const projects = await fetchJSON('https://andiigonzalez.github.io/portfolio/lib/projects.json');
        console.log("Fetched Projects:", projects);

        // Select the projects container and title element
        const projectsContainer = document.querySelector('.projects');
        const projectsTitle = document.querySelector('.projects-title'); 

        if (!projectsContainer) {
            console.error("Error: .projects container not found in the DOM.");
            return;
        }

        // If projects exist, render them
        if (projects && projects.length > 0) {
            renderProjects(projects, projectsContainer, 'h2');

            // Update the project count in the title
            if (projectsTitle) {
                projectsTitle.textContent = `${projects.length} Projects`;
            }
        } else {
            // If no projects, show a message and update count
            projectsContainer.innerHTML = '<p>No projects found.</p>';
            if (projectsTitle) {
                projectsTitle.textContent = ` 0 Projects`;
            }
        };


    } catch (error) {
        console.error("Error loading projects:", error);
        const projectsContainer = document.querySelector('.projects');
        if (projectsContainer) {
            projectsContainer.innerHTML = '<p>Failed to load projects.</p>';
        }
    }

})();

const projects = await fetchJSON('../lib/projects.json');

let rolledData = d3.rollups(
    projects,
    (v) => v.length,
    (d) => d.year,
);

let data = rolledData.map(([year, count]) => {
    return { value: count, label: year }
});

let svg = d3.select("svg");


let arcGenerator = d3.arc().innerRadius(0).outerRadius(35);
let sliceGenerator = d3.pie().value(d => d.value);
let arcData = sliceGenerator(data);
let colors = d3.scaleOrdinal(d3.schemeSet2);

let arcs = arcData.map(d => arcGenerator(d));

arcs.forEach((arc, idx) => {
    d3.select('svg')
        .append("path")
        .attr("d", arc)
        .attr("fill", colors(idx))
        .attr("stroke", "#fff")
        .attr("stroke-width", "0.5px")
});

let legend = d3.select('.legend');
data.forEach((d, idx) => {
    legend.append('li')
    .attr('style', `--color:${colors(idx)}`)
    .attr('class', 'legend-item')
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)

});

let query = ''; 

function setQuery(newQuery) {
    query = newQuery;

    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });
      
    return filteredProjects;
  }
  
  let searchInput = document.getElementsByClassName('searchBar')[0];
  
  searchInput.addEventListener('input', (event) => {

    let filteredProjects = setQuery(event.target.value);
    renderProjects(filteredProjects, projectsContainer, 'h2');


    let newRolledData = d3.rollups(
        filteredProjects,
        (v) => v.length,
        (d) => d.year,
    );
    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year }; // TODO
    });

    // re-calculate slice generator, arc data, arc, etc.
    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData); 
    let newArcs = newArcData.map((d) => arcGenerator(d));

    // TODO: clear up paths and legends
    let newSVG = d3.select('svg'); 
    newSVG.selectAll('path').remove();
    legend.selectAll('li').remove();

    // update paths and legends, refer to steps 1.4 and 2.2
    newArcs.forEach((arc, idx) => {
        newSVG
        .append('path')
        .attr('d', arc)
        .attr('fill', colors(idx)) // Fill in the attribute for fill color via indexing the colors variable
    })

    newData.forEach((d, idx) => {
        legend.append('li')
            .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
    })
});

let selectedIndex = -1; 

svg.selectAll('path').remove();
arcs.forEach((arc, i) => {
    svg
        .append('path')
        .attr('d', arc)
        .attr('fill', colors(i))
        .on('click', () => {
            // What should we do? (Keep scrolling to find out!)
            selectedIndex = selectedIndex === i ? -1 : i; 

            svg
                .selectAll('path')
                .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');

            legend.selectAll('li').attr('class', (_, idx) => 
            // TODO: filter idx to find correct pie slice and apply CSS from above
                idx === selectedIndex ? 'selected' : '');

            if (selectedIndex === -1) {
                renderProjects(projects, projectsContainer, 'h2');
            } else {
                // TODO: filter projects and project them onto webpage
                // Hint: `.label` might be useful
                const selectedYear = data[selectedIndex].label;
                const filteredProjects = projects.filter((project) => project.year === selectedYear);
                renderProjects(filteredProjects, projectsContainer, 'h2');
            }
        });
});
