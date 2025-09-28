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

// === Handle Name Input ===
nameBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (!name) return alert("Please enter a name!");
  username = name;
  nameModal.style.display = "none";
  mainContent.style.display = "block";
});

// === VIDEO SYNC ===
// Update Firebase when local user plays/pauses/seeks
video.addEventListener("play", () => set(videoRef, { isPlaying: true, currentTime: video.currentTime }));
video.addEventListener("pause", () => set(videoRef, { isPlaying: false, currentTime: video.currentTime }));
video.addEventListener("seeked", () => set(videoRef, { isPlaying: !video.paused, currentTime: video.currentTime }));

// Listen for video updates from Firebase
onValue(videoRef, snapshot => {
  const data = snapshot.val();
  if (!data) return;

  // Sync playback
  if (data.isPlaying && video.paused) {
    video.currentTime = data.currentTime;
    video.play();
  } else if (!data.isPlaying && !video.paused) {
    video.currentTime = data.currentTime;
    video.pause();
  }
});

// === CHAT ===
// Send chat message
sendBtn.addEventListener("click", () => {
  const msg = chatInput.value.trim();
  if (!msg) return;

  const msgRef = push(chatRef);
  set(msgRef, {
    user: username,
    text: msg,
    timestamp: Date.now()
  });

  chatInput.value = "";
});

// Listen for new chat messages
onChildAdded(chatRef, snapshot => {
  const msg = snapshot.val();
  const div = document.createElement("div");
  div.textContent = `${msg.user}: ${msg.text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});
