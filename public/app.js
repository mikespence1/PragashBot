const question = document.querySelector("#question");
const character = document.querySelector("#character");
const studentName = document.querySelector("#studentName");
const level = document.querySelector("#level");
const levelValue = document.querySelector("#levelValue");
const levelDescription = document.querySelector("#levelDescription");
const askButton = document.querySelector("#askButton");
const readButton = document.querySelector("#readButton");
const playButton = document.querySelector("#playButton");
const plainButton = document.querySelector("#plainButton");
const copyButton = document.querySelector("#copyButton");
const hideButton = document.querySelector("#hideButton");
const answerCard = document.querySelector("#answerCard");
const readingPanel = document.querySelector("#readingPanel");
const answer = document.querySelector("#answer");
const status = document.querySelector("#status");
const plainResult = document.querySelector("#plainResult");
let currentAnswer = "";
let currentAudio;
let currentAudioUrl;
let answerCharacter = "pragash";

function setBusy(busy) {
  for (const control of [character, askButton, playButton, plainButton]) control.disabled = busy;
}

function stopAudio() {
  if (currentAudio) currentAudio.pause();
  if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
  currentAudio = undefined;
  currentAudioUrl = undefined;
}

const teacherDescriptions = {
  1: "Good mood: a patient explanation and a little encouragement.",
  2: "Mostly helpful, with a few impatient reminders.",
  3: "Equal parts explanation and irritated classroom complaints.",
  4: "Mostly stern reproaches, with only a brief answer.",
  5: "Absolutely bloody furious: almost all reprimand, barely any answer."
};

function updateCharacter() {
  const teacher = character.value === "grumpy-teacher";
  document.querySelector("#studentNameField").classList.toggle("hidden", !teacher);
  studentName.required = teacher;
  studentName.disabled = !teacher;
  const name = teacher ? "Grumpy Teacher" : "Pragash";
  document.querySelector("h1").textContent = teacher ? name : "PragashBot";
  document.querySelector(".badge").textContent = teacher ? "GT" : "WWPD?";
  document.querySelector(".eyebrow").textContent = teacher ? "Computing, maths, English and science" : "Corporate finance, approximately";
  document.querySelector(".tagline").textContent = teacher ? "You should have been listening." : "What Would Pragash Do?";
  document.querySelector('label[for="question"]').textContent = teacher ? "Student question" : "Finance question";
  question.placeholder = teacher ? "Why do we invert the second fraction when dividing fractions?" : "Pragash, have you finished the Q3 forecast?";
  document.querySelector("#levelLabel").textContent = teacher ? "Grumpiness level" : "Pragash level";
  document.querySelector(".scale").firstElementChild.textContent = teacher ? "Good mood" : "Almost useful";
  document.querySelector(".scale").lastElementChild.textContent = teacher ? "Absolutely bloody furious" : "Maximum Pragash";
  levelDescription.textContent = (teacher ? teacherDescriptions : descriptions)[level.value];
  askButton.textContent = `Ask ${name} →`;
  document.querySelector(".stamp").textContent = teacher ? "PLEASE PAY ATTENTION" : "SUBJECT TO GROUP CONFIRMATION";
  document.querySelector(".choice-prompt").textContent = `How would you like ${name} to deliver the response?`;
  document.querySelector(".reading-heading h3").textContent = `${name} says`;
  plainButton.textContent = teacher ? "What did she actually say?" : "What did he actually say?";
  document.title = `${name} | Fictional Parody`;
}

character.addEventListener("change", () => {
  stopAudio();
  currentAnswer = "";
  answer.textContent = "";
  plainResult.textContent = "";
  answerCard.classList.add("hidden");
  readingPanel.classList.add("hidden");
  plainResult.classList.add("hidden");
  status.textContent = "";
  updateCharacter();
});

const descriptions = {
  1: "Almost useful, with only modest procedural fog.",
  2: "A little evasive and already waiting for Group.",
  3: "Mostly background, eventually something resembling an answer.",
  4: "Multiple dependencies, contradictory completion status.",
  5: "Maximum Pragash. The promotion request may be the clearest part."
};

