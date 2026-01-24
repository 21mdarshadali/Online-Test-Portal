let allResults = [];
let chart;

const subjectFilter = document.getElementById("subjectFilter");
const batchFilter = document.getElementById("batchFilter");
const nameFilter = document.getElementById("nameFilter");
const ctx = document.getElementById("scoreChart").getContext("2d");

// 🔥 LOAD DATA FROM FIREBASE
db.collection("testResults").get().then(snapshot => {

  snapshot.forEach(doc => {
    allResults.push(doc.data());
  });

  fillFilters();
  drawChart(allResults);
});

// 🔹 Fill dropdowns
function fillFilters() {

  const subjects = new Set();
  const batches = new Set();
  const names = new Set();

  allResults.forEach(r => {
    if (r.subject) subjects.add(r.subject);
    if (r.batch) batches.add(r.batch);
    if (r.name) names.add(r.name);
  });

  subjects.forEach(s => subjectFilter.innerHTML += `<option value="${s}">${s}</option>`);
  batches.forEach(b => batchFilter.innerHTML += `<option value="${b}">${b}</option>`);
  names.forEach(n => nameFilter.innerHTML += `<option value="${n}">${n}</option>`);
}

// 🔹 Apply filters
subjectFilter.onchange =
batchFilter.onchange =
nameFilter.onchange = applyFilters;

function applyFilters() {

  let filtered = [...allResults];

  if (subjectFilter.value !== "all")
    filtered = filtered.filter(r => r.subject === subjectFilter.value);

  if (batchFilter.value !== "all")
    filtered = filtered.filter(r => r.batch === batchFilter.value);

  if (nameFilter.value !== "all")
    filtered = filtered.filter(r => r.name === nameFilter.value);

  drawChart(filtered);
}

// 🔹 Draw graph
function drawChart(data) {

  const labels = data.map(d => d.name);
  const scores = data.map(d => d.score);

  // ----- SUMMARY -----
  document.getElementById("totalStudents").innerText = data.length;

  if (data.length > 0) {
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const avg = (scores.reduce((a,b)=>a+b,0) / scores.length).toFixed(1);

    document.getElementById("highestScore").innerText = max + "%";
    document.getElementById("lowestScore").innerText = min + "%";
    document.getElementById("averageScore").innerText = avg + "%";
  } else {
    document.getElementById("highestScore").innerText = "0%";
    document.getElementById("lowestScore").innerText = "0%";
    document.getElementById("averageScore").innerText = "0%";
  }

  // ----- TABLE -----
  const tbody = document.getElementById("resultTable");
  tbody.innerHTML = "";

  data.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.name}</td>
      <td>${r.subject}</td>
      <td>${r.batch}</td>
      <td><b>${r.score}%</b></td>
      <td>${new Date(r.date.seconds ? r.date.seconds*1000 : r.date).toLocaleDateString()}</td>
    `;
    tbody.appendChild(tr);
  });

  // ----- GRAPH -----
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Score (%)",
        data: scores,
        backgroundColor: "#4361ee"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}
