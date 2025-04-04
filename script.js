class GitHubExplorer {
  constructor() {
    this.username = "";
    this.currentPage = 1;
    this.perPage = 5;
  }
  async fetchUserProfile(username) {
    try {
      const response = await fetch(`https://api.github.com/users/${username}`);
      if (!response.ok) {
        throw new Error("User not found");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
  async fetchUserRepos(page = 1) {
    try {
      const response = await fetch(
        `https://api.github.com/users/${this.username}/repos?page=${page}&per_page=${this.perPage}`
      );
      if (!response.ok) {
        throw new Error("Error fetching repositories");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
  async *reposGenerator() {
    let page = 1;
    let repos;
    do {
      repos = await this.fetchUserRepos(page);
      if (repos.length === 0) break;
      yield repos;
      page++;
    } while (repos.length === this.perPage);
  }
}
const explorer = new GitHubExplorer();
let repoGen = null;

const searchForm = document.getElementById("searchForm");
const errorDiv = document.getElementById("error");
const profileSection = document.getElementById("profileSection");
const reposSection = document.getElementById("reposSection");

searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorDiv.textContent = "";
  const usernameInput = document.getElementById("username").value.trim();
  if (!usernameInput) return;

  explorer.username = usernameInput;
  explorer.currentPage = 1;
  try {
    const profileData = await explorer.fetchUserProfile(usernameInput);
    document.getElementById("avatar").src = profileData.avatar_url;
    document.getElementById("name").textContent =
      profileData.name || usernameInput;
    document.getElementById("bio").textContent =
      "Bio: " + (profileData.bio || "Not Available");
    document.getElementById("location").textContent =
      "Location: " + (profileData.location || "Not Available");
    document.getElementById("reposCount").textContent =
      "Public Repos: " + profileData.public_repos;
    document.getElementById("followers").textContent =
      "Followers: " + profileData.followers;

    profileSection.style.display = "block";
    reposSection.style.display = "block";

    repoGen = explorer.reposGenerator();
    loadNextPage();
  } catch (error) {
    errorDiv.textContent = error.message;
    profileSection.style.display = "none";
    reposSection.style.display = "none";
  }
});

function renderRepos(repos) {
  const reposList = document.getElementById("reposList");
  reposList.innerHTML = "";
  repos.forEach((repo) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${repo.name}</strong>: ${
      repo.description || "No description available."
    }`;
    reposList.appendChild(li);
  });
}

async function loadNextPage() {
  try {
    const result = await repoGen.next();
    if (result.done) {
      document.getElementById("nextBtn").disabled = true;
      return;
    }
    renderRepos(result.value);
    explorer.currentPage++;
    document.getElementById("prevBtn").disabled = explorer.currentPage <= 2;
    document.getElementById("nextBtn").disabled = false;
  } catch (error) {
    console.error(error);
  }
}

async function loadPreviousPage() {
  if (explorer.currentPage <= 2) return;
  const targetPage = explorer.currentPage - 2;
  explorer.currentPage = 1;
  repoGen = explorer.reposGenerator();
  let repos;
  for (let i = 0; i < targetPage; i++) {
    const result = await repoGen.next();
    repos = result.value;
  }
  renderRepos(repos);
  explorer.currentPage = targetPage + 1;
  document.getElementById("prevBtn").disabled = explorer.currentPage <= 2;
  document.getElementById("nextBtn").disabled = false;
}

document.getElementById("nextBtn").addEventListener("click", loadNextPage);
document.getElementById("prevBtn").addEventListener("click", loadPreviousPage);