level.addEventListener("input", () => {
  levelValue.textContent = level.value;
  levelDescription.textContent = (character.value === "grumpy-teacher" ? teacherDescriptions : descriptions)[level.value];
});

updateCharacter();

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

async function askPragash() {
  if (askButton.disabled) return;
  if (character.value === "grumpy-teacher" && (!studentName.value.trim() || studentName.value.trim().length > 80)) {
    status.textContent = "Please enter a student name between 1 and 80 characters.";
    studentName.focus();
    return;
  }
  const value = question.value.trim();
  if (!value) {
    status.textContent = "Please enter a question first.";
    question.focus();
    return;
  }
  setBusy(true);
  stopAudio();
  currentAnswer = "";
  answerCard.classList.add("hidden");
  status.textContent = character.value === "grumpy-teacher" ? "Grumpy Teacher is deciding her rage level..." : "Pragash is checking what is still outstanding…";
  plainResult.classList.add("hidden");
  readingPanel.classList.add("hidden");
  readButton.innerHTML = '<span class="choice-icon" aria-hidden="true">Aa</span><span><strong>Read the Response</strong><small>Reveal the written answer</small></span>';
  try {
    const data = await postJson("/api/ask", { question: value, level: Number(level.value), character: character.value, studentName: studentName.value.trim() });
    answerCharacter = data.character;
    currentAnswer = data.answer;
    answer.textContent = currentAnswer;
    answerCard.classList.remove("hidden");
    status.textContent = "Response received. Choose whether to read or hear it.";
    answerCard.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    status.textContent = error.message;
  } finally {
    setBusy(false);
  }
}

askButton.addEventListener("click", askPragash);
question.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") askPragash();
});

readButton.addEventListener("click", () => {
  if (!currentAnswer) return;
  readingPanel.classList.remove("hidden");
  readButton.innerHTML = '<span class="choice-icon" aria-hidden="true">✓</span><span><strong>Response Displayed</strong><small>Continue reading below</small></span>';
  readingPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

hideButton.addEventListener("click", () => {
  readingPanel.classList.add("hidden");
  plainResult.classList.add("hidden");
  readButton.innerHTML = '<span class="choice-icon" aria-hidden="true">Aa</span><span><strong>Read the Response</strong><small>Reveal the written answer</small></span>';
  answerCard.scrollIntoView({ behavior: "smooth", block: "start" });
});

playButton.addEventListener("click", async () => {
  if (!currentAnswer) return;
  setBusy(true);
  const originalMarkup = playButton.innerHTML;
  playButton.innerHTML = '<span class="choice-icon" aria-hidden="true">…</span><span><strong>Preparing Audio</strong><small>Generating the character voice</small></span>';
  try {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: currentAnswer, character: answerCharacter })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Audio request failed.");
    }
    stopAudio();
    currentAudioUrl = URL.createObjectURL(await response.blob());
    currentAudio = new Audio(currentAudioUrl);
    await currentAudio.play();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    setBusy(false);
    playButton.innerHTML = originalMarkup;
  }
});

plainButton.addEventListener("click", async () => {
  if (!currentAnswer) return;
  setBusy(true);
  plainButton.textContent = "Translating…";
  try {
    const data = await postJson("/api/plain-english", { text: currentAnswer, character: answerCharacter });
    plainResult.textContent = `In plain English: ${data.summary}`;
    plainResult.classList.remove("hidden");
  } catch (error) {
    status.textContent = error.message;
  } finally {
    setBusy(false);
    plainButton.textContent = answerCharacter === "grumpy-teacher" ? "What did she actually say?" : "What did he actually say?";
  }
});

copyButton.addEventListener("click", async () => {
  if (!currentAnswer) return;
  await navigator.clipboard.writeText(currentAnswer);
  copyButton.textContent = "Copied";
  setTimeout(() => { copyButton.textContent = "Copy answer"; }, 1500);
});
