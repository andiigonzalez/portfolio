const width = 1000;
const height = 600;
const margin = { top: 10, right: 10, bottom: 50, left: 50 }; 
let NUM_ITEMS = 100; // Ideally, let this value be the length of your commit history
let ITEM_HEIGHT = 30; // Feel free to change
let VISIBLE_COUNT = 10; // Feel free to change as well
let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;

const scrollContainer = d3.select('#scroll-container');

const spacer = d3.select('#spacer');
spacer.style('height', `${totalHeight}px`);

const itemsContainer = d3.select('#items-container');

scrollContainer.on('scroll', () => {
  const scrollTop = scrollContainer.property('scrollTop');
  let startFileIndex = Math.floor(scrollTop / FILE_ITEM_HEIGHT);
  startFileIndex = Math.max(0, Math.min(startFileIndex, files.length - VISIBLE_FILE_COUNT));
  renderFileItems(startFileIndex);
  updateScatterplot(commits.slice(startIndex, endIndex+VISIBLE_COUNT));

  const currentCommit = commits[startIndex];
    if (currentCommit) {
        document.getElementById('scroll-date').textContent = 
            currentCommit.datetime.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    }
});
let files = [];

const usableArea = {
  top: margin.top,
  right: width - margin.right,
  bottom: height - margin.bottom,
  left: margin.left,
  width: width - margin.left - margin.right,
  height: height - margin.top - margin.bottom,
};

let data = [];
let commits = []; 

let timeScale = d3.scaleTime()
  .domain([new Date(2020, 0, 1), new Date()]) // Default domain, will be updated
  .range([0, 100]);

let xScale;
let yScale;
let brushSelection = null;
let selectedCommits = [];
let filtered = []; 

let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);


async function loadData() {
  const tooltip = document.getElementById('commit-tooltip');
  if (tooltip) tooltip.hidden = true;

  try{
      data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    processCommits();

    displayStats();

    timeScale = d3.scaleTime()
      .domain([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)])
      .range([0, 100]);

    commitMaxTime = timeScale.invert(commitProgress);

    selectedTime.text(commitMaxTime.toLocaleString(undefined, {
      dateStyle: "full",
      timeStyle: "short"
    }));

    d3.select("#commitSlider").on("input", function() {
      commitProgress = this.value;
      commitMaxTime = timeScale.invert(commitProgress);
      selectedTime.text(commitMaxTime.toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short"
      }));
      updateTimeDisplay();
    });
    
    filtered = filterCommitsByTime();
    updateScatterplot(filtered);
    brushSelector();
  } catch { (error) => {
    console.error("Error loading CSV file:", error);
    alert("Failed to load data. Please check the file path and try again.");
  }
}
}


let commitProgress = 100;
let commitMaxTime;
const selectedTime = d3.select('#selectedTime');
selectedTime.textContent = timeScale.invert(commitProgress).toLocaleString();

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});
  


function processCommits() {
  commits = d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url: `https://github.com/andiigonzalez/portfolio/commit/${commit}`,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, "lines", {
        value: lines,
        enumerable: false, // Hide from console logs
        configurable: false,
        writable: false
      });
      return ret;
     });
}



function displayStats() {
  processCommits();

  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  dl.append('dt').text('Commits:');
  dl.append('dd').text(commits.length);

  dl.append('dt').text('Files:');
  dl.append('dd').text(d3.group(data, d => d.file).size);

  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>:');
  dl.append('dd').text(data.length);
  const numFiles = d3.group(data, d => d.file).size;

  dl.append('dt').text('Number of Files');
  dl.append('dd').text(numFiles);

  dl.append('dt').text('Avg. File Length:');
  const fileLengths = d3.rollups(
    data,
    v => d3.max(v, d => d.line),
    d => d.file
  );
  
  dl.append('dd').text(d3.mean(fileLengths, d => d[1]).toFixed(2));

  const workByPeriod = d3.rollups(
    data,
    v => v.length,
    d => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
  );
  const maxPeriod = d3.greatest(workByPeriod, d => d[1])?.[0];
  const capitalizedMaxPeriod = maxPeriod ? maxPeriod.charAt(0).toUpperCase() + maxPeriod.slice(1) : 'N/A';
  dl.append('dt').text('Most Activity:');
  dl.append('dd').text(capitalizedMaxPeriod);
  }

function filterCommitsByTime() {
  const filtered = commits.filter(commit => commit.datetime <= commitMaxTime);
  return filtered;
  }

console.log("Filtered Commits:", filtered);


