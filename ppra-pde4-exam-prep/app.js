const state = {
  data: null,
  view: "home",
  isPro: false,
  answers: JSON.parse(localStorage.getItem("ppra:answers") || "{}"),
  sessions: JSON.parse(localStorage.getItem("ppra:sessions") || "[]"),
  quiz: null,
  billing: {
    config: null,
    configured: false,
    loading: true,
    status: "Checking billing...",
    offerings: null,
    currentPackage: null,
    lastError: "",
  },
};

const views = {
  home: document.querySelector("#homeView"),
  topics: document.querySelector("#topicsView"),
  quiz: document.querySelector("#quizView"),
  results: document.querySelector("#resultsView"),
  progress: document.querySelector("#progressView"),
  upgrade: document.querySelector("#upgradeView"),
  profile: document.querySelector("#profileView"),
};

const title = document.querySelector("#viewTitle");
const planLabel = document.querySelector("#planLabel");
const restoreButton = document.querySelector("#restoreButton");

function saveState() {
  localStorage.setItem("ppra:answers", JSON.stringify(state.answers));
  localStorage.setItem("ppra:sessions", JSON.stringify(state.sessions));
}

function getPurchasesPlugin() {
  return window.Capacitor?.Plugins?.Purchases || null;
}

function getPlatform() {
  return window.Capacitor?.getPlatform?.() || "web";
}

function hasActiveEntitlement(customerInfo) {
  const entitlementId = state.billing.config?.entitlementId || "pro_access";
  return Boolean(customerInfo?.entitlements?.active?.[entitlementId]);
}

async function initBilling() {
  state.billing.loading = true;
  try {
    const config = await fetch("assets/revenuecat-config.json").then((response) => response.json());
    state.billing.config = config;

    const purchases = getPurchasesPlugin();
    const apiKey = config.androidApiKey?.trim();
    if (!purchases || getPlatform() !== "android") {
      state.billing.status = "Billing is available in the Android build.";
      state.billing.loading = false;
      render();
      return;
    }
    if (!apiKey) {
      state.billing.status = "RevenueCat Android API key missing.";
      state.billing.loading = false;
      render();
      return;
    }

    await purchases.configure({ apiKey, appUserID: null });
    state.billing.configured = true;
    state.billing.status = "RevenueCat connected.";
    await refreshCustomerInfo();
    await loadOfferings();
  } catch (error) {
    state.billing.lastError = error.message || String(error);
    state.billing.status = "Billing setup needs attention.";
  } finally {
    state.billing.loading = false;
    render();
  }
}

async function refreshCustomerInfo() {
  const purchases = getPurchasesPlugin();
  if (!state.billing.configured || !purchases) return;
  const { customerInfo } = await purchases.getCustomerInfo();
  state.isPro = hasActiveEntitlement(customerInfo);
  state.billing.status = state.isPro ? "Pro subscription active." : "Free plan active.";
}

async function loadOfferings() {
  const purchases = getPurchasesPlugin();
  if (!state.billing.configured || !purchases) return;
  const offerings = await purchases.getOfferings();
  const offeringId = state.billing.config?.offeringId || "default";
  const offering = offerings.current || offerings.all?.[offeringId] || Object.values(offerings.all || {})[0];
  const packages = offering?.availablePackages || [];
  state.billing.offerings = offerings;
  state.billing.currentPackage = packages[0] || null;
}

function packageLabel(aPackage) {
  const product = aPackage?.product;
  const price = product?.priceString || product?.price?.formatted || "price from Play Store";
  const titleText = product?.title || aPackage?.identifier || "Pro subscription";
  return `${titleText} - ${price}`;
}

