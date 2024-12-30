// GraphQL API and Token
const GITHUB_API_URL = "https://api.github.com/graphql";
const GITHUB_TOKEN = "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";

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
        query,
        variables: { username, from, to },
      }),
    });

    const result = await response.json();

    if (response.ok) {
      return result.data.user.contributionsCollection.contributionCalendar.weeks;
    } else {
      console.error("Error fetching contributions:", result);
      return null;
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

// Draw the contributions graph
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

  const margin = { top: 20, right: 20, bottom: 20, left: 40 };
  const width = parseInt(svg.style("width")) - margin.left - margin.right;
  const height = 150; // Fixed height for now

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const days = weeks.flatMap((week) => week.contributionDays);

  // Map data to grid positions
  const dayWidth = width / 53; // Assume 53 weeks in a year
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
    .style("fill", (d) => d.color || "#ebedf0")
    .append("title")
    .text((d) => `${d.date}: ${d.contributionCount} contributions`);

  // Add month labels
  const monthFormat = d3.timeFormat("%b");
  const months = [...new Set(days.map((d) => d.date.slice(0, 7)))]; // Unique months

  months.forEach((month, i) => {
    g.append("text")
      .attr("x", i * (width / 12)) // Position evenly
      .attr("y", -5)
      .style("text-anchor", "middle")
      .text(monthFormat(new Date(`${month}-01`)));
  });

  // Add day labels
  const dayLabels = ["Mon", "Wed", "Fri"];
  dayLabels.forEach((day, i) => {
    g.append("text")
      .attr("x", -10)
      .attr("y", (i * 2 + 1) * dayHeight - dayHeight / 2)
      .style("text-anchor", "end")
      .text(day);
  });
}

// Rate Limit Query
const rateLimitQuery = `
query {
  rateLimit {
    limit
    remaining
    resetAt
  }
}
`;

async function checkRateLimits() {
  try {
    const response = await fetch(GITHUB_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({ query: rateLimitQuery }),
    });

    const result = await response.json();

    if (response.ok) {
      const { limit, remaining, resetAt } = result.data.rateLimit;
      console.log(`Rate Limit: ${limit}`);
      console.log(`Remaining: ${remaining}`);
      console.log(`Resets At: ${new Date(resetAt).toLocaleString()}`);
    } else {
      console.error("Error fetching rate limits:", result);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Event Listeners for Buttons
document.addEventListener("DOMContentLoaded", () => {
  const username = "roney-baraka";
  const today = new Date();

  const currentYearStart = new Date(today.getFullYear(), 0, 1).toISOString();
  const currentYearEnd = new Date(today.getFullYear(), 11, 31).toISOString();

  document.getElementById("current-year").addEventListener("click", () => {
    drawContributionGraph(username, currentYearStart, currentYearEnd);
  });

  drawContributionGraph(username, currentYearStart, currentYearEnd); // Default
});
