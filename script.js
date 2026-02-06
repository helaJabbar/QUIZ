let questions = [];
let erreurs = [];
let indexErreur = 0;


async function loadQuestions() {
  try {
    const response = await fetch("./q.json");
    if (!response.ok) throw new Error("Impossible de charger les questions !");
    questions = await response.json();
  } catch (err) {
    console.error(err);
    alert("Erreur lors du chargement des questions.");
  }
}
// ================== VARIABLES ==================
const userForm = document.getElementById("userForm");
const startBtn = document.getElementById("startBtn");
const quizContainer = document.getElementById("quizContainer");

let index = 0;
let score = 0;
let timerInterval;
let userAnswers = new Array(questions.length).fill(null);
let quizFinished = false;

let timeLeft;
let timerElapsed = 0; 

const questionEl = document.getElementById("question");
const choicesEl = document.getElementById("choices");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const progressEl = document.getElementById("progress");
const timerEl = document.getElementById("timer");

//====================Verification du formulaire=========
function verifierSaisie(firstName, lastName, dob) {

  if (!lastName || !firstName || !dob) {
    alert("Veuillez remplir tous les champs 😊");
    return false;
  }

  // ---- Contrôle : lettres + espaces uniquement ----
  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;

  if (!nameRegex.test(lastName)) {
    alert("Le nom doit contenir uniquement des lettres et des espaces ❌");
    return false;
  }

  if (!nameRegex.test(firstName)) {
    alert("Le prénom doit contenir uniquement des lettres et des espaces ❌");
    return false;
  }

  // ---- Contrôle : âge >= 10 ans ----
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (isNaN(age)) {
    alert("Veuillez entrer une date valide ❌");
    return false;
  }

  if (age < 10) {
    alert("L'âge doit être au moins 10 ans ❌");
    return false;
  }

  return true; // ✅ Tout est OK
}

// ================== DÉMARRER LE QUIZ ==================
startBtn.onclick = async (e) => {
  e.preventDefault();

  const lastName = document.getElementById("lastName").value.trim();
  const firstName = document.getElementById("firstName").value.trim();
  const dob = document.getElementById("dob").value;

  if (!verifierSaisie(firstName, lastName, dob)) {
    return;
  }  

  document.getElementById(
    "participantName"
  ).textContent = `${firstName} ${lastName}`;
  userForm.style.display = "none";
  quizContainer.style.display = "block";

  await loadQuestions();
  userAnswers = new Array(questions.length).fill(null); 
  startQuiz();
};

// ================== START QUIZ ==================

function startQuiz() {
  showQuestion();

  timeLeft = 5400; 

  timerInterval = setInterval(() => {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    timerEl.textContent = `Temps restant : ${minutes}m ${seconds}s`;

    timeLeft--;
    timerElapsed++;

    if (timeLeft < 0) {
      clearInterval(timerInterval);
      alert("⏰ Temps écoulé ! Le quiz est terminé.");
      calculateScore();
      endQuiz();
      quizFinished = true;
    }
  }, 1000);
}

// ================== AFFICHER QUESTION ==================
function showQuestion() {
  const q = questions[index];
  questionEl.textContent = q.q;
  progressEl.textContent = `Question ${index + 1} / ${questions.length}`;
  choicesEl.innerHTML = "";

  q.c.forEach((choice, i) => {
    const div = document.createElement("div");
    div.className = "choice";

    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "answer";
    input.value = i;

    if (userAnswers[index] === i) input.checked = true;

    label.appendChild(input);
    label.appendChild(
        document.createTextNode(" " + decodeHTML(choice))
      );
    div.appendChild(label);
    choicesEl.appendChild(div);
  });

  nextBtn.textContent = index === questions.length - 1 ? "Terminer" : "Suivant";
  prevBtn.style.display = index === 0 ? "none" : "inline-block";

  updateProgressBar();
}

