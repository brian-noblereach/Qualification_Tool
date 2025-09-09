// /js/api/company.js  (pure JS)
const CompanyAPI = (() => {
  const API_URL = "https://api.stack-ai.com/inference/v0/run/f913a8b8-144d-47e0-b327-8daa341b575d/68bf33a8aedc162026050675";
  const API_KEY = "Bearer e80f3814-a651-4de7-a7ba-8478b7a9047b";
  const DEFAULT_TIMEOUT_MS = 420_000; // 7 minutes

  function timeout(ms, msg="Request timed out") {
    return new Promise((_, r) => setTimeout(() => r(new Error(msg)), ms));
  }
  function normalize(json){ return json?.["out-6"] ?? json; }

  async function run(url, userId="local-user"){
    if (!/^https?:\/\//i.test(url)) throw new Error("Please enter a valid http(s) URL.");
    const res = await Promise.race([
      fetch(API_URL, {
        method: "POST",
        headers: { "Authorization": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ "user_id": String(userId), "in-0": url })
      }),
      timeout(DEFAULT_TIMEOUT_MS)
    ]);
    if (!res.ok) throw new Error(`CompanyAPI failed (${res.status}): ${await res.text().catch(()=>res.statusText)}`);
    const raw = await res.json();
    return normalize(raw);
  }

  return { run };
})();
