// js/utils/loading-ui.js
(function () {
  const $ = (id) => document.getElementById(id);

  let start = 0;
  let timer = null;
  let phases = [];
  let done = 0;

  function setProgress(pct) {
    const bar = $("progressBar");
    if (bar) bar.style.width = pct + "%";
  }

  function tickTime() {
    const el = $("timeElapsed");
    if (!el) return;
    const s = Math.floor((Date.now() - start) / 1000);
    const m = Math.floor(s / 60);
    el.textContent = `${m}:${String(s % 60).padStart(2, "0")}`;
  }

  window.LoadingUI = {
    show(opts = {}) {
      start = Date.now();
      phases = Array.isArray(opts.phases) ? opts.phases : [];
      done = 0;

      const section = $("loadingSection");
      if (section) section.style.display = "flex";
      if ($("loadingTitle")) $("loadingTitle").textContent = opts.title || "Working…";
      if ($("progressStatus")) $("progressStatus").textContent = phases[0] ? `Starting ${phases[0]}…` : "Starting…";
      setProgress(5);

      clearInterval(timer);
      timer = setInterval(tickTime, 1000);
      tickTime();
    },

    completePhase(name) {
      done++;
      const pct = Math.min(5 + Math.round((done / Math.max(phases.length, 1)) * 95), 100);
      if ($("progressStatus")) $("progressStatus").textContent = `${name} complete`;
      setProgress(pct);
    },

    error(msg) {
      if ($("progressStatus")) $("progressStatus").textContent = msg || "Error";
    },

    hide() {
      const section = $("loadingSection");
      if (section) section.style.display = "none";
      clearInterval(timer);
      timer = null;
      setProgress(0);
    },
  };
})();
