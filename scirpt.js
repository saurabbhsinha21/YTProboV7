let tracking = false;
let interval;
let videoId = "";
let targetViews = 0;
let endTime;

let apiKeys = [
  "AIzaSyBvVpO0WJB97BNO91RtqTIolLNmV66Qqt8",
  "AIzaSyBT5aGU-3R-jpP4HrGbvX4HBg0IB7IyvIQ",
  "AIzaSyBPbjeqqO6-JicHBUb0OWEubTujbXJtUV8",
  "AIzaSyDgFJ-2KbTEtO3aCIh6K_aw5pJarl_ht0Y"
];
let currentKeyIndex = 0;
let apiKey = apiKeys[currentKeyIndex];

function startTracking() {
  clearInterval(interval);
  tracking = true;
  videoId = document.getElementById("videoId").value.trim();
  targetViews = parseInt(document.getElementById("targetViews").value);
  const targetTimeString = document.getElementById("targetTime").value;

  if (!videoId || !targetViews || !targetTimeString) {
    alert("Please fill all fields.");
    return;
  }

  endTime = new Date(targetTimeString);

  updateStats();
  interval = setInterval(updateStats, 700);
}

function fetchWithKeyRotation(url, attempt = 0) {
  return fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("API quota may be exceeded.");
      return response.json();
    })
    .catch(error => {
      if (attempt < apiKeys.length - 1) {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        apiKey = apiKeys[currentKeyIndex];
        console.warn(`Switching to API Key ${currentKeyIndex + 1}`);
        const newUrl = url.replace(/key=[^&]+/, `key=${apiKey}`);
        return fetchWithKeyRotation(newUrl, attempt + 1);
      } else {
        console.error("All API keys exhausted.");
        throw error;
      }
    });
}

function updateStats() {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`;
  fetchWithKeyRotation(url).then(data => {
    if (!data.items || data.items.length === 0) {
      console.error("Video not found");
      return;
    }
    const viewCount = parseInt(data.items[0].statistics.viewCount);
    const currentTime = new Date();

    const timeLeftMinutes = Math.max(0, Math.floor((endTime - currentTime) / 60000));
    const viewsLeft = Math.max(0, targetViews - viewCount);

    document.getElementById("liveViews").innerText = viewCount.toLocaleString();
    document.getElementById("viewsLeft").innerText = viewsLeft.toLocaleString();

    const timeLeftString = timeLeftMinutes > 0 
      ? `${timeLeftMinutes}m ${(60 - currentTime.getSeconds()).toString().padStart(2, "0")}s` 
      : "0m 00s";
    document.getElementById("timeLeft").innerText = timeLeftString;

  }).catch(error => {
    console.error("Error fetching YouTube data:", error);
  });
}
