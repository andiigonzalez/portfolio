import { fetchJSON, renderProjects } from '../global.js';

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

/* 
------------------------------------------------------------------------------------------------------------------- 
------------------------------- DISPLAY THE PROJECTS -------------------------------------------------------------- 
*/

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

/* 
------------------------------------------------------------------------------------------------------------------- 
----------------------------------------- CREATE PIE CHART & LEGEND -----------------------------------------------
*/

/// GROUP DATA BY YEAR AND COUNTS HOW MANY OF EACH YEAR
let rolledData = d3.rollups(  
    projects,
    (v) => v.length,
    (d) => d.year,
);
 // OUTPUT ARRAY OF THE GROUPED DATA 
let data = rolledData.map(([year, count]) => {
    return { value: count, label: year }
});

// SELECT WHERE PIE WILL APPEAR
let svg = d3.select("svg");                                 

// SPECIES THE SHAPE OF THE PIE. INNER RADIUS DICTATES IF DONUT OR NOT
let arcGenerator = d3.arc().innerRadius(0).outerRadius(35); 
// CALCULATE THE ANGLE OF THE SLICE BASED ON THE NUMBER OF PROJECTS
let sliceGenerator = d3.pie().value(d => d.value);      
let arcData = sliceGenerator(data);

// MAP COLORS TO EACH SLICE 
let colors = d3.scaleOrdinal(d3.schemeSet2);

// USE ARC GENERATOR TO CREATE ACTUAL PATHS FOR EACH SLICE
let arcs = arcData.map(d => arcGenerator(d));

// LOOPS THROUGH EACH SLICE AND APPENDS IT TO SVG
arcs.forEach((arc, idx) => { 
    d3.select('svg')
        .append("path") // APPEND THE START & END ANGLES
        .attr("d", arc) // DEFINE SHAPE
        .attr("fill", colors(idx)) // FILL THE SLICE WITH COLOR
        .attr("stroke", "#fff") // THE SEPARATION MARGIN BETWEEN SLICES
        .attr("stroke-width", "0.5px") // WIDTH OF THE SEPARATION MARGIN
        .attr("cursor", "pointer")  
        .on('click', () => filterByYear(data[idx].label)); // MAKE SURE THE PIE FILTERS ALWAYS
});


let legend = d3.select('.legend'); // SELECT WHERE LEGEND WILL APPEAR

data.forEach((d, idx) => { // LOOP THROUGH EACH YEAR
    legend.append('li') // APPEND A LIST ITEM
    .attr('style', `--color:${colors(idx)}`) // SET COLOR OF THE SWATCH
    .attr('class', 'legend-item')  // ADD CLASS TO THE LIST ITEM
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`) // ADD YEAR AND COUNT TO THE LIST ITEM
});

/* 
-------------------------------------------------------------------------------------------------------------------- 
------------------------------- SEARCH BAR & FILTERING ------------------------------------------------------------- 
*/

let query = '';  // SETS THE QUERY TO EMPTY STRING

function setQuery(newQuery) { // FUNCTION TO SET THE QUERY
    query = newQuery.trim().toLowerCase(); // REMOVE SPACES AND LOWERCASE THE QUERY
    if (query === "") return projects;  // IF QUERY IS EMPTY, RETURN ALL PROJECTS

    let filteredProjects = projects.filter(project => { // FILTER PROJECTS BASED ON QUERY
        let values = Object.values(project).join('\n').toLowerCase(); // BY JOINING YOU CAN SEARCH THROUGH ALL FIELDS (Title, Description, Year)
        return values.includes(query.toLowerCase()); // RETURN PROJECTS THAT INCLUDE THE QUERY
    });

    return filteredProjects; // RETURN THE FILTERED PROJECTS
}

const searchInput = document.querySelector('.searchBar'); // SELECT THE SEARCH BAR


searchInput.addEventListener('input', (event) => { // ADD EVENT LISTENER TO SEARCH BAR
    let filteredProjects = setQuery(event.target.value); // WAITS FOR TYPING TO QUERY & THEN FILTERS
    // UPDATE/SHOW FILTERED PROJECTS (DYNAMICALLY)
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects); 
});

// >>>>>>>>>>>>>>>> FUNCTION FOR PIE CHART AFTER QUERY <<<<<<<<<<<<<<<<<<<<

function renderPieChart(projectsGiven) { // FUNCTION TO RENDER PIE CHART
    console.log("Updating Pie Chart with:", projectsGiven.length, "projects");

    let newSVG = d3.select('svg'); // SELECT THE SVG
    newSVG.selectAll('path').remove(); // REMOVE ALL OLD PATHS
    let legend = d3.select('.legend'); // SELECT THE LEGEND
    legend.selectAll('li').remove(); // REMOVE ALL OLD LEGEND ITEMS

    // GROUP NEW FILTERED DATA BY YEAR
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );
    // RETURN ARRAY OF NEW GROUPED DATA
    let newData = newRolledData.map(([year, count]) => ({
        value: count,
        label: year
    }));
    // CREATE/CALCULATE THE PIE SLICES AND NECESSARY FUNCTION (Explanation Above)
    let newSliceGenerator = d3.pie().value(d => d.value);
    let newArcData = newSliceGenerator(newData);
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(35);
    let newArcs = newArcData.map(d => arcGenerator(d));
    let colors = d3.scaleOrdinal(d3.schemeSet2);

    // LOOP THROUGH EACH NEW SLICE AND FORMAT IT PROPERLY
    newArcs.forEach((arc, idx) => {
        newSVG.append("path")
            .attr("d", arc)
            .attr("fill", colors(idx))
            .attr("stroke", "#fff")
            .attr("stroke-width", "0.5px") // ADD SEPARATION MARGIN BETWEEN SLICES
            .attr("cursor", "pointer")  // ADD CURSOR POINTER TO SLICES
            .on('click', () => filterByYear(newData[idx].label)); // ADD EVENT LISTENER TO SLICES
    });
    // UPDATE LEGEND
    newData.forEach((d, idx) => {
        legend.append('li')
            .attr('style', `--color:${colors(idx)}`)
            .attr('class', 'legend-item')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .on('click', () => filterByYear(d.label)); // ADD EVENT LISTENER TO LEGEND ITEMS
    });
}
// >>>>>>>>>>>>>>>> FILTER BY CLICKING ON PIE CHART ITEMS <<<<<<<<<<<<<<<<<<<<

let selectedIndex = -1; // MEANS NO INDEX

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
    let filteredProjects = projects.filter((project) => {
        let matchesQuery = query === "" || Object.values(project).join('\n').toLowerCase().includes(query.toLowerCase());
        let matchesYear = selectedIndex === -1 || project.year === selectedIndex;
        return matchesQuery && matchesYear;
    });


    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
    
    d3.selectAll("path").classed("selected", (d, i) => i === selectedIndex);
    d3.selectAll(".legend-item").classed("selected", (d, i) => i === selectedIndex);
}