async function purchasePro() {
  const purchases = getPurchasesPlugin();
  if (!state.billing.configured || !purchases) {
    state.billing.lastError = "Add your RevenueCat Android API key, sync Android, then test on a Play-enabled Android build.";
    renderUpgrade();
    return;
  }
  try {
    if (!state.billing.currentPackage) await loadOfferings();
    if (!state.billing.currentPackage) throw new Error("No RevenueCat offering package found. Check product/offering setup.");
    const result = await purchases.purchasePackage({ aPackage: state.billing.currentPackage });
    state.isPro = hasActiveEntitlement(result.customerInfo);
    state.billing.status = state.isPro ? "Pro subscription active." : "Purchase completed, but Pro entitlement is not active yet.";
    state.billing.lastError = "";
  } catch (error) {
    state.billing.lastError = error.message || String(error);
  }
  render();
}

async function restorePurchases() {
  const purchases = getPurchasesPlugin();
  if (!state.billing.configured || !purchases) {
    state.billing.lastError = "Restore purchases works inside the configured Android build.";
    render();
    return;
  }
  try {
    const { customerInfo } = await purchases.restorePurchases();
    state.isPro = hasActiveEntitlement(customerInfo);
    state.billing.status = state.isPro ? "Purchase restored. Pro active." : "No active Pro purchase found.";
    state.billing.lastError = "";
  } catch (error) {
    state.billing.lastError = error.message || String(error);
  }
  render();
}

