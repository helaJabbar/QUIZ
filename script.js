let questions = [];

async function loadQuestions() {
  try {
    const response = await fetch("questions.json");
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
let timerElapsed = 0; // <-- temps écoulé en secondes

const questionEl = document.getElementById("question");
const choicesEl = document.getElementById("choices");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const progressEl = document.getElementById("progress");
const timerEl = document.getElementById("timer");

// ================== DÉMARRER LE QUIZ ==================
startBtn.onclick = async (e) => {
  e.preventDefault();

  const lastName = document.getElementById("lastName").value.trim();
  const firstName = document.getElementById("firstName").value.trim();
  const dob = document.getElementById("dob").value;

  if (!lastName || !firstName || !dob) {
    alert("Veuillez remplir tous les champs 😊");
    return;
  }

  document.getElementById(
    "participantName"
  ).textContent = `${firstName} ${lastName}`;
  userForm.style.display = "none";
  quizContainer.style.display = "block";

  await loadQuestions();
  userAnswers = new Array(questions.length).fill(null); // maintenant correct
  startQuiz();
};

// ================== START QUIZ ==================

function startQuiz() {
  showQuestion();

  timeLeft = 5400; // 90 min en sec

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
    label.appendChild(document.createTextNode(" " + choice));
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
  score = userAnswers.reduce((acc, ans, i) => {
    if (ans === questions[i].a) return acc + 1;
    return acc;
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
  const scoreMinimum = 25; // score minimum pour valider
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
        <p class="score">Score : <strong>${score} / ${
    questions.length
  }</strong></p>
        <p class="time">Temps utilisé : <strong>${formatTime(
          timerElapsed
        )}</strong></p>
        <p class="message">${message}</p>
      </div>
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
