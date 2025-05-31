let interval;
let apiKeys = [
  "AIzaSyBvVpO0WJB97BNO91RtqTIolLNmV66Qqt8",
  "AIzaSyBT5aGU-3R-jpP4HrGbvX4HBg0IB7IyvIQ",
  "AIzaSyBPbjeqqO6-JicHBUb0OWEubTujbXJtUV8",
  "AIzaSyDgFJ-2KbTEtO3aCIh6K_aw5pJarl_ht0Y"
];
let currentKeyIndex = 0;
let apiKey = apiKeys[currentKeyIndex];

let targetViews = 0;
let endTime;
let alerted = false;

function startTracking() {
  clearInterval(interval);
  alerted = false;

  const videoId = document.getElementById("videoId").value.trim();
  targetViews = parseInt(document.getElementById("targetViews").value);
  const targetTime = document.getElementById("targetTime").value;

  if (!videoId || !targetViews || !targetTime) {
    alert("Please fill all fields.");
    return;
  }

  endTime = new Date(targetTime);
  interval = setInterval(() => updateStats(videoId), 1000);
  updateStats(videoId);
}

function fetchWithRotation(url, attempt = 0) {
  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Quota exceeded or invalid response");
      return res.json();
    })
    .catch(() => {
      if (attempt < apiKeys.length - 1) {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        apiKey = apiKeys[currentKeyIndex];
        const newUrl = url.replace(/key=[^&]+/, `key=${apiKey}`);
        return fetchWithRotation(newUrl, attempt + 1);
      } else {
        throw new Error("All API keys failed");
      }
    });
}

function updateStats(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`;
  fetchWithRotation(url)
    .then(data => {
      const viewCount = parseInt(data.items[0].statistics.viewCount);
      document.getElementById("liveViews").innerText = viewCount.toLocaleString();

      const viewsLeft = Math.max(0, targetViews - viewCount);
      const viewsLeftEl = document.getElementById("viewsLeft");
      viewsLeftEl.innerText = viewsLeft.toLocaleString();

      // Color logic
      viewsLeftEl.className = viewsLeft === 0 ? "green" : "red";

      // Time left
      const now = new Date();
      const diffMin = Math.max(0, Math.floor((endTime - now) / 60000));
      const diffSec = Math.max(0, Math.floor((endTime - now) / 1000) % 60);
      document.getElementById("timeLeft").innerText = `${diffMin}:${diffSec.toString().padStart(2, "0")}`;

      // Sound when views left = 0
      if (viewsLeft === 0 && !alerted) {
        document.getElementById("doneSound").play();
        alerted = true;
      }
    })
    .catch(err => {
      console.error("Fetch failed:", err.message);
    });
}
