import { fetchJSON, renderProjects } from '../global.js';

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const projects = await fetchJSON('https://andiigonzalez.github.io/portfolio/lib/projects.json');
        
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title'); 
renderProjects(projects, projectsContainer, 'h2');


if (projectsTitle) {
        projectsTitle.textContent = `${projects.length} Projects`;
    } else {
            // If no projects, show a message and update count
        projectsContainer.innerHTML = '<p>No projects found.</p>';
        if (projectsTitle) {
            projectsTitle.textContent = ` 0 Projects`;
        }
    };


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
    query = newQuery.trim().toLowerCase();
    if (query === "") return projects; 

    let filteredProjects = projects.filter(project => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });

    return filteredProjects;
}

const searchInput = document.querySelector('.searchBar'); // FIXED


searchInput.addEventListener('input', (event) => {
    let filteredProjects = setQuery(event.target.value);
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects); 
});


function renderPieChart(projectsGiven) {
    console.log("Updating Pie Chart with:", projectsGiven.length, "projects"); 


    let newSVG = d3.select('svg');
    newSVG.selectAll('path').remove();
    let legend = d3.select('.legend');
    legend.selectAll('li').remove();

    // Recalculate data
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );

    let newData = newRolledData.map(([year, count]) => ({
        value: count,
        label: year
    }));

    let newSliceGenerator = d3.pie().value(d => d.value);
    let newArcData = newSliceGenerator(newData);
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(35);
    let newArcs = newArcData.map(d => arcGenerator(d));
    let colors = d3.scaleOrdinal(d3.schemeSet2);

    // Draw new pie slices
    newArcs.forEach((arc, idx) => {
        newSVG.append("path")
            .attr("d", arc)
            .attr("fill", colors(idx))
            .attr("stroke", "#fff")
            .attr("stroke-width", "0.5px")
            .attr("cursor", "pointer") 
            .on('click', () => filterByYear(newData[idx].label));
    });

    newData.forEach((d, idx) => {
        legend.append('li')
            .attr('style', `--color:${colors(idx)}`)
            .attr('class', 'legend-item')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .on('click', () => filterByYear(d.label));
    });
}

let selectedIndex = -1;

function filterByYear(selectedYear) {
    if (selectedIndex === selectedYear) {
        selectedIndex = -1;
        renderProjects(projects, projectsContainer, 'h2'); // Show all projects
        renderPieChart(projects);
    } else {
        selectedIndex = selectedYear;
        const filteredProjects = projects.filter((project) => project.year === selectedYear);
        renderProjects(filteredProjects, projectsContainer, 'h2');
        renderPieChart(filteredProjects);
    }
}

