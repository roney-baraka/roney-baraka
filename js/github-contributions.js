const GITHUB_API_URL = "https://api.github.com/graphql";
const GITHUB_TOKEN = "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";
const GITHUB_USERNAME = "roney-baraka";

// GraphQL query
const query = `
query($username: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $username) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
            color
          }
        }
      }
    }
  }
}`;

// Fetch contributions data from GitHub
async function fetchGitHubContributions(username, from, to) {
  try {
    const response = await fetch(GITHUB_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        query: query,
        variables: { username: username, from: from, to: to },
      }),
    });

    const result = await response.json();
    return result.data.user.contributionsCollection.contributionCalendar.weeks;
  } catch (error) {
    console.error("Error fetching GitHub contributions:", error);
    return [];
  }
}

// Render GitHub Contributions SVG
async function drawContributionGraph(from, to) {
  const weeks = await fetchGitHubContributions(GITHUB_USERNAME, from, to);

  if (!weeks || weeks.length === 0) {
    console.error("No contributions data available.");
    return;
  }

  const svg = d3.select("#contribution-svg");
  svg.selectAll("*").remove(); // Clear previous graph

  const margin = { top: 20, right: 20, bottom: 20, left: 40 };
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const days = weeks.flatMap((week) => week.contributionDays);

  // Map data to grid positions
  const dayWidth = width / 53; // Assume 53 weeks
  const dayHeight = height / 7;

  // Render the graph
  g.selectAll("rect")
    .data(days)
    .enter()
    .append("rect")
    .attr("x", (d, i) => Math.floor(i / 7) * dayWidth) // Columns (weeks)
    .attr("y", (d, i) => (i % 7) * dayHeight) // Rows (days of the week)
    .attr("width", dayWidth - 2)
    .attr("height", dayHeight - 2)
    .style("fill", (d) => d.color)
    .append("title")
    .text((d) => `${d.date}: ${d.contributionCount} contributions`);

  // Add month labels
  const months = Array.from(new Set(days.map((d) => new Date(d.date).toLocaleString("en-US", { month: "short" }))));
  months.forEach((month, i) => {
    g.append("text")
      .attr("x", i * (dayWidth * 4)) // Spacing for each month
      .attr("y", -5) // Above the grid
      .style("text-anchor", "middle")
      .text(month);
  });

  // Add day labels (Monday, Wednesday, Friday)
  ["Mon", "Wed", "Fri"].forEach((day, i) => {
    g.append("text")
      .attr("x", -10)
      .attr("y", i * (dayHeight * 2) + 10)
      .style("text-anchor", "end")
      .text(day);
  });
}

// Button functionality to update graph
function setupButtons() {
  const currentYearButton = document.querySelector("button:nth-child(1)");
  const previousYearButton = document.querySelector("button:nth-child(2)");
  const lastFullYearButton = document.querySelector("button:nth-child(3)");

  const today = new Date();
  const currentYearStart = new Date(today.getFullYear(), 0, 1).toISOString();
  const currentYearEnd = new Date(today.getFullYear(), 11, 31).toISOString();

  const previousYearStart = new Date(today.getFullYear() - 1, 0, 1).toISOString();
  const previousYearEnd = new Date(today.getFullYear() - 1, 11, 31).toISOString();

  const lastFullYearStart = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString();
  const lastFullYearEnd = today.toISOString();

  currentYearButton.addEventListener("click", () => drawContributionGraph(currentYearStart, currentYearEnd));
  previousYearButton.addEventListener("click", () => drawContributionGraph(previousYearStart, previousYearEnd));
  lastFullYearButton.addEventListener("click", () => drawContributionGraph(lastFullYearStart, lastFullYearEnd));
}

// Initialize graph and buttons
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  const currentYearStart = new Date(today.getFullYear(), 0, 1).toISOString();
  const currentYearEnd = new Date(today.getFullYear(), 11, 31).toISOString();

  drawContributionGraph(currentYearStart, currentYearEnd); // Default to current year
  setupButtons();
});
