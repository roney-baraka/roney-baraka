// GraphQL API and Token
const GITHUB_API_URL = "https://api.github.com/graphql";
const GITHUB_TOKEN ="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"



// Ensure GitHub token is available
if (!GITHUB_TOKEN) {
  throw new Error("GitHub token is missing. Add it to your environment variables or replace `your_personal_access_token`.");
}

// GraphQL query to fetch contribution data
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
        variables: { username, from, to },
      }),
    });

    const result = await response.json();
    if (result.errors) {
      console.error("GitHub API Error:", result.errors);
      return [];
    }
    return result.data.user.contributionsCollection.contributionCalendar.weeks;
  } catch (error) {
    console.error("Error fetching GitHub contributions:", error);
    return [];
  }
}

// Render GitHub Contributions Graph
async function drawContributionGraph(username, from, to) {
  const weeks = await fetchGitHubContributions(username, from, to);
  const svg = d3.select("#contribution-svg");
  svg.selectAll("*").remove(); // Clear previous graph

  if (!weeks || weeks.length === 0) {
    svg.append("text")
      .attr("x", 10)
      .attr("y", 50)
      .text("No contribution data available.")
      .style("fill", "red");
    return;
  }

  const days = weeks.flatMap((week) => week.contributionDays);

  const width = 800;
  const height = 150;
  const dayWidth = width / 53; // Assume 53 weeks
  const dayHeight = height / 7;

  svg.selectAll("rect")
    .data(days)
    .enter()
    .append("rect")
    .attr("x", (d, i) => Math.floor(i / 7) * dayWidth)
    .attr("y", (d, i) => (i % 7) * dayHeight)
    .attr("width", dayWidth - 2)
    .attr("height", dayHeight - 2)
    .style("fill", (d) => d.color || "#eee")
    .append("title")
    .text((d) => `${d.date}: ${d.contributionCount} contributions`);
}

// Set up buttons and default graph
document.addEventListener("DOMContentLoaded", () => {
  const username = "roney-baraka"; // Replace with your GitHub username
  const today = new Date();

  const currentYearStart = new Date(today.getFullYear(), 0, 1).toISOString();
  const currentYearEnd = new Date(today.getFullYear(), 11, 31).toISOString();

  const previousYearStart = new Date(today.getFullYear() - 1, 0, 1).toISOString();
  const previousYearEnd = new Date(today.getFullYear() - 1, 11, 31).toISOString();

  const lastFullYearStart = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString();
  const lastFullYearEnd = today.toISOString();

  document.getElementById("current-year").addEventListener("click", () => {
    drawContributionGraph(username, currentYearStart, currentYearEnd);
  });

  document.getElementById("previous-year").addEventListener("click", () => {
    drawContributionGraph(username, previousYearStart, previousYearEnd);
  });

  document.getElementById("last-full-year").addEventListener("click", () => {
    drawContributionGraph(username, lastFullYearStart, lastFullYearEnd);
  });

  // Default: Load contributions for the current year
  drawContributionGraph(username, currentYearStart, currentYearEnd);
});