// ================== BOUTONS ==================
nextBtn.onclick = () => {
  if (quizFinished) return;

  const answers = document.getElementsByName("answer");
  let selected = null;

  for (let i = 0; i < answers.length; i++) {
    if (answers[i].checked) {
      selected = parseInt(answers[i].value);
      break;
    }
  }

  if (selected === null) {
    alert("Choisis une réponse 😊");
    return;
  }

  userAnswers[index] = selected;

  if (index === questions.length - 1) {
    const unanswered = userAnswers.filter((ans) => ans === null);
    if (unanswered.length > 0) {
      alert(
        `Tu n'as pas répondu à toutes les questions. Il reste ${unanswered.length} questions !`
      );
      return;
    } else {
      clearInterval(timerInterval);
      calculateScore();
      endQuiz();
      quizFinished = true;
    }
  } else {
    index++;
    showQuestion();
  }
};

prevBtn.onclick = () => {
  if (quizFinished) return;
  if (index > 0) {
    index--;
    showQuestion();
  }
};

// ================== CALCULER SCORE ==================
function calculateScore() {
    erreurs = []; // reset
  
    score = userAnswers.reduce((acc, ans, i) => {
      if (ans === questions[i].a) {
        return acc + 1;
      } else {
        erreurs.push(i); // stocke l'index de l'erreur
        return acc;
      }
    }, 0);
  }
  

// ================== BARRE DE PROGRESSION ==================
function updateProgressBar() {
  const bar = document.getElementById("progressBar");
  bar.innerHTML = "";

  for (let i = 0; i < questions.length; i++) {
    const sq = document.createElement("div");
    sq.className = "progressSquare";

    if (userAnswers[i] !== null) sq.classList.add("answered");
    if (i === index) sq.style.border = "2px solid #f49f20";
    else sq.style.border = "none";

    sq.onclick = () => {
      if (quizFinished) return;
      index = i;
      showQuestion();
    };

    bar.appendChild(sq);
  }
}

// ================== FIN DU QUIZ ==================
function endQuiz() {
  const scoreMinimum = 2; 
  const participantName =
    document.getElementById("participantName").textContent;

  const progressBar = document.getElementById("progressBar");
  if (progressBar) progressBar.style.display = "none";

  let isWinner = score >= scoreMinimum;
  let statusClass = isWinner ? "success" : "fail";
  let icon = isWinner ? "🎉" : "❌";
  let message = isWinner
    ? "Félicitations ! Vous avez validé l'épreuve 👏"
    : "Désolé, vous n'avez pas atteint le score minimum. Continuez à vous entraîner 💪";

  // On vide le quiz
  document.querySelector(".quiz").innerHTML = `
  <div class="quiz-result ${statusClass}">
    ${isWinner ? '<canvas id="confettiCanvas"></canvas>' : ""}
    <div class="icon">${icon}</div>
    <p class="nom"><strong>${participantName}</strong></p>
    <p class="score">
      Score : <strong>${score} / ${questions.length}</strong>
    </p>
    <p class="time">
      Temps utilisé : <strong>${formatTime(timerElapsed)}</strong>
    </p>
    <p class="message">${message}</p>

    <div class="result-buttons">
      <button class="btn" onclick="voirErreurs()">📘 Voir mes erreurs</button>

      ${
        isWinner
          ? '<button class="btn" onclick="voirCertificat()">🎓 Voir mon certificat</button>'
          : ""
      }
    </div>
  </div>

  <div id="correctionMode" style="display:none"></div>
  <div id="certificateMode" style="display:none"></div>
`;


  clearInterval(timerInterval);

  if (isWinner) startConfetti();
}

