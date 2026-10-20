import test from "node:test";
import assert from "node:assert/strict";
import { loadEvent } from "../src/lib/event-loader.mjs";

test("event details recover from a transient timeout", async () => {
  let calls = 0;
  const event = { id: "event", name: "Evento" };
  const api = {
    async getPrediction(id, { signal }) {
      assert.equal(id, "event");
      assert.equal(signal.aborted, false);
      if (++calls === 1) throw new DOMException("Timeout", "TimeoutError");
      return event;
    },
  };
  assert.deepEqual(
    await loadEvent("event", new AbortController().signal, api),
    event,
  );
  assert.equal(calls, 2);
});
test("event details do not retry missing events or cancelled navigation", async () => {
  let calls = 0;
  const error = Object.assign(new Error("Missing"), { status: 404 });
  await assert.rejects(
    loadEvent("event", new AbortController().signal, {
      async getPrediction() {
        calls++;
        throw error;
      },
    }),
    error,
  );
  assert.equal(calls, 1);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    loadEvent("event", controller.signal, {
      async getPrediction() {
        calls++;
      },
    }),
    { name: "AbortError" },
  );
  assert.equal(calls, 1);
});