function setView(view) {
  state.view = view;
  Object.entries(views).forEach(([name, element]) => element.classList.toggle("active", name === view));
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  title.textContent = {
    home: "Dashboard",
    topics: "Topic Selection",
    quiz: "Quiz",
    results: "Session Results",
    progress: "Progress",
    upgrade: "Upgrade to Pro",
    profile: "Settings",
  }[view];
  render();
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function visibleQuestions() {
  if (state.isPro) return state.data.questions;
  return state.data.questions.filter((question) => question.id <= state.data.freeQuestionLimit);
}

function sectionStats(sectionName) {
  const questions = state.data.questions.filter((question) => question.section === sectionName);
  const answered = questions.filter((question) => state.answers[question.id]);
  const correct = answered.filter((question) => state.answers[question.id]?.correct).length;
  const percent = answered.length ? Math.round((correct / answered.length) * 100) : 0;
  return { total: questions.length, answered: answered.length, correct, percent };
}

function allStats() {
  const answered = Object.values(state.answers);
  const correct = answered.filter((answer) => answer.correct).length;
  const percent = answered.length ? Math.round((correct / answered.length) * 100) : 0;
  const unlocked = visibleQuestions().length;
  return { answered: answered.length, correct, percent, unlocked };
}

function startQuiz(config) {
  const pool = state.data.questions.filter((question) => {
    if (!state.isPro && question.id > state.data.freeQuestionLimit) return false;
    if (config.section) return question.section === config.section;
    return true;
  });

  if (!pool.length) {
    setView("upgrade");
    return;
  }

  const count = Math.min(config.count || 10, pool.length);
  state.quiz = {
    mode: config.mode || "practice",
    section: config.section || "Mixed",
    startedAt: Date.now(),
    index: 0,
    selected: null,
    score: 0,
    items: shuffle(pool).slice(0, count).map((question) => ({
      ...question,
      optionOrder: ["A", "B", "C", "D"],
      chosen: null,
    })),
  };
  setView("quiz");
}

function answerCurrent(choice) {
  const item = state.quiz.items[state.quiz.index];
  if (item.chosen) return;
  item.chosen = choice;
  const isCorrect = choice === item.correct;
  if (isCorrect) state.quiz.score += 1;
  state.answers[item.id] = {
    chosen: choice,
    correct: isCorrect,
    section: item.section,
    answeredAt: new Date().toISOString(),
  };
  saveState();
  renderQuiz();
}

function nextQuestion() {
  if (state.quiz.index < state.quiz.items.length - 1) {
    state.quiz.index += 1;
    renderQuiz();
    return;
  }

  const total = state.quiz.items.length;
  const session = {
    id: Date.now(),
    mode: state.quiz.mode,
    section: state.quiz.section,
    total,
    score: state.quiz.score,
    percent: Math.round((state.quiz.score / total) * 100),
    minutes: Math.max(1, Math.round((Date.now() - state.quiz.startedAt) / 60000)),
    completedAt: new Date().toISOString(),
  };
  state.sessions.unshift(session);
  state.sessions = state.sessions.slice(0, 25);
  saveState();
  setView("results");
}

function render() {
  planLabel.textContent = state.isPro ? "Pro active" : "Free plan";
  restoreButton.disabled = state.billing.loading;
  if (!state.data) return;
  renderHome();
  renderTopics();
  renderProgress();
  renderUpgrade();
  renderProfile();
  if (state.quiz) renderQuiz();
  renderResults();
}

function renderHome() {
  const stats = allStats();
  const latest = state.sessions[0];
  const weakSections = [...state.data.sections]
    .map((section) => ({ ...section, ...sectionStats(section.name) }))
    .filter((section) => section.answered > 0)
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 3);

  views.home.innerHTML = `
    <div class="grid">
      <div class="card metric"><span>Questions unlocked</span><strong>${stats.unlocked}</strong></div>
      <div class="card metric"><span>Answered</span><strong>${stats.answered}</strong></div>
      <div class="card metric"><span>Accuracy</span><strong>${stats.percent}%</strong></div>
      <div class="card metric"><span>Sessions</span><strong>${state.sessions.length}</strong></div>
    </div>
    <div class="two-column" style="margin-top:18px">
      <div class="card">
        <h2>Quick Start</h2>
        <p>Practise a short mixed session, focus on weak areas, or run a timed exam-style session.</p>
        <div class="actions">
          <button class="primary-button" data-action="quick">10-question practice</button>
          <button class="secondary-button" data-action="weak">Weak areas</button>
          <button class="ghost-button" data-action="topics">Choose topic</button>
        </div>
      </div>
      <div class="card">
        <h2>Coach Summary</h2>
        ${latest ? `<p>Your latest session was <strong>${latest.percent}%</strong> on ${latest.section}. ${latest.percent >= 75 ? "Good pass-level work. Keep consolidating." : "Focus on accuracy before increasing speed."}</p>` : "<p>No sessions yet. Start with a short practice set so we can build your profile.</p>"}
        ${weakSections.length ? `<p><strong>Weakest sections:</strong> ${weakSections.map((s) => `${s.name} (${s.percent}%)`).join(", ")}</p>` : "<p>Weak areas will appear once you answer a few questions.</p>"}
      </div>
    </div>
  `;

  views.home.querySelector('[data-action="quick"]').addEventListener("click", () => startQuiz({ count: 10, mode: "practice" }));
  views.home.querySelector('[data-action="weak"]').addEventListener("click", startWeakQuiz);
  views.home.querySelector('[data-action="topics"]').addEventListener("click", () => setView("topics"));
}

function renderTopics() {
  const rows = state.data.sections
    .map((section) => {
      const stats = sectionStats(section.name);
      const locked = !state.isPro && !state.data.questions.some((q) => q.section === section.name && q.id <= state.data.freeQuestionLimit);
      return `
        <button class="topic-card ${locked ? "locked" : ""}" data-section="${section.name}" ${locked ? 'data-locked="true"' : ""}>
          <h3>${section.name}</h3>
          <div class="topic-meta">
            <span class="pill">${section.count} questions</span>
            <span class="pill ${stats.percent >= 75 ? "good" : stats.answered ? "warn" : ""}">${stats.percent}% correct</span>
          </div>
          <div class="progress-bar"><span style="width:${Math.min(100, Math.round((stats.answered / section.count) * 100))}%"></span></div>
        </button>
      `;
    })
    .join("");

  views.topics.innerHTML = `
    ${!state.isPro ? '<div class="notice">Free mode unlocks the first 50 questions. Upgrade to Pro through Google Play to unlock all 750.</div>' : ""}
    <div class="topic-grid" style="margin-top:14px">${rows}</div>
  `;

  views.topics.querySelectorAll(".topic-card").forEach((card) => {
    card.addEventListener("click", () => {
      if (card.dataset.locked) {
        setView("upgrade");
        return;
      }
      startQuiz({ section: card.dataset.section, count: 12, mode: "practice" });
    });
  });
}

