import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, set, push, onValue, onChildAdded } 
  from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// User name
let username = "Guest";

// Elements
const nameModal = document.getElementById("name-modal");
const nameInput = document.getElementById("name-input");
const nameBtn = document.getElementById("name-btn");
const mainContent = document.getElementById("main-content");
const video = document.getElementById("video");
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

// Room setup
const roomId = "room1";
const videoRef = ref(db, `rooms/${roomId}/video`);
const chatRef = ref(db, `rooms/${roomId}/chat`);

// === M3U8 Setup ===
const m3u8Link = "https://pothabattulavinod.github.io/pay/aay.m3u8"; // Replace with your .m3u8 link
if (Hls.isSupported()) {
  const hls = new Hls();
  hls.loadSource(m3u8Link);
  hls.attachMedia(video);
} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
  video.src = m3u8Link;
}

// === Handle Name Input ===
nameBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (!name) return alert("Please enter a name!");
  username = name;
  nameModal.style.display = "none";
  mainContent.style.display = "block";
});

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

  if (Math.abs(video.currentTime - data.currentTime) > 0.5) {
    video.currentTime = data.currentTime;
  }

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
