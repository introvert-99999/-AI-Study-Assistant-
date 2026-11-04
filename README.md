# AI Study Assistant

Paste class notes or type a topic. The app asks an AI model (Google Gemini) for a **summary**, a **5-question quiz** and **flip flashcards**, and saves every generation in a **history**. Plain HTML, CSS and JavaScript only.

## Features
- Summary with Copy, Download .txt and Read aloud (Speech Synthesis)
- Interactive quiz: green/red feedback, explanations, score, percentage, retry
- Click-to-flip flashcards
- History in localStorage (open, delete one, delete all)
- Dark / Light mode that is remembered
- Extras: summary style (Explain like I am 10 / Exam-focused / Detailed), quiz difficulty, character counter with limit warning, read aloud
- Error messages for: no key, empty input, network failure, 400/401/403 bad key, 429 rate limit, 5xx, and an invalid AI reply

## Get a free API key
1. Open https://aistudio.google.com/apikey and sign in.
2. Click **Create API key** and copy it.
3. In the app click **Settings**, paste the key, click **Save key**.

The key is stored only in your browser's localStorage. It is never in the code or the repository, so every visitor uses their own key.

## Run locally
JavaScript modules (`import ... from`) are blocked on `file://`, so double-clicking `index.html` will not work. Use a local server:

```
python -m http.server 8000      # then open http://localhost:8000
```
or the **Live Server** extension in VS Code.

## Deploy
Netlify: drag the folder into https://app.netlify.com/drop, or connect the GitHub repo (no build command, publish directory `.`).
Vercel: import the repo, framework preset **Other**, no build command.

## Files
| File | Job |
|---|---|
| `index.html` | page structure (semantic HTML) |
| `css/styles.css` | layout, themes, flip animation, responsive rules |
| `js/app.js` | connects buttons to the other modules |
| `js/api.js` | builds the prompt, calls the API, validates the reply |
| `js/storage.js` | all localStorage code (theme, key, history) |
| `js/ui.js` | draws summary, quiz, flashcards, history |

## Viva cheat sheet: the fetch request
```js
fetch(URL, {
  method: "POST",                                   // we SEND data
  headers: { "Content-Type": "application/json",    // body is JSON
             "x-goog-api-key": key },               // who we are
  body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }],
                         generationConfig: { responseMimeType: "application/json" } })
});
```
- **URL**: `generativelanguage.googleapis.com/v1beta/models/<model>:generateContent`
- **Response**: `data.candidates[0].content.parts[0].text` holds the AI's text, which is itself JSON.
- **Safety net**: `res.ok` checks the status, `try/catch` around `JSON.parse`, then `parseReply()` checks every field exists.
- **Why textContent**: AI text is never put in `innerHTML`, so it cannot inject HTML.

If Google renames the model, change `MODEL` at the top of `js/api.js`.

## Before you push
Search the repo for your key, and never commit a `.env` file. If a key ever reaches GitHub, delete it in AI Studio and create a new one.