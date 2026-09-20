const question = document.querySelector("#question");
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

const descriptions = {
  1: "Almost useful, with only modest procedural fog.",
  2: "A little evasive and already waiting for Group.",
  3: "Mostly background, eventually something resembling an answer.",
  4: "Multiple dependencies, contradictory completion status.",
  5: "Maximum Pragash. The promotion request may be the clearest part."
};

level.addEventListener("input", () => {
  levelValue.textContent = level.value;
  levelDescription.textContent = descriptions[level.value];
});

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
  const value = question.value.trim();
  if (!value) {
    status.textContent = "Please enter a question first.";
    question.focus();
    return;
  }
  askButton.disabled = true;
  status.textContent = "Pragash is checking whether this was already completed last week…";
  plainResult.classList.add("hidden");
  readingPanel.classList.add("hidden");
  readButton.innerHTML = '<span class="choice-icon" aria-hidden="true">Aa</span><span><strong>Read the Response</strong><small>Reveal the written answer</small></span>';
  try {
    const data = await postJson("/api/ask", { question: value, level: Number(level.value) });
    currentAnswer = data.answer;
    answer.textContent = currentAnswer;
    answerCard.classList.remove("hidden");
    status.textContent = "Response received. Choose whether to read or hear it.";
    answerCard.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    status.textContent = error.message;
  } finally {
    askButton.disabled = false;
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
  playButton.disabled = true;
  const originalMarkup = playButton.innerHTML;
  playButton.innerHTML = '<span class="choice-icon" aria-hidden="true">…</span><span><strong>Preparing Audio</strong><small>Group Finance is processing it</small></span>';
  try {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: currentAnswer })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Audio request failed.");
    }
    if (currentAudio) currentAudio.pause();
    currentAudio = new Audio(URL.createObjectURL(await response.blob()));
    await currentAudio.play();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    playButton.disabled = false;
    playButton.innerHTML = originalMarkup;
  }
});

plainButton.addEventListener("click", async () => {
  if (!currentAnswer) return;
  plainButton.disabled = true;
  plainButton.textContent = "Translating…";
  try {
    const data = await postJson("/api/plain-english", { text: currentAnswer });
    plainResult.textContent = `In plain English: ${data.summary}`;
    plainResult.classList.remove("hidden");
  } catch (error) {
    status.textContent = error.message;
  } finally {
    plainButton.disabled = false;
    plainButton.textContent = "What did he actually say?";
  }
});

copyButton.addEventListener("click", async () => {
  if (!currentAnswer) return;
  await navigator.clipboard.writeText(currentAnswer);
  copyButton.textContent = "Copied";
  setTimeout(() => { copyButton.textContent = "Copy answer"; }, 1500);
});
