import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, set, push, onValue, onChildAdded } 
  from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Room setup (for demo purposes, a single room)
const roomId = "room1";
const videoRef = ref(db, `rooms/${roomId}/video`);
const chatRef = ref(db, `rooms/${roomId}/chat`);

// VIDEO SYNC
const video = document.getElementById("video");

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

// CHAT
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

// Send chat message
sendBtn.addEventListener("click", () => {
  const msg = chatInput.value.trim();
  if (!msg) return;

  const msgRef = push(chatRef);
  set(msgRef, {
    user: "Guest",
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
