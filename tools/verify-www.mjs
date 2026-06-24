import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const required = [
  "www/index.html",
  "www/app.js",
  "www/styles.css",
  "www/assets/questions.json",
];

for (const file of required) {
  await access(path.join(root, file));
}

const data = JSON.parse(await readFile(path.join(root, "www/assets/questions.json"), "utf8"));
if (data.questionCount !== 750 || !Array.isArray(data.questions) || data.questions.length !== 750) {
  throw new Error("Question bank verification failed.");
}

console.log(`Verified www bundle: ${data.questionCount} questions, ${data.sections.length} sections.`);
