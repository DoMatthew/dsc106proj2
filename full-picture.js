const data = [
    [1980, 73.610], [1981, 74.010], [1982, 74.361], [1983, 74.463], [1984, 74.563], [1985, 74.563],
    [1986, 74.615], [1987, 74.766], [1988, 74.766], [1989, 75.017], [1990, 75.215], [1991, 75.366],
    [1992, 75.617], [1993, 75.419], [1994, 75.620], [1995, 75.622], [1996, 76.027], [1997, 76.429],
    [1998, 76.581], [1999, 76.583], [2000, 76.637], [2001, 76.837], [2002, 76.937], [2003, 77.037],
    [2004, 77.488], [2005, 77.488], [2006, 77.688], [2007, 77.988], [2008, 78.039], [2009, 78.390],
    [2010, 78.541], [2011, 78.641], [2012, 78.742], [2013, 78.742], [2014, 78.841], [2015, 78.690],
    [2016, 78.539], [2017, 78.539], [2018, 78.639], [2019, 78.788], [2020, 76.981], [2021, 76.329],
    [2022, 77.434], [2023, 78.385], [2024, 78.890],
].map(([year, value], i, rows) => ({
    year,
    value,
    change: i > 0 ? value - rows[i - 1][1] : null,
}));

const VIEWS = {
    full: { years: [1980, 2024], values: [72, 80] },
    for: { years: [1980, 2019], values: [72.8, 79.45] },
    against: { years: [2010, 2020], values: [76.55, 79.13] },
};

const WINDOWS = [
    { label: "FOR chart", years: [1980, 2019], color: "#087d73" },
    { label: "AGAINST chart", years: [2010, 2020], color: "#a13340" },
];

const CALLOUTS = [
    { year: 2021, text: "2021 | 76.3", dy: 22, anchor: "middle" },
    { year: 2024, text: "2024 | 78.9, a record", dy: -14, anchor: "end" },
];

const margin = { top: 34, right: 16, bottom: 84, left: 44 };
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const container = document.querySelector("#full-picture-chart");
const x = d3.scaleLinear();
const y = d3.scaleLinear();
const line = d3.line().x((d) => x(d.year)).y((d) => y(d.value));
let currentView = "full";

const svg = d3
    .select(container)
    .append("svg")
    .attr("role", "img")
    .attr(
        "aria-label",
        "Line chart of U.S. life expectancy from 1980 to 2024 with the time windows used by the FOR and AGAINST charts.",
    );

const defs = svg.append("defs");
const plotClip = defs.append("clipPath").attr("id", "fp-plot-clip").append("rect");
const trackClip = defs.append("clipPath").attr("id", "fp-track-clip").append("rect");

const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
const yAxisG = root.append("g").attr("class", "axis grid");
const xAxisG = root.append("g").attr("class", "axis");
const yLabel = root
    .append("text")
    .attr("class", "axis-label")
    .attr("x", -margin.left)
    .attr("y", -18)
    .text("Life expectancy (years)");

const series = root
    .append("g")
    .attr("clip-path", "url(#fp-plot-clip)")
    .append("path")
    .datum(data)
    .attr("class", "series");

const callouts = root
    .append("g")
    .selectAll("g")
    .data(CALLOUTS)
    .join("g")
    .attr("class", "callout");
callouts.append("circle").attr("r", 4.5);
callouts
    .append("text")
    .attr("text-anchor", (d) => d.anchor)
    .attr("dy", (d) => d.dy)
    .text((d) => d.text);

const tracks = root
    .append("g")
    .attr("clip-path", "url(#fp-track-clip)")
    .selectAll("g")
    .data(WINDOWS)
    .join("g")
    .attr("class", "track");
tracks
    .append("rect")
    .attr("height", 16)
    .attr("rx", 4)
    .attr("fill", (d) => d.color);
tracks
    .append("text")
    .attr("dy", 12)
    .text((d) => d.label);

const hover = root.append("g").attr("class", "hover").style("display", "none");
const hoverRule = hover.append("line");
const hoverDot = hover.append("circle").attr("r", 5);
const overlay = root.append("rect").attr("class", "overlay");
const tooltip = d3.select(container).append("div").attr("class", "tooltip").style("display", "none");

const valueOf = (year) => data.find((d) => d.year === year).value;
const formatChange = d3.format("+.2f");

