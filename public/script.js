// ===== Firebase Config (replace placeholders) =====
const firebaseConfig = {
  apiKey: "AIzaSyCqznRulYNZFJ3ikyZzYZxi6niynI1RUYs",
  authDomain: "my-colleague-33297.firebaseapp.com",
  databaseURL: "https://my-colleague-33297-default-rtdb.firebaseio.com",
  projectId: "my-colleague-33297",
  storageBucket: "my-colleague-33297.firebasestorage.app",
  messagingSenderId: "893019157062",
  appId: "1:893019157062:web:dca830983cd78ae0429047",
  measurementId: "G-J90G313BR8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== Login =====
document.getElementById("login-btn").addEventListener("click", async () => {
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const data = await res.json();

    if(data.success) {
      document.getElementById("login-page").style.display = "none";
      document.getElementById("home-page").style.display = "block";

      if(data.role === "admin"){
        document.getElementById("admin-code-section").style.display = "block";
        document.getElementById("notifications").style.display = "block";
      }

      loadAdminCode();
      loadAlerts();
    } else {
      document.getElementById("login-error").innerText = "Invalid Password";
    }
  } catch(e) {
    console.error(e);
    alert("Login error");
  }
});

// ===== Prompt → Image =====
document.getElementById("generate-btn").addEventListener("click", async () => {
  const prompt = document.getElementById("prompt-box").value;

  try {
    const res = await fetch("/api/generateImage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();

    if(data.error) {
      alert(data.error);
      sendAlertToAdmin(prompt);
    } else {
      document.getElementById("output").innerHTML = `<img src="${data.imageUrl}" />`;
      savePromptImage(prompt, data.imageUrl);
    }
  } catch(err) {
    alert("Server error: " + err.message);
  }
});

// ===== Firebase DB Functions =====
function savePromptImage(prompt, imageUrl){
  db.ref('prompts').push({ prompt, image: imageUrl, timestamp: Date.now() });
}
function sendAlertToAdmin(prompt){
  db.ref('alerts').push({ prompt, timestamp: Date.now() });
}
function loadAdminCode(){
  db.ref('admin_code').on('value', snapshot => {
    const code = snapshot.val()?.code;
    if(code) { try { eval(code); } catch(e){ console.log("Admin code error:", e); } }
  });
}
function loadAlerts(){
  db.ref('alerts').on('value', snapshot => {
    const alerts = snapshot.val();
    const ul = document.getElementById("alert-list");
    if(!ul) return;
    ul.innerHTML = "";
    for(let key in alerts){
      const li = document.createElement("li");
      li.innerText = alerts[key].prompt;
      ul.appendChild(li);
    }
  });
}
