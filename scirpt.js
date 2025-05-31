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
  const targetViewStr = document.getElementById("targetViews").value.trim();
  const targetTimeStr = document.getElementById("targetTime").value;

  if (!videoId || !targetViewStr || !targetTimeStr) {
    alert("Please fill all fields.");
    return;
  }

  targetViews = parseInt(targetViewStr);
  endTime = new Date(targetTimeStr);

  if (isNaN(targetViews) || isNaN(endTime.getTime())) {
    alert("Invalid input.");
    return;
  }

  interval = setInterval(() => updateStats(videoId), 1000);
  updateStats(videoId);
}

function fetchWithRotation(url, attempt = 0) {
  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Quota exceeded or invalid response");
      return res.json();
    })
    .catch(err => {
      if (attempt < apiKeys.length - 1) {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        apiKey = apiKeys[currentKeyIndex];
        const newUrl = url.replace(/key=[^&]+/, `key=${apiKey}`);
        console.warn("Switching API key:", currentKeyIndex + 1);
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
      if (!data.items || data.items.length === 0) {
        console.error("Video not found or data missing");
        return;
      }

      const viewCount = parseInt(data.items[0].statistics.viewCount || 0);
      document.getElementById("liveViews").innerText = viewCount.toLocaleString();

      const viewsLeft = Math.max(0, targetViews - viewCount);
      const viewsLeftEl = document.getElementById("viewsLeft");
      viewsLeftEl.innerText = viewsLeft.toLocaleString();

      viewsLeftEl.className = viewsLeft === 0 ? "green" : "red";

      const now = new Date();
      const diffMin = Math.max(0, Math.floor((endTime - now) / 60000));
      const diffSec = Math.max(0, Math.floor((endTime - now) / 1000) % 60);
      document.getElementById("timeLeft").innerText = `${diffMin}:${diffSec.toString().padStart(2, "0")}`;

      if (viewsLeft === 0 && !alerted) {
        document.getElementById("doneSound").play();
        alerted = true;
      }
    })
    .catch(err => {
      console.error("Fetch error:", err.message);
    });
}