function renderQuiz() {
  const quiz = state.quiz;
  const item = quiz.items[quiz.index];
  const answered = Boolean(item.chosen);
  const progress = Math.round(((quiz.index + 1) / quiz.items.length) * 100);
  const optionButtons = item.optionOrder
    .map((key) => {
      let klass = "";
      if (answered && key === item.correct) klass = "correct";
      if (answered && key === item.chosen && key !== item.correct) klass = "wrong";
      return `<button class="option-button ${klass}" data-choice="${key}"><strong>${key}.</strong> ${item.options[key]}</button>`;
    })
    .join("");

  views.quiz.innerHTML = `
    <div class="question-card">
      <div class="quiz-meta">
        <span class="pill">${quiz.section}</span>
        <span class="pill">Question ${quiz.index + 1} of ${quiz.items.length}</span>
        <span class="pill">${progress}% complete</span>
      </div>
      <div class="progress-bar" style="margin:14px 0 20px"><span style="width:${progress}%"></span></div>
      <p class="question-text">${item.question}</p>
      <div class="options">${optionButtons}</div>
      <div class="explanation ${answered ? "visible" : ""}">
        <strong>${answered && item.chosen === item.correct ? "Correct." : "Correct answer: " + item.correct + "."}</strong>
        ${item.explanation || "No explanation supplied for this question yet."}
      </div>
      <div class="actions">
        <button class="primary-button" data-next ${answered ? "" : "disabled"}>${quiz.index === quiz.items.length - 1 ? "Finish Session" : "Next Question"}</button>
        <button class="ghost-button" data-exit>Exit</button>
      </div>
    </div>
  `;

  views.quiz.querySelectorAll(".option-button").forEach((button) => {
    button.addEventListener("click", () => answerCurrent(button.dataset.choice));
  });
  views.quiz.querySelector("[data-next]").addEventListener("click", nextQuestion);
  views.quiz.querySelector("[data-exit]").addEventListener("click", () => setView("home"));
}

function renderResults() {
  const latest = state.sessions[0];
  if (!latest) {
    views.results.innerHTML = '<div class="card"><p>No completed session yet.</p></div>';
    return;
  }

  views.results.innerHTML = `
    <div class="card">
      <h2>${latest.percent >= 75 ? "Pass-level result" : "Keep sharpening"}</h2>
      <div class="grid">
        <div class="metric"><span>Score</span><strong>${latest.score}/${latest.total}</strong></div>
        <div class="metric"><span>Percentage</span><strong>${latest.percent}%</strong></div>
        <div class="metric"><span>Time</span><strong>${latest.minutes}m</strong></div>
        <div class="metric"><span>Mode</span><strong>${latest.mode}</strong></div>
      </div>
      <div class="notice" style="margin-top:18px">
        <strong>Next race... well, exam focus:</strong>
        ${latest.percent >= 75 ? "Keep doing mixed revision and protect accuracy under time pressure." : "Repeat this section, read explanations, then do a 10-question mixed set."}
      </div>
      <div class="actions">
        <button class="primary-button" data-review>Back to Dashboard</button>
        <button class="secondary-button" data-again>Practise Again</button>
      </div>
    </div>
  `;
  views.results.querySelector("[data-review]").addEventListener("click", () => setView("home"));
  views.results.querySelector("[data-again]").addEventListener("click", () => startQuiz({ count: 10, mode: "practice" }));
}

