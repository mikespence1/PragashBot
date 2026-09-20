# PragashBot

**What Would Pragash Do?** is a fictional corporate-finance parody bot. It turns a user's finance question into a verbose, evasive answer, reads it aloud using AI-generated speech, and can translate the answer back into one plain-English sentence.

The character is intentionally fictional and is not designed to imitate a real person, nationality, ethnicity, employer, or department.

## Features

- Switch between Pragash and Grumpy Teacher. Pragash retains the finance persona; Grumpy Teacher answers reasonable computing, maths, English, and science questions with impatient British classroom reproaches and a female voice.
- The intensity slider applies to the selected character. Switching characters clears the previous response and stops playback.
- Grumpy Teacher requires a student name before asking. She addresses the student in a fictional classroom, uses their name periodically, and speaks with Northern Irish vocabulary and a female Northern Irish delivery.
- Five-level “Pragash Level” control
- OpenAI Responses API for text
- OpenAI text-to-speech playback
- “What did he actually say?” one-sentence translation
- Copy-to-clipboard button
- Server-side API key protection
- Input limits, error handling, responsive UI, and AI-audio disclosure

## Requirements

- Node.js 20 or later
- An OpenAI API key with billing/credits enabled
- Access to the model IDs configured in `.env`

## Run in VS Code

1. Extract the ZIP and open the `pragashbot` folder in VS Code.
2. Open **Terminal → New Terminal**.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy `.env.example` to a new file named `.env`.
5. Add your API key to `.env`:

   ```env
   OPENAI_API_KEY=your_real_key_here
   ```

6. Set `OPENAI_TEXT_MODEL` to the **exact API model ID** available in your OpenAI project. The package uses `gpt-5-mini` as a conservative placeholder. If your account exposes a Luna model, replace it with Luna's exact ID.
7. Start the app:

   ```bash
   npm run dev
   ```

8. Open <http://localhost:3000>.

Never place your real key in `.env.example`, `public/app.js`, or GitHub. The `.gitignore` already excludes `.env`.

## Put it on GitHub

Create an empty GitHub repository, then run these commands from the project folder:

```bash
git init
git add .
git commit -m "Initial PragashBot version"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pragashbot.git
git push -u origin main
```

If Git reports LF/CRLF warnings on Windows, those are normally informational and do not prevent the commit.

## Configuration

| Variable | Purpose | Default |
|---|---|---|
| `OPENAI_API_KEY` | Server-side secret API key | Required |
| `OPENAI_TEXT_MODEL` | Responses API model ID | `gpt-5-mini` |
| `OPENAI_TTS_MODEL` | Speech model ID | `gpt-4o-mini-tts` |
| `OPENAI_TTS_VOICE` | Built-in voice | `cedar` |
| `OPENAI_TEACHER_TTS_VOICE` | Grumpy Teacher voice (with British female delivery instructions) | `coral` |
| `PORT` | Local server port | `3000` |

## Deploying

The project is a normal Node/Express server and can be deployed to a Node-compatible host. Configure the same environment variables in the hosting provider's secret/environment settings. Do not upload `.env`.

## Customise the character

Edit `buildInstructions()` in `server.js`. Keep the truth-and-safety rules and avoid instructing the bot to imitate a real person's voice or speech patterns associated with a nationality or ethnicity.

## Useful checks

```bash
npm run check
```

This checks the JavaScript syntax without sending any API requests.

## API routes

- `POST /api/ask` — generate a parody answer
- `POST /api/speech` — return MP3 speech
- `POST /api/plain-english` — summarize an answer in one sentence
- `GET /api/health` — confirm that the server is running and whether a key is configured

## Disclaimer

This is parody, not financial, tax, accounting, investment, or legal advice. AI output may be inaccurate. Verify real decisions using reliable sources or a qualified professional.
