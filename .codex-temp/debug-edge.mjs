const endpoint = "http://127.0.0.1:9333/json";
const targetUrl = "https://127.0.0.1:5173/";

const targets = await fetch(endpoint).then((response) => response.json());
const page = targets.find((target) => target.type === "page");

if (!page) {
  throw new Error("No page target found");
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }

  if (message.method === "Runtime.exceptionThrown") {
    const details = message.params.exceptionDetails;
    console.log("EXCEPTION", details.text, details.exception?.description ?? "");
  }

  if (message.method === "Runtime.consoleAPICalled") {
    const args = message.params.args
      .map((arg) => arg.value ?? arg.description ?? "")
      .join(" ");
    console.log("CONSOLE", message.params.type, args);
  }

  if (message.method === "Log.entryAdded") {
    console.log("LOG", message.params.entry.level, message.params.entry.text);
  }
};

await new Promise((resolve) => {
  ws.onopen = resolve;
});

await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");
await send("Page.navigate", { url: targetUrl });

await new Promise((resolve) => setTimeout(resolve, 5000));

const result = await send("Runtime.evaluate", {
  expression:
    '({ html: document.getElementById("root")?.innerHTML, text: document.body.innerText, href: location.href })',
  returnByValue: true,
});

console.log("EVAL", JSON.stringify(result.result.result.value));
ws.close();
