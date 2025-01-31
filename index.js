
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('https://andiigonzalez.github.io/portfolio/lib/projects.json');
console.log("Projects Retrieved:", projects);

const latestProjects = projects.slice(0, 3);

const projectsContainer = document.querySelector('.projects');


renderProjects(latestProjects, projectsContainer, 'h3');
console.log("Latest Projects:", latestProjects);

import { fetchGitHubData } from '../global.js'; // Import function


const githubData = await fetchGitHubData('andiigonzalez'); // Fetch data
const profileStats = document.querySelector('#profile-stats'); // Select HTML container

if (profileStats) {
    profileStats.innerHTML = `
        <h2>My GitHub Statistics: </h2>
            <dl>
                <dt>FOLLOWERS:</dt><dd>${githubData.followers}</dd>
                <dt>FOLLOWING:</dt><dd>${githubData.following}</dd>
                <dt>PUBLIC REPOS:</dt><dd>${githubData.public_repos}</dd>
                <dt>PUBLIC GISTS:</dt><dd>${githubData.public_gists}</dd>
            </dl>
        `;
    }

