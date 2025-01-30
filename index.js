
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const latestProjects = projects.slice(0, 3);

const projectsContainer = document.querySelector('.projects');

renderProjects(latestProjects, projectsContainer, 'h3');

import { fetchGitHubData } from './global.js'; // Import function


const githubData = await fetchGitHubData('giorgianicolaou'); // Fetch data
const profileStats = document.querySelector('#profile-stats'); // Select HTML container

if (profileStats) {
    profileStats.innerHTML = `
        <h3>My GitHub Statistics</h3>
            <dl>
                <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
                <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
                <dt>Followers:</dt><dd>${githubData.followers}</dd>
                <dt>Following:</dt><dd>${githubData.following}</dd>
            </dl>
        `;
    }