function updateScatterplot(filtered) { 
  d3.select('svg').remove();

  const width = 1000;
  const height = 600;
  const svg = d3.select('#chart').append('svg').attr('width', width).attr('height', height).style('overflow', 'visible');

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  xScale = d3.scaleTime()
      .domain(d3.extent(filtered, (d) => d.datetime)) // 
      .range([margin.left, width - margin.right])
      .nice();

  yScale = d3.scaleLinear()
      .domain([0, 24])
      .range([height - margin.bottom, margin.top]);

  const dots = svg.append('g').attr('class', 'dots');

  const [minLines, maxLines] = d3.extent(filtered, (d) => d.totalLines);
  
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([5, 30]);


  dots.selectAll('circle').remove();

  dots.selectAll("circle").data(filtered)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('fill', 'steelblue')
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).classed('selected', isCommitSelected(commit));
      updateTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event, commit) => {
        updateTooltipContent({});
        updateTooltipVisibility(false);
        d3.select(event.currentTarget).classed('selected', isCommitSelected(commit));
    });

    console.log("Circles Rendered:", dots.selectAll("circle").size());


  const gridlines = svg.append('g').attr('class', 'gridlines').attr('transform', `translate(${margin.left}, 0)`);

  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-width));

  svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

  svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat(d => String(d).padStart(2, '0') + ':00'));
      
  updateFileList(filtered);
}


function updateFileList(filteredCommits) {

  let lines = filteredCommits.flatMap(d => d.lines);

  let fileTypeColor = d3.scaleOrdinal(d3.schemeTableau10).domain(lines.map(d => d.type));
  let files = d3.groups(lines, d => d.file).filter(([name, lines]) => name).map(([name, lines]) => ({ name, lines })).sort((a, b) => b.lines.length - a.lines.length);

  
  let fileList = d3.select('.files');
  fileList.html(""); 

  let fileEntries = fileList
      .selectAll("div.file-entry")
      .data(files)
      .join("div")
      .attr("class", "file-entry");

  fileEntries.append("code")
      .text(d => d.name);

  fileEntries.append("dd")
      .text(d => `${d.lines.length} lines`);

  let lineDots = fileEntries.append("div").attr("class", "line-dots");

  lineDots
      .selectAll("span")
      .data(d => d.lines)
      .join("span")
      .attr("class", "line-dot")
      .style("background-color", d => fileTypeColor(d.type));

      console.log("File list updated successfully.");
    }


function updateTimeDisplay() {
  commitProgress = Number(d3.select("#commitSlider").property("value"));
  commitMaxTime = timeScale.invert(commitProgress);
  selectedTime.text(commitMaxTime.toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short"
    }));
  filtered = filterCommitsByTime(); 
  updateScatterplot(filtered);
  }


function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');
  const time = document.getElementById('commit-time');
  const linesEdited = document.getElementById('commit-lines-edited');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
  author.textContent = commit.author;
  time.textContent = commit.datetime?.toLocaleString('en', { hour: '2-digit', minute: '2-digit' }); 
  linesEdited.textContent = commit.totalLines; 
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 25}px`;
  tooltip.style.top = `${event.clientY + 25}px`;
}


function brushSelector() {
  const svg = document.querySelector('svg');

  d3.select(svg).call(d3.brush().on('start brush end', brushed));

  d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
}

function brushed(evt) {
  let brushSelection = evt.selection;
  selectedCommits = !brushSelection
    ? []
    : commits.filter((commit) => {
        let min = { x: brushSelection[0][0], y: brushSelection[0][1] };
        let max = { x: brushSelection[1][0], y: brushSelection[1][1] };
        let x = xScale(commit.datetime);
        let y = yScale(commit.hourFrac);

        return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
      });
  updateSelection();
  updateSelectionCount();
  updateLanguageBreakdown();
}


function isCommitSelected(commit) {
  return selectedCommits.includes(commit);
}


function updateSelection() {
  d3.selectAll("circle").classed("selected", (d) => isCommitSelected(d));
}

function updateSelectionCount() {
  
  const countElement = document.getElementById('selection-count');
  countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;

  return selectedCommits;
}

function updateLanguageBreakdown() {

  const container = document.getElementById("language-breakdown");

  if (selectedCommits.length === 0) {
    container.innerHTML = "";
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
      }

  return breakdown;
}

function renderItems(startIndex) {

  itemsContainer.selectAll('div').remove();

  const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
  let newCommitSlice = commits.slice(startIndex, endIndex);

  updateScatterplot(newCommitSlice);

  itemsContainer.selectAll('div')
    .data(newCommitSlice)
    .enter()
    .append('div')
    .attr('class', 'item')
    .style('position', 'absolute')
    .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`)
    .html(commit => `<p>On ${commit.datetime.toLocaleString()} I made a commit with ${commit.totalLines} lines.</p>`);

    updateScatterplot(newCommitSlice)
  }

function displayCommitFiles() {
  const lines = filtered.flatMap((d) => d.lines);

  let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
  
  let files = d3.groups(lines, (d) => d.file).map(([name, lines]) => ({
      name,
      lines
  }));

  files = d3.sort(files, (d) => -d.lines.length);

  d3.select('.files').selectAll('div').remove();

  let filesContainer = d3.select('.files')
      .selectAll('div')
      .data(files)
      .enter()
      .append('div')
      .attr("class", "file-entry");

  filesContainer.append('dt')
      .html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);

  filesContainer.append('dd')
      .selectAll('div')
      .data(d => d.lines)
      .enter()
      .append('div')
      .attr("width", d => xScale(d.lines.length) - xScale(0))
      .attr('class', 'line')
      .style('background', d => fileTypeColors(d.type));
}

