const width = 1000;
const height = 600;
const margin = { top: 10, right: 10, bottom: 50, left: 50 }; 

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
let brushSelection = null;


const svg = d3
  .select("#chart")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .style("overflow", "visible");


let xScale, yScale;


async function loadData() {
  data = await d3.csv("loc.csv", (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + "T00:00" + row.timezone),
    datetime: new Date(row.datetime),
  }));

  processCommits();
  displayStats();
  createScatterplot();
}


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

  dl.append('dt').text('Max Depth:');
  dl.append('dd').text(d3.max(data, d => d.depth));

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

function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
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

function createScatterplot() {
  if (!commits.length) return;
  
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3
    .scaleLinear()
    .domain([1, 23]) // Represents hours in a day
    .range([usableArea.bottom, usableArea.top]);

  // Create a square root scale for dot size
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([5, 20]);


  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);


  const gridlines = svg.append("g")
    .attr("class", "gridlines")
    .attr("transform", `translate(${usableArea.left}, 0)`);
  gridlines.call(d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width));


  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, "0") + ":00");

  svg.append("g")
    .attr("transform", `translate(0, ${usableArea.bottom})`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "center");

  svg.append("g")
    .attr("transform", `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  const colorScale = d3.scaleSequential(d3.interpolatePlasma).domain([24, 1]);

  const dots = svg.append("g").attr("class", "dots");

  dots.selectAll("circle")
    .data(sortedCommits)
    .join("circle")
    .attr("cx", (d) => xScale(d.datetime))
    .attr("cy", (d) => yScale(d.hourFrac))
    .attr("r", (d) => rScale(d.totalLines))
    .attr("fill", (d) => colorScale(d.hourFrac))
    .style("fill-opacity", 0.7)

    .on("mouseenter", function (event, d) {
      d3.select(event.currentTarget).style("fill-opacity", 1);
      updateTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on("mouseleave", function () {
      d3.select(event.currentTarget).style("fill-opacity", 0.7);
      updateTooltipContent({});
      updateTooltipVisibility(false);
    });
  
    /*>>>>>>>>>>>>>>>>>>> BRUSH <<<<<<<<<<<<<<<<<<<*/  
  const brush = d3.brush()
    .on("start brush end", brushed);

  svg.append("g")
    .attr("class", "brush")
    .call(brush);

  
  svg.selectAll(".dots, .overlay ~ *").raise();
}


function brushed(event) {
  brushSelection = event.selection;
  updateSelection();
  updateSelectionCount();
  updateLanguageBreakdown();
}


function isCommitSelected(commit) {
  if (!brushSelection) return false;
  const [[x0, y0], [x1, y1]] = brushSelection;
  return (
    xScale(commit.datetime) >= x0 &&
    xScale(commit.datetime) <= x1 &&
    yScale(commit.hourFrac) >= y0 &&
    yScale(commit.hourFrac) <= y1
  );
}


function updateSelection() {
  d3.selectAll("circle").classed("selected", (d) => isCommitSelected(d));
}


function updateSelectionCount() {
  const selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];

  const countElement = document.getElementById("selection-count");
  countElement.textContent = `${selectedCommits.length || "No"} commits selected`;
}

function updateLanguageBreakdown() {
  const selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];
  const container = document.getElementById("language-breakdown");

  if (selectedCommits.length === 0) {
    container.innerHTML = "";
    return;
  }

  const lines = selectedCommits.flatMap((d) => d.lines);
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  container.innerHTML = "";
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format(".1~%")(proportion);
    container.innerHTML += `<dt>${language}</dt><dd>${count} lines (${formatted})</dd>`;
  }
  return breakdown;
}



document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
});