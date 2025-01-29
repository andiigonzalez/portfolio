
import { fetchJSON, renderProjects } from 'global.js';

(async function () {
    try {
        // Fetch all projects
        const projects = await fetchJSON('../lib/projects.json');

        // Select the container on the homepage
        const projectsContainer = document.querySelector('.projects');

        // Check if the container exists
        if (!projectsContainer) {
            console.error("Error: '.projects' container not found in index.html.");
            return;
        }

        // Get the first 3 projects
        const latestProjects = projects.slice(0, 3);

        // Render the latest projects
        if (latestProjects.length > 0) {
            renderProjects(latestProjects, projectsContainer, 'h2');
        } else {
            projectsContainer.innerHTML = "<p>No recent projects available.</p>";
        }
    } catch (error) {
        console.error("Error fetching or displaying latest projects:", error);
    }
})();

