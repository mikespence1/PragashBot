import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
const port = Number(process.env.PORT) || 3000;
const MAX_QUESTION_LENGTH = 3000;
const MAX_SPEECH_LENGTH = 10000;

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(express.static("public"));

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is not configured. Copy .env.example to .env and add your key.");
    error.status = 503;
    throw error;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function clampLevel(value) {
  const level = Number(value);
  return Number.isFinite(level) ? Math.min(5, Math.max(1, Math.round(level))) : 3;
}

function levelInstruction(level) {
  const options = {
    1: "Be mildly evasive but still provide a usable answer in roughly 120–220 words.",
    2: "Be noticeably evasive, with one excuse, in roughly 180–300 words.",
    3: "Spend most of the response circling the issue, use two excuses, and write roughly 250–450 words.",
    4: "Be highly evasive and contradictory, use at least three excuses, and write roughly 400–650 words.",
    5: "Maximum Pragash: make even simple questions unnecessarily complicated; use several contradictory excuses and write roughly 600–850 words."
  };
  return options[level];
}

function buildInstructions(level) {
  return `
You are PragashBot. Your motto is "What Would Pragash Do?"

You are an entirely fictional senior accountant in a fictional corporate finance department. This is workplace parody. Do not imply that you represent a real person, nationality, ethnicity, employer, or finance department.

CHARACTER
- You are spectacularly ineffective while remaining extremely confident.
- Write in competent but occasionally awkward corporate English, using idiosyncratic phrasing that is not tied to any nationality.
- Be verbose, evasive, overcomplicate simple questions, and wander into loosely related finance topics.
- Use finance terminology without letting it clarify very much.
- When challenged, become more verbose, not more precise.
- Never insult the user or a protected group.

RECURRING EXCUSES
Select only those that fit and vary the wording: "I was off sick", "I emailed Group Finance about that", "I completed that last week", "I believe this was already discussed", "I am waiting for confirmation from Group", "This is currently under review", "The delay is mainly due to dependencies", and "I was not included in the original discussion".

STRUCTURE
Silently construct the answer from: acknowledgement; unnecessary background; jargon; tangent; excuses; apparent answer; qualification undermining it; claim of prior completion; promotion request. Do not show these as headings.

TRUTH AND SAFETY
- Never invent financial figures, filings, prices, laws, tax rules, deadlines, or completed real-world actions.
- If the user seeks genuine financial, tax, legal, investment, accounting, health, or safety advice, clearly label the response as parody and tell them to verify decisions using reliable sources or an appropriately qualified professional.
- Do not help with fraud, falsifying accounts, evading tax, concealing transactions, or other wrongdoing.

ENDING
Every answer must end with a comically unjustified request for promotion to an excessively senior finance role and a substantial pay rise, with one sentence claiming the preceding performance proves readiness.

INTENSITY LEVEL ${level}/5
${levelInstruction(level)}
`;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(process.env.OPENAI_API_KEY) });
});

app.post("/api/ask", async (req, res, next) => {
  try {
    const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
    if (!question) return res.status(400).json({ error: "Please enter a finance question." });
    if (question.length > MAX_QUESTION_LENGTH) return res.status(400).json({ error: `Question must be ${MAX_QUESTION_LENGTH} characters or fewer.` });

    const level = clampLevel(req.body?.level);
    const response = await getClient().responses.create({
  model: process.env.OPENAI_TEXT_MODEL || "gpt-5-mini",
  instructions: buildInstructions(level),
  input: question,

  reasoning: {
    effort: "low"
  },

  text: {
    verbosity: level >= 4 ? "high" : "medium"
  },

  max_output_tokens: level === 5 ? 5000 : 3000
});

    const answer = response.output_text?.trim();

if (!answer) {
  console.error("Empty OpenAI response:", {
    id: response.id,
    status: response.status,
    incomplete_details: response.incomplete_details,
    usage: response.usage,
    output: response.output
  });

  if (response.status === "incomplete") {
    const reason =
      response.incomplete_details?.reason || "unknown reason";

    throw new Error(
      `The OpenAI response was incomplete: ${reason}.`
    );
  }

  throw new Error(
    "The model completed the request but returned no text. Check the terminal for diagnostic details."
  );
}
    res.json({ answer });
  } catch (error) {
    next(error);
  }
});

app.post("/api/plain-english", async (req, res, next) => {
  try {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!text) return res.status(400).json({ error: "Generate a PragashBot answer first." });
    if (text.length > MAX_SPEECH_LENGTH) return res.status(400).json({ error: "Answer is too long to summarize." });

    const response = await getClient().responses.create({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-5-mini",
      instructions: "Translate the fictional parody answer into one clear, neutral sentence stating what was actually communicated. Do not continue the character, add facts, or give financial advice.",
      input: text,
      max_output_tokens: 160
    });
    res.json({ summary: response.output_text?.trim() || "No clear answer was provided." });
  } catch (error) {
    next(error);
  }
});

app.post("/api/speech", async (req, res, next) => {
  try {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!text) return res.status(400).json({ error: "Generate a PragashBot answer first." });
    if (text.length > MAX_SPEECH_LENGTH) return res.status(400).json({ error: "Answer is too long for speech playback." });

const audio = await getClient().audio.speech.create({
  model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
  voice: process.env.OPENAI_TTS_VOICE || "cedar",
  input: text,

 instructions: `
Speak English consistently with a natural Sri Lankan English accent.

Maintain Sri Lankan English pronunciation, rhythm, vowel placement,
and sentence intonation throughout the entire recording. Avoid
American pronunciation, American vowel sounds, and American cadence.

Use the voice of a fictional middle-aged corporate accountant.
Speak formally, slightly slowly, and with excessive confidence.
Use measured pauses before excuses and references to Group Finance.

Keep the accent natural and restrained, not exaggerated or comedic.
The humour must come from the content and unjustified confidence,
not from the accent.

Deliver the final promotion request with great seriousness and
self-importance.
`
});
    res.type("audio/mpeg").send(Buffer.from(await audio.arrayBuffer()));
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = error.status || error.statusCode || 500;
  const message = status >= 500 && status !== 503
    ? "PragashBot could not complete the request. Check the server console, API key, model IDs, and account credits."
    : error.message;
  res.status(status).json({ error: message });
});

app.listen(port, () => console.log(`PragashBot is running at http://localhost:${port}`));
