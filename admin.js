// ================= FIREBASE AUTH =================
const auth = firebase.auth();
console.log("✅ admin.js loaded");

// ================= ELEMENTS =================
const loginBox = document.getElementById("loginBox");
const adminPanel = document.getElementById("adminPanel");
const tableBody = document.getElementById("results-table");
const subjectFilter = document.getElementById("subjectFilter");

// ================= DATA STORE =================
let allResults = [];

// ================= FORCE LOGOUT ON REFRESH =================
// 🔥 This ensures: refresh => login again


// ================= LOGIN FUNCTION =================
function loginAdmin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      console.log("✅ Login successful");
    })
    .catch(err => {
      alert("❌ Login Failed");
      console.error(err);
    });
}

// ================= AUTH STATE =================
auth.onAuthStateChanged(user => {
  if (user) {
    console.log("🔓 Authenticated:", user.email);

    loginBox.style.display = "none";
    adminPanel.style.display = "block";

    loadResults(); // load data AFTER login
  } else {
    console.log("🔒 Not authenticated");

    loginBox.style.display = "block";
    adminPanel.style.display = "none";
  }
});

// ================= LOAD FIRESTORE DATA =================
function loadResults() {
  db.collection("testResults").orderBy("date", "desc").get()
    .then(snapshot => {

      allResults = [];
      tableBody.innerHTML = "";

      snapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;
        allResults.push(data);
      });

      renderTable(allResults);
      fillSubjectFilter(allResults);

    })
    .catch(error => {
      console.error("❌ Firestore error:", error);
      alert("Firestore permission error");
    });
}

// ================= RENDER TABLE =================
function renderTable(results) {
  tableBody.innerHTML = "";

  results.forEach(r => {
    const subject = r.subject || r.testTitle || r.course || "N/A";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.name}</td>
      <td>${subject}</td>
      <td>${r.score}%</td>
      <td>${r.date?.seconds ? new Date(r.date.seconds * 1000).toLocaleString() : ""}</td>
      <td>
        <button onclick="viewResult('${r.id}')">View</button>
        <button onclick="deleteResult('${r.id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// ================= SUBJECT FILTER =================
function fillSubjectFilter(results) {
  const set = new Set();

  results.forEach(r => {
    const subject = r.subject || r.testTitle || r.course;
    if (subject) set.add(subject);
  });

  subjectFilter.innerHTML = `<option value="all">All Subjects</option>`;

  set.forEach(sub => {
    const opt = document.createElement("option");
    opt.value = sub;
    opt.textContent = sub;
    subjectFilter.appendChild(opt);
  });
}

subjectFilter.addEventListener("change", () => {
  const value = subjectFilter.value;

  if (value === "all") {
    renderTable(allResults);
  } else {
    renderTable(
      allResults.filter(r =>
        (r.subject || r.testTitle || r.course) === value
      )
    );
  }
});

// ================= VIEW RESULT =================
window.viewResult = function (id) {
  const r = allResults.find(x => x.id === id);
  if (!r) return alert("Result not found");

  let html = `
    <h3>${r.name}</h3>
    <p><strong>Subject:</strong> ${r.subject || r.testTitle}</p>
    <p><strong>Score:</strong> ${r.score}%</p>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:20px 0;">
      <div style="padding:15px;background:#e8f5e9;border:2px solid #4CAF50;">
        <strong>${r.correct}</strong><br>Correct
      </div>
      <div style="padding:15px;background:#ffebee;border:2px solid #f44336;">
        <strong>${r.wrong}</strong><br>Wrong
      </div>
      <div style="padding:15px;background:#f5f5f5;border:2px solid #9e9e9e;">
        <strong>${r.unattempted}</strong><br>Unattempted
      </div>
      <div style="padding:15px;background:#e3f2fd;border:2px solid #2196F3;">
        <strong>${r.total}</strong><br>Total
      </div>
    </div>

    <hr>
    <h3>📋 Question Review</h3>
  `;

  if (r.questions && r.questions.length) {
    r.questions.forEach((q, i) => {
      html += `
        <div style="
          padding:15px;
          margin-bottom:15px;
          border-left:5px solid ${q.status === 'correct' ? '#4CAF50' : '#f44336'};
          background:#f9f9f9;
        ">
          <strong>Q${i + 1}:</strong> ${q.question}<br><br>
          <strong>Your Answer:</strong> ${q.userAnswer || 'Not Attempted'}<br>
          <strong>Correct Answer:</strong> ${q.correctAnswer}<br>
          <strong>Status:</strong> ${q.status}
        </div>
      `;
    });
  } else {
    html += `<p>No question data found.</p>`;
  }

  document.getElementById("resultModalContent").innerHTML = html;
  document.getElementById("resultModal").style.display = "block";
};



// ================= DELETE RESULT =================
window.deleteResult = function (id) {
  if (!confirm("Delete this result?")) return;

  db.collection("testResults").doc(id).delete()
    .then(() => {
      alert("Deleted");
      loadResults();
    })
    .catch(err => console.error(err));
};


function closeModal() {
  document.getElementById("resultModal").style.display = "none";
}
