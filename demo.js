/**
 * demo.js — a 5-question taste of MathMaker, played in the browser.
 *
 * Mirrors the game's real rules for category C1 (Pythagoras' Apprentice,
 * Bronze, Level 1): A ± B with A, B ∈ [2, 44] and no negative results,
 * 20 seconds per question, 4 choices with a single correct answer.
 *
 *   Sigma per correct answer = BASE(C1 = 10) × TIER(Bronze = 1.00)
 *                            × TIME(remaining seconds) × STRIKE(1) × 100
 *   TIME: 16–20 s → ×2.0 · 12–16 → ×1.8 · 8–12 → ×1.4 · 4–8 → ×1.2 · 0–4 → ×1.0
 *   Epsilon per correct answer (C1) = 20
 *
 * Every user-facing string comes from window.DEMO_T (set per page language).
 */
(function () {
  "use strict";

  var T = window.DEMO_T;
  var root = document.getElementById("demo");
  if (!T || !root) return;

  var QUESTIONS = 5;
  var SECONDS = 20;
  var BASE_C1 = 10;
  var EPSILON_C1 = 20;
  var TIME_BRACKETS = [
    [16, 2.0],
    [12, 1.8],
    [8, 1.4],
    [4, 1.2],
    [0, 1.0],
  ];

  var els = {
    progress: root.querySelector("[data-demo=progress]"),
    sigma: root.querySelector("[data-demo=sigma]"),
    epsilon: root.querySelector("[data-demo=epsilon]"),
    bar: root.querySelector("[data-demo=bar]"),
    question: root.querySelector("[data-demo=question]"),
    answers: root.querySelector("[data-demo=answers]"),
    status: root.querySelector("[data-demo=status]"),
    start: root.querySelector("[data-demo=start]"),
    cta: root.querySelector("[data-demo=cta]"),
  };

  var state = null;
  var tick = null;

  function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function makeQuestion() {
    var a = randInt(2, 44);
    var b = randInt(2, 44);
    var plus = Math.random() < 0.5;
    if (!plus && b > a) {
      var t = a;
      a = b;
      b = t;
    }
    var answer = plus ? a + b : a - b;
    // error-model distractors: off-by-one, off-by-ten, digit swap
    var pool = [answer + 1, answer - 1, answer + 10, answer - 10, answer + 2, answer - 2, answer + 11];
    var swapped = Number(String(answer).split("").reverse().join(""));
    if (answer >= 10) pool.unshift(swapped);
    var choices = [answer];
    for (var i = 0; i < pool.length && choices.length < 4; i++) {
      var c = pool[i];
      if (c >= 0 && choices.indexOf(c) === -1) choices.push(c);
    }
    return {
      text: a + (plus ? " + " : " − ") + b + " = ?",
      answer: answer,
      choices: shuffle(choices),
    };
  }

  function timeMultiplier(remaining) {
    for (var i = 0; i < TIME_BRACKETS.length; i++) {
      if (remaining >= TIME_BRACKETS[i][0]) return TIME_BRACKETS[i][1];
    }
    return 1;
  }

  function fmt(n) {
    return n.toLocaleString(document.documentElement.lang || "en");
  }

  function renderHud() {
    els.progress.textContent = T.progress
      .replace("{n}", Math.min(state.index + 1, QUESTIONS))
      .replace("{total}", QUESTIONS);
    els.sigma.textContent = fmt(state.sigma) + " Σ";
    els.epsilon.textContent = fmt(state.epsilon) + " ε";
  }

  function setStatus(text, kind) {
    els.status.textContent = text;
    els.status.className = "demo-status" + (kind ? " is-" + kind : "");
  }

  function renderTimer(remaining) {
    var pct = Math.max(0, (remaining / SECONDS) * 100);
    els.bar.style.width = pct + "%";
    els.bar.classList.toggle("is-warn", remaining < 8 && remaining >= 4);
    els.bar.classList.toggle("is-danger", remaining < 4);
  }

  function stopTimer() {
    if (tick) clearInterval(tick);
    tick = null;
  }

  function showQuestion() {
    var q = makeQuestion();
    state.current = q;
    state.startedAt = Date.now();
    state.locked = false;
    renderHud();
    els.question.textContent = q.text;
    els.answers.innerHTML = "";
    q.choices.forEach(function (value) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "demo-answer";
      btn.textContent = value;
      btn.addEventListener("click", function () {
        answer(value, btn);
      });
      els.answers.appendChild(btn);
    });
    setStatus(T.hint);
    renderTimer(SECONDS);
    stopTimer();
    tick = setInterval(function () {
      var remaining = SECONDS - (Date.now() - state.startedAt) / 1000;
      renderTimer(remaining);
      if (remaining <= 0) answer(null, null);
    }, 100);
  }

  function reveal(picked, btn) {
    var buttons = els.answers.querySelectorAll(".demo-answer");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
      if (Number(buttons[i].textContent) === state.current.answer) {
        buttons[i].classList.add("is-correct");
      }
    }
    if (btn && picked !== state.current.answer) btn.classList.add("is-wrong");
  }

  function answer(picked, btn) {
    if (state.locked) return;
    state.locked = true;
    stopTimer();
    var remaining = Math.max(0, SECONDS - (Date.now() - state.startedAt) / 1000);
    reveal(picked, btn);

    if (picked === null) {
      setStatus(T.timeout, "bad");
    } else if (picked === state.current.answer) {
      var gained = Math.round(BASE_C1 * 1.0 * timeMultiplier(remaining) * 1 * 100);
      state.sigma += gained;
      state.epsilon += EPSILON_C1;
      state.correct += 1;
      setStatus(
        T.correct.replace("{sigma}", fmt(gained)).replace("{epsilon}", fmt(EPSILON_C1)),
        "good",
      );
    } else {
      setStatus(T.wrong, "bad");
    }
    renderHud();

    setTimeout(function () {
      state.index += 1;
      if (state.index < QUESTIONS) showQuestion();
      else finish();
    }, 1300);
  }

  function finish() {
    renderTimer(0);
    els.question.textContent = T.doneTitle;
    els.answers.innerHTML = "";
    setStatus(
      T.doneText
        .replace("{correct}", state.correct)
        .replace("{total}", QUESTIONS)
        .replace("{sigma}", fmt(state.sigma))
        .replace("{epsilon}", fmt(state.epsilon)),
      state.correct === QUESTIONS ? "good" : null,
    );
    els.start.textContent = T.again;
    els.start.hidden = false;
    els.cta.hidden = false;
  }

  function start() {
    state = { index: 0, sigma: 0, epsilon: 0, correct: 0, locked: true, current: null };
    els.start.hidden = true;
    els.cta.hidden = true;
    showQuestion();
  }

  // initial idle screen
  state = { index: 0, sigma: 0, epsilon: 0, correct: 0, locked: true, current: null };
  renderHud();
  renderTimer(SECONDS);
  els.question.textContent = T.idleTitle;
  setStatus(T.idleText);
  els.start.textContent = T.start;
  els.start.addEventListener("click", start);
})();