// Fonction pour formater le temps en mm:ss
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}m ${sec}s`;
}

// ================== SECURISER LE QUIZ ==================
window.addEventListener("beforeunload", function (e) {
  if (!quizFinished) {
    e.preventDefault();
    e.returnValue =
      "⚠️ Attention, vos réponses ne seront pas sauvegardées si vous quittez !";
  }
});
//===========================Confetti js ===========================
function startConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const confettiCount = 150;
  const confetti = [];

  for (let i = 0; i < confettiCount; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * confettiCount,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      tilt: Math.random() * 10 - 10,
      tiltAngleIncremental: Math.random() * 0.07 + 0.05,
      tiltAngle: 0,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confetti.forEach((c) => {
      ctx.beginPath();
      ctx.lineWidth = c.r;
      ctx.strokeStyle = c.color;
      ctx.moveTo(c.x + c.tilt + c.r / 2, c.y);
      ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r / 2);
      ctx.stroke();
    });
    update();
  }

  function update() {
    confetti.forEach((c) => {
      c.tiltAngle += c.tiltAngleIncremental;
      c.y += (Math.cos(c.d) + 3 + c.r / 2) * 0.5;
      c.x += Math.sin(c.d);
      c.tilt = Math.sin(c.tiltAngle) * 15;

      if (c.y > canvas.height) {
        c.y = -10;
        c.x = Math.random() * canvas.width;
      }
    });
  }

  setInterval(draw, 20);
}
//====================================Erreurs================================
function voirErreurs() {
    if (erreurs.length === 0) {
      alert("🎉 Bravo ! Aucune erreur !");
      return;
    }
  
    document.querySelector(".quiz-result").style.display = "none";
  
    const zone = document.getElementById("correctionMode");
    zone.style.display = "block";
  
    indexErreur = 0; // commencer à la première erreur
    afficherErreur(indexErreur);
  }

  function afficherErreur(pos) {
    const zone = document.getElementById("correctionMode");
  
    const i = erreurs[pos]; // index réel de la question
    const q = questions[i];
  
    let choixHTML = "";
  
    q.c.forEach((choice, indexChoix) => {
      let classe = "";
  
      if (indexChoix === q.a) classe = "correct-review";
      if (userAnswers[i] === indexChoix && userAnswers[i] !== q.a)
        classe = "wrong-review";
  
      choixHTML += `
        <div class="choice-item ${classe}">
          <input type="radio" disabled ${
            userAnswers[i] === indexChoix ? "checked" : ""
          }>
          ${typeof choice === "string" ? choice : choice.text}
        </div>
      `;
    });
  
    zone.innerHTML = `
      <h3>📘 Mes erreurs</h3>
  
      <div class="erreur-card">
        <div class="question-container">
          <img src="engrenage.png" class="question-img" alt="question">
          <p id="questionCorrection">${q.q}</p>
        </div>
  
        <div id="choicesCorrection">
          ${choixHTML}
        </div>
  
        <div class="nav-erreurs-footer">
          <button class="btn" onclick="prevErreur()" ${pos === 0 ? "disabled" : ""}>⬅ Précédent</button>
          <span>Erreur ${pos + 1} / ${erreurs.length}</span>
          <button class="btn" onclick="nextErreur()" ${pos === erreurs.length - 1 ? "disabled" : ""}>Suivant ➡</button>
        </div>
        <div style="text-align:center; margin-top:20px">
        <button class="btn" onclick="retourResultat()">⬅ Retour</button>
      </div>
      </div>

      
    `;
  }
  function nextErreur() {
    if (indexErreur < erreurs.length - 1) {
      indexErreur++;
      afficherErreur(indexErreur);
    }
  }
  
  function prevErreur() {
    if (indexErreur > 0) {
      indexErreur--;
      afficherErreur(indexErreur);
    }
  }
      
  function retourResultat() {
    document.getElementById("correctionMode").style.display = "none";
    document.getElementById("certificateMode").style.display = "none";
    document.querySelector(".quiz-result").style.display = "block";
  }
  
  function decodeHTML(str) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
  }
//===============================Certificat =============================
function voirCertificat() {
    const certDiv = document.getElementById("certificateMode");
    certDiv.style.display = "block";
  
    document.querySelector(".quiz-result").style.display = "none";
  
    const name = document.getElementById("participantName").textContent;
  
    certDiv.innerHTML = `
      <div class="certificate-container">
        <img src="./certif.png" class="certificat-bg" alt="Certificat">
  
        <div class="certificat-name">${name}</div>
  
        <button class="btn btn-certif" onclick="retourResultat()">⬅ Retour</button>
      </div>
    `;
  }
  
  //=============================================================
  function retourResultat() {
    document.getElementById("correctionMode").style.display = "none";
    document.getElementById("certificateMode").style.display = "none";
    document.querySelector(".quiz-result").style.display = "block";
  }
  
