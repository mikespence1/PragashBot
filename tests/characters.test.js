import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function harness() {
  const routes = {};
  const calls = [];
  const app = { disable() {}, use() {}, get() {}, listen() {}, post(path, handler) { routes[path] = handler; } };
  const express = Object.assign(() => app, { json() {}, static() {} });
  class OpenAI {
    responses = { create: async (args) => { calls.push(args); return { output_text: "Example answer" }; } };
    audio = { speech: { create: async (args) => { calls.push(args); return { arrayBuffer: async () => new ArrayBuffer(0) }; } } };
  }
  const source = readFileSync(new URL("../server.js", import.meta.url), "utf8").replace(/^import .*;\r?\n/gm, "");
  vm.runInNewContext(source, { express, OpenAI, Buffer, console, process: { env: { OPENAI_API_KEY: "test-only" } } });
  async function request(path, body) {
    let result;
    let error;
    const res = { json(value) { result = value; }, status() { return this; }, type() { return this; }, send(value) { result = value; } };
    await routes[path]({ body }, res, (value) => { error = value; });
    return { result, error, call: calls.at(-1) };
  }
  return { request, calls };
}

test("default Pragash and teacher use separate instructions and voices", async () => {
  const { request } = harness();
  const pragash = await request("/api/ask", { question: "Is the forecast ready?", level: 3 });
  assert.equal(pragash.result.character, "pragash");
  assert.match(pragash.call.instructions, /Start every answer with a defensive statement/);
  assert.match(pragash.call.instructions, /substantial pay rise/);
  const teacher = await request("/api/ask", { question: "Why do fractions work?", studentName: "  Aoife  ", level: 3, character: "grumpy-teacher" });
  assert.equal(JSON.parse(teacher.call.input).studentName, "Aoife");
  assert.match(teacher.call.instructions, /sitting in your classroom/);
  assert.match(teacher.call.instructions, /Northern Irish vocabulary/);
  assert.equal(teacher.result.character, "grumpy-teacher");
  assert.match(teacher.call.instructions, /accurate and understandable/);
  assert.match(teacher.call.instructions, /51–92/);
  assert.doesNotMatch(teacher.call.instructions, /You are PragashBot/);
  const voice = await request("/api/speech", { text: "Example", character: "grumpy-teacher" });
  assert.equal(voice.call.voice, "coral");
  assert.match(voice.call.instructions, /female teacher from Northern Ireland/);
  const originalVoice = await request("/api/speech", { text: "Example" });
  assert.equal(originalVoice.call.voice, "cedar");
  const summary = await request("/api/plain-english", { text: "Example", character: "grumpy-teacher" });
  assert.match(summary.call.instructions, /Omit the scolding/);
});

test("unknown characters are rejected before any model request", async () => {
  const { request, calls } = harness();
  for (const path of ["/api/ask", "/api/speech", "/api/plain-english"]) {
    const { error } = await request(path, { character: "unknown", question: "Hello", text: "Hello" });
    assert.equal(error.status, 400);
  }
  assert.equal(calls.length, 0);
});

test("teacher requires a valid student name before requesting an answer", async () => {
  const { request, calls } = harness();
  for (const studentName of [undefined, "   ", 123, "a".repeat(81)]) {
    const { result } = await request("/api/ask", { character: "grumpy-teacher", question: "Why?", studentName });
    assert.match(result.error, /student name between 1 and 80/);
  }
  assert.equal(calls.length, 0);
});

test("teacher mood and shorter length targets progress through all five levels", async () => {
  const { request } = harness();
  const ranges = ["25–46", "37–62", "51–92", "82–133", "123–174"];
  const moods = ["Be patient, pleasant", "Be slightly impatient", "Be noticeably grumpy", "Be very irate", "Sound intensely irritated"];
  for (let level = 1; level <= 5; level++) {
    const { call } = await request("/api/ask", { character: "grumpy-teacher", studentName: "Sam", question: "What is a fraction?", level });
    assert.ok(call.instructions.includes(`Target ${ranges[level - 1]} words`));
    assert.ok(call.instructions.includes(moods[level - 1]));
  }
});