function renderProgress() {
  const rows = state.data.sections
    .map((section) => {
      const stats = sectionStats(section.name);
      const status = stats.percent >= 75 ? "Exam ready" : stats.answered ? "Needs work" : "Not started";
      return `<tr><td>${section.name}</td><td>${stats.total}</td><td>${stats.answered}</td><td>${stats.percent}%</td><td>${status}</td></tr>`;
    })
    .join("");
  views.progress.innerHTML = `
    <div class="card">
      <h2>Section Progress</h2>
      <table class="table">
        <thead><tr><th>Section</th><th>Total</th><th>Answered</th><th>Correct</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderUpgrade() {
  const billingReady = state.billing.configured && state.billing.currentPackage;
  const packageText = state.billing.currentPackage ? packageLabel(state.billing.currentPackage) : "Product loads from RevenueCat offering";
  const setupMessage = !state.billing.config?.androidApiKey
    ? "Add your RevenueCat Android public SDK key in assets/revenuecat-config.json before Play testing."
    : state.billing.status;

  views.upgrade.innerHTML = `
    <div class="two-column">
      <div class="card">
        <h2>Unlock All 750 Questions</h2>
        <p>Pro access now uses RevenueCat and Google Play Billing. Your subscription unlocks the full question bank, all sections, explanations, exam simulation and progress tools.</p>
        <div class="stack">
          <span class="pill good">750 questions</span>
          <span class="pill good">All topic sections</span>
          <span class="pill good">Explanations</span>
          <span class="pill good">Exam simulation</span>
          <span class="pill good">Progress tracking</span>
        </div>
        <div class="notice" style="margin-top:16px">
          <strong>Status:</strong> ${setupMessage}<br>
          <strong>Offer:</strong> ${packageText}
          ${state.billing.lastError ? `<br><strong>Message:</strong> ${state.billing.lastError}` : ""}
        </div>
        <div class="actions">
          <button class="primary-button" data-purchase-pro ${billingReady ? "" : "disabled"}>Subscribe with Google Play</button>
          <button class="ghost-button" data-restore>Restore purchases</button>
        </div>
      </div>
      <div class="card">
        <h2>RevenueCat Setup</h2>
        <p>Create Google Play subscription products, attach them to a RevenueCat offering, and map them to entitlement <strong>${state.billing.config?.entitlementId || "pro_access"}</strong>.</p>
      </div>
    </div>
  `;
  views.upgrade.querySelector("[data-purchase-pro]").addEventListener("click", purchasePro);
  views.upgrade.querySelector("[data-restore]").addEventListener("click", restorePurchases);
}

function renderProfile() {
  views.profile.innerHTML = `
    <div class="card">
      <h2>Settings</h2>
      <p>Local progress is saved in this browser. This is useful for the MVP, but the production app should sync progress to Supabase/Firebase.</p>
      <div class="actions">
        <button class="ghost-button" data-reset>Reset local progress</button>
      </div>
    </div>
  `;
  views.profile.querySelector("[data-reset]").addEventListener("click", () => {
    if (!confirm("Reset all local progress for this MVP?")) return;
    state.answers = {};
    state.sessions = [];
    saveState();
    render();
  });
}

function startWeakQuiz() {
  const weak = state.data.sections
    .map((section) => ({ name: section.name, ...sectionStats(section.name) }))
    .filter((section) => section.answered > 0)
    .sort((a, b) => a.percent - b.percent)[0];
  startQuiz({ section: weak?.name, count: 10, mode: "weak_areas" });
}

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});
restoreButton.addEventListener("click", restorePurchases);
document.querySelector("#examButton").addEventListener("click", () => {
  if (!state.isPro) {
    setView("upgrade");
    return;
  }
  startQuiz({ count: 100, mode: "exam" });
});

Promise.all([
  fetch("assets/questions.json").then((response) => response.json()),
  initBilling(),
])
  .then(([data]) => {
    state.data = data;
    render();
  })
  .catch((error) => {
    views.home.innerHTML = `<div class="notice">Could not load question bank: ${error.message}</div>`;
  });
