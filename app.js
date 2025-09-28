import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, set, push, onValue, onChildAdded, get, child } 
  from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const nameModal = document.getElementById("name-modal");
const nameInput = document.getElementById("name-input");
const m3u8Container = document.getElementById("m3u8-container");
const m3u8Input = document.getElementById("m3u8-input");
const nameBtn = document.getElementById("name-btn");
const mainContent = document.getElementById("main-content");
const video = document.getElementById("video");
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

let username = "Guest";
let isHost = false;

const roomId = "room1";
const roomRef = ref(db, `rooms/${roomId}`);
const videoRef = ref(db, `rooms/${roomId}/video`);
const chatRef = ref(db, `rooms/${roomId}/chat`);
const linkRef = ref(db, `rooms/${roomId}/link`);

// === Handle Name & M3U8 Input ===
nameBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const link = m3u8Input.value.trim();
  if (!name) return alert("Enter your name!");
  username = name;

  // Check if host exists
  const snapshot = await get(child(roomRef, "host"));
  if (!snapshot.exists()) {
    // Current user becomes host
    isHost = true;
    set(ref(db, `rooms/${roomId}/host`), username);
    if (!link) return alert("Host must enter M3U8 link!");
    set(linkRef, link);
  } else {
    // Guest: hide M3U8 input
    m3u8Container.style.display = "none";
  }

  // Hide modal & show main content
  nameModal.style.display = "none";
  mainContent.style.display = "block";

  // Load video from Firebase link
  onValue(linkRef, snap => {
    const m3u8Link = snap.val();
    if (!m3u8Link) return;
    loadM3U8(m3u8Link);
  });
});

// === Load M3U8 function ===
function loadM3U8(link) {
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(link);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (event, data) => console.error("HLS.js error:", data));
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = link;
  } else {
    alert("Your browser does not support HLS.");
  }
}

// === VIDEO SYNC ===
let isSyncing = false;

video.addEventListener("play", () => {
  if (!isSyncing) set(videoRef, { isPlaying: true, currentTime: video.currentTime });
});
video.addEventListener("pause", () => {
  if (!isSyncing) set(videoRef, { isPlaying: false, currentTime: video.currentTime });
});
video.addEventListener("seeked", () => {
  if (!isSyncing) set(videoRef, { isPlaying: !video.paused, currentTime: video.currentTime });
});

onValue(videoRef, snapshot => {
  const data = snapshot.val();
  if (!data) return;

  isSyncing = true;
  if (Math.abs(video.currentTime - data.currentTime) > 0.5) video.currentTime = data.currentTime;
  if (data.isPlaying && video.paused) video.play();
  if (!data.isPlaying && !video.paused) video.pause();
  isSyncing = false;
});

// === CHAT ===
sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", e => { if(e.key==="Enter") sendMessage(); });

function sendMessage() {
  const msg = chatInput.value.trim();
  if (!msg) return;
  const msgRef = push(chatRef);
  set(msgRef, { user: username, text: msg, timestamp: Date.now() });
  chatInput.value = "";
}

onChildAdded(chatRef, snapshot => {
  const msg = snapshot.val();
  if (!msg) return;
  const div = document.createElement("div");
  div.textContent = `${msg.user}: ${msg.text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});