function update(animate) {
    const view = VIEWS[currentView];
    const width = container.clientWidth;
    const height = Math.max(280, Math.min(400, width * 0.55));
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.attr("viewBox", `0 0 ${width} ${height}`).attr("width", width).attr("height", height);
    plotClip.attr("width", innerW).attr("height", innerH);
    trackClip.attr("y", innerH).attr("width", innerW).attr("height", margin.bottom);
    overlay.attr("width", innerW).attr("height", innerH);
    hoverRule.attr("y1", 0).attr("y2", innerH);

    x.domain(view.years).range([0, innerW]);
    y.domain(view.values).range([innerH, 0]);

    const narrow = view.values[1] - view.values[0] < 4;
    const t = svg
        .transition()
        .duration(animate && !reduceMotion ? 750 : 0)
        .ease(d3.easeCubicInOut);

    xAxisG
        .attr("transform", `translate(0,${innerH})`)
        .transition(t)
        .call(d3.axisBottom(x).ticks(Math.min(10, innerW / 70)).tickFormat(d3.format("d")));
    yAxisG
        .transition(t)
        .call(
            d3
                .axisLeft(y)
                .ticks(6)
                .tickSize(-innerW)
                .tickFormat(d3.format(narrow ? ".1f" : "d")),
        );

    series.transition(t).attr("d", line);

    callouts
        .transition(t)
        .attr("transform", (d) => `translate(${x(d.year)},${y(valueOf(d.year))})`)
        .style("opacity", currentView === "full" ? 1 : 0);

    tracks.attr("transform", (d, i) => `translate(0,${innerH + 38 + i * 22})`);
    tracks
        .select("rect")
        .transition(t)
        .attr("x", (d) => x(d.years[0]))
        .attr("width", (d) => x(d.years[1]) - x(d.years[0]));
    tracks
        .select("text")
        .transition(t)
        .attr("x", (d) => Math.max(x(d.years[0]), 0) + 8);

    hideHover();
}

function showHover(event) {
    const [mx] = d3.pointer(event);
    const [start, end] = VIEWS[currentView].years;
    const year = Math.max(start, Math.min(end, Math.round(x.invert(mx))));
    const d = data.find((p) => p.year === year);

    hover.style("display", null);
    hoverRule.attr("x1", x(year)).attr("x2", x(year));
    hoverDot.attr("cx", x(year)).attr("cy", y(d.value));

    const change = d.change === null ? "" : `<br>${formatChange(d.change)} vs. ${year - 1}`;
    tooltip
        .style("display", null)
        .html(`<strong>${year}</strong>: ${d.value.toFixed(1)} years${change}`);

    const tipWidth = tooltip.node().offsetWidth;
    const left = margin.left + x(year) + 12;
    tooltip
        .style("left", `${left + tipWidth > container.clientWidth ? left - tipWidth - 24 : left}px`)
        .style("top", `${margin.top + y(d.value) - 48}px`);
}

function hideHover() {
    hover.style("display", "none");
    tooltip.style("display", "none");
}

overlay.on("pointermove", showHover).on("pointerleave", hideHover);

document.querySelectorAll(".view-buttons button").forEach((button) => {
    button.addEventListener("click", () => {
        currentView = button.dataset.view;
        document
            .querySelectorAll(".view-buttons button")
            .forEach((b) => b.setAttribute("aria-pressed", b === button));
        document
            .querySelectorAll(".view-note")
            .forEach((note) => (note.hidden = note.dataset.view !== currentView));
        update(true);
    });
});

const table = d3.select("#full-picture-table").append("table");
table
    .append("thead")
    .append("tr")
    .selectAll("th")
    .data(["Year", "Life expectancy (years)", "Change from year before"])
    .join("th")
    .text((d) => d);
table
    .append("tbody")
    .selectAll("tr")
    .data(data)
    .join("tr")
    .selectAll("td")
    .data((d) => [d.year, d.value.toFixed(2), d.change === null ? "—" : formatChange(d.change)])
    .join("td")
    .text((d) => d);

let lastWidth = 0;
new ResizeObserver(([entry]) => {
    if (entry.contentRect.width === lastWidth) return;
    lastWidth = entry.contentRect.width;
    requestAnimationFrame(() => update(false));
}).observe(container);
