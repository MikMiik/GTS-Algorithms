/**
 * GTS — Giải Tích Số
 * Main application controller
 */

"use strict";

// ============================================================
// LOGGER FACTORY — converts algorithm output to UI elements
// ============================================================
function createLogger() {
  const entries = [];

  const push = (type, content) => entries.push({ type, content });

  return {
    entries,
    text: (msg) => push("text", msg),
    info: (msg) => push("info", msg),
    success: (msg) => push("success", msg),
    warn: (msg) => push("warn", msg),
    error: (msg) => push("error", msg),
    step: (msg) => push("step", msg),
    formula: (msg) => push("formula", msg),
    result: (msg) => push("result", msg),
    section: (msg) => push("section", msg),
    separator: () => push("separator", null),
    table: (data) => push("table", data),
  };
}

// ============================================================
// RENDER LOGGER ENTRIES TO DOM
// ============================================================
function renderLog(entries, container) {
  container.innerHTML = "";
  let count = 0;

  entries.forEach((entry, idx) => {
    if (entry.type === "separator") {
      const hr = document.createElement("hr");
      hr.className = "log-separator";
      container.appendChild(hr);
      return;
    }

    if (entry.type === "section") {
      const div = document.createElement("div");
      div.className = "log-section";
      div.textContent = "▸ " + entry.content;
      container.appendChild(div);
      count++;
      return;
    }

    if (entry.type === "table") {
      const data = entry.content;
      if (!data || data.length === 0) return;

      const wrapper = document.createElement("div");
      wrapper.className = "log-table-wrapper";

      const table = document.createElement("table");
      table.className = "log-table";

      // Header
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      Object.keys(data[0]).forEach((key) => {
        const th = document.createElement("th");
        th.textContent = key;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Body
      const tbody = document.createElement("tbody");
      data.forEach((row) => {
        const tr = document.createElement("tr");
        Object.values(row).forEach((val) => {
          const td = document.createElement("td");
          // Handle multiline text (like operation logs)
          if (typeof val === "string" && val.includes("\n")) {
            td.style.whiteSpace = "pre";
          }
          td.textContent = val !== null && val !== undefined ? String(val) : "";
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      wrapper.appendChild(table);

      const logEntry = document.createElement("div");
      logEntry.className = "log-entry";
      logEntry.style.animationDelay = `${Math.min(idx * 10, 200)}ms`;
      logEntry.appendChild(wrapper);
      container.appendChild(logEntry);
      count++;
      return;
    }

    // Text-based entries
    const classMap = {
      text: "log-text",
      info: "log-info",
      success: "log-success",
      warn: "log-warn",
      error: "log-error-text",
      step: "log-step",
      formula: "log-formula",
      result: "log-result",
    };

    const div = document.createElement("div");
    div.className = `log-entry ${classMap[entry.type] || "log-text"}`;
    div.style.animationDelay = `${Math.min(idx * 8, 200)}ms`;

    // Handle multiline
    if (typeof entry.content === "string" && entry.content.includes("\n")) {
      div.style.whiteSpace = "pre";
    }
    div.textContent = entry.content;
    container.appendChild(div);
    count++;
  });

  return count;
}

// ============================================================
// ALGORITHM CONFIGURATIONS
// ============================================================
const ALGORITHMS = {
  bisection: {
    title: "Phương Pháp Chia Đôi",
    subtitle: "Bisection Method — f(x) = 0",
    buildForm: () => `
      <div class="form-section-title">Hàm số</div>
      <div class="form-group">
        <label class="form-label" for="in-f">Hàm <code>f(x)</code> (dùng cú pháp JS)</label>
        <input class="form-input" id="in-f" type="text" value="Math.exp(x) - Math.cos(2*x)" spellcheck="false" autocomplete="off" />
        <div class="form-hint">Ví dụ: <code>Math.exp(x) - Math.cos(2*x)</code>, <code>x**3 - x - 2</code></div>
      </div>
      <div class="form-section-title">Khoảng cách ly nghiệm [a, b]</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="in-a">Cận dưới <code>a</code></label>
          <input class="form-input" id="in-a" type="number" value="-1" step="any" />
        </div>
        <div class="form-group">
          <label class="form-label" for="in-b">Cận trên <code>b</code></label>
          <input class="form-input" id="in-b" type="number" value="-0.1" step="any" />
        </div>
      </div>
      <div class="form-section-title">Tham số</div>
      <div class="form-group">
        <label class="form-label" for="in-eps">Sai số <code>ε (epsilon)</code></label>
        <input class="form-input" id="in-eps" type="text" value="0.5e-5" spellcheck="false" />
        <div class="form-hint">Ví dụ: <code>0.5e-5</code>, <code>1e-6</code>, <code>0.00001</code></div>
      </div>
    `,
    getParams: () => ({
      fStr: document.getElementById("in-f").value.trim(),
      a: document.getElementById("in-a").value,
      b: document.getElementById("in-b").value,
      epsilon: document.getElementById("in-eps").value,
    }),
    run: runBisection,
  },

  tieptuyen: {
    title: "Phương Pháp Tiếp Tuyến",
    subtitle: "Newton-Raphson 1D — f(x) = 0",
    buildForm: () => `
      <div class="form-section-title">Hàm số và đạo hàm</div>
      <div class="form-group">
        <label class="form-label" for="in-f">Hàm <code>f(x)</code></label>
        <input class="form-input" id="in-f" type="text" value="Math.pow(x,5) - 17" spellcheck="false" autocomplete="off" />
      </div>
      <div class="form-group">
        <label class="form-label" for="in-df">Đạo hàm <code>f'(x)</code></label>
        <input class="form-input" id="in-df" type="text" value="5 * Math.pow(x,4)" spellcheck="false" autocomplete="off" />
      </div>
      <div class="form-group">
        <label class="form-label" for="in-ddf">Đạo hàm bậc 2 <code>f''(x)</code></label>
        <input class="form-input" id="in-ddf" type="text" value="20 * Math.pow(x,3)" spellcheck="false" autocomplete="off" />
      </div>
      <div class="form-section-title">Khoảng và tham số</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="in-a">Cận dưới <code>a</code></label>
          <input class="form-input" id="in-a" type="number" value="1" step="any" />
        </div>
        <div class="form-group">
          <label class="form-label" for="in-b">Cận trên <code>b</code></label>
          <input class="form-input" id="in-b" type="number" value="2" step="any" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="in-m1"><code>m₁ = min|f'(x)|</code> trên [a,b]</label>
          <input class="form-input" id="in-m1" type="number" value="5" step="any" />
        </div>
        <div class="form-group">
          <label class="form-label" for="in-eps">Sai số <code>ε</code></label>
          <input class="form-input" id="in-eps" type="text" value="0.5e-6" />
        </div>
      </div>
    `,
    getParams: () => ({
      fStr: document.getElementById("in-f").value.trim(),
      dfStr: document.getElementById("in-df").value.trim(),
      ddfStr: document.getElementById("in-ddf").value.trim(),
      a: document.getElementById("in-a").value,
      b: document.getElementById("in-b").value,
      m1: document.getElementById("in-m1").value,
      epsilon: document.getElementById("in-eps").value,
    }),
    run: runTiepTuyen,
  },

  daycung: {
    title: "Phương Pháp Dây Cung",
    subtitle: "Secant/Chord Method — f(x) = 0",
    buildForm: () => `
      <div class="form-section-title">Hàm số</div>
      <div class="form-group">
        <label class="form-label" for="in-f">Hàm <code>f(x)</code></label>
        <input class="form-input" id="in-f" type="text" value="x**3 - x - 2" spellcheck="false" autocomplete="off" />
        <div class="form-hint">Đạo hàm f' và f'' sẽ được tính số tự động.</div>
      </div>
      <div class="form-section-title">Khoảng và tham số</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="in-a">Cận dưới <code>a</code></label>
          <input class="form-input" id="in-a" type="number" value="1" step="any" />
        </div>
        <div class="form-group">
          <label class="form-label" for="in-b">Cận trên <code>b</code></label>
          <input class="form-input" id="in-b" type="number" value="2" step="any" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="in-eps">Sai số <code>ε</code></label>
        <input class="form-input" id="in-eps" type="text" value="1e-6" />
      </div>
    `,
    getParams: () => ({
      fStr: document.getElementById("in-f").value.trim(),
      a: document.getElementById("in-a").value,
      b: document.getElementById("in-b").value,
      epsilon: document.getElementById("in-eps").value,
    }),
    run: runDayCung,
  },

  lapdon: {
    title: "Lặp Đơn 1 Biến",
    subtitle: "Fixed-Point Iteration 1D — x = φ(x)",
    buildForm: () => `
      <div class="form-section-title">Hàm lặp</div>
      <div class="form-group">
        <label class="form-label" for="in-phi">Hàm <code>φ(x)</code> (sao cho x = φ(x))</label>
        <input class="form-input" id="in-phi" type="text" value="1 / Math.sqrt(x + 3)" spellcheck="false" autocomplete="off" />
        <div class="form-hint">Ví dụ: <code>1 / Math.sqrt(x + 3)</code></div>
      </div>
      <div class="form-section-title">Tham số</div>
      <div class="form-group">
        <label class="form-label" for="in-x0">Điểm xuất phát <code>x₀</code></label>
        <input class="form-input" id="in-x0" type="number" value="0.5" step="any" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="in-q">Hệ số co <code>q</code> (0 &lt; q &lt; 1)</label>
          <input class="form-input" id="in-q" type="number" value="0.0963" step="any" min="0" max="1" />
        </div>
        <div class="form-group">
          <label class="form-label" for="in-eps">Sai số <code>ε</code></label>
          <input class="form-input" id="in-eps" type="text" value="5e-9" />
        </div>
      </div>
    `,
    getParams: () => ({
      phiStr: document.getElementById("in-phi").value.trim(),
      x0: document.getElementById("in-x0").value,
      q: document.getElementById("in-q").value,
      epsilon: document.getElementById("in-eps").value,
    }),
    run: runLapDon,
  },

  gauss: {
    title: "Phương Pháp Gauss",
    subtitle: "Forward Elimination + Back Substitution — Ax = B",
    buildForm: () => `
      <div class="matrix-help">
        📋 Nhập mỗi hàng trên một dòng, các giá trị cách nhau bằng khoảng trắng hoặc dấu phẩy.<br/>
        Ví dụ hàng: <code>1 2 1</code> hoặc <code>1, 2, 1</code>
      </div>
      <div class="form-section-title">Ma trận A (hệ số)</div>
      <div class="form-group">
        <label class="form-label" for="in-matA">Ma trận A</label>
        <textarea class="form-textarea" id="in-matA" rows="4" spellcheck="false">1 2 1
2 3 2
1 1 3</textarea>
      </div>
      <div class="form-section-title">Ma trận B (vế phải)</div>
      <div class="form-group">
        <label class="form-label" for="in-matB">Ma trận B (có thể nhiều cột)</label>
        <textarea class="form-textarea" id="in-matB" rows="4" spellcheck="false">8 1
14 2
10 3</textarea>
        <div class="form-hint">Mỗi hàng = 1 vế phải. Nhiều cột = giải đồng thời nhiều hệ.</div>
      </div>
    `,
    getParams: () => ({
      matA: document.getElementById("in-matA").value,
      matB: document.getElementById("in-matB").value,
    }),
    run: runGauss,
  },

  gaussjordan: {
    title: "Phương Pháp Gauss-Jordan",
    subtitle: "Row Reduction to RREF — Ax = B",
    buildForm: () => `
      <div class="matrix-help">
        📋 Nhập mỗi hàng trên một dòng, các giá trị cách nhau bằng khoảng trắng hoặc dấu phẩy.<br/>
        Ví dụ: <code>2 4 5 -6</code>
      </div>
      <div class="form-section-title">Ma trận A (hệ số)</div>
      <div class="form-group">
        <label class="form-label" for="in-matA">Ma trận A</label>
        <textarea class="form-textarea" id="in-matA" rows="5" spellcheck="false">2 4 5 -6
0 -1 0 8
0 0 0 0
0 0 -1.5 -4</textarea>
      </div>
      <div class="form-section-title">Ma trận B (vế phải)</div>
      <div class="form-group">
        <label class="form-label" for="in-matB">Ma trận B</label>
        <textarea class="form-textarea" id="in-matB" rows="5" spellcheck="false">7 3
-6 1
0 0
2.8 -1.5</textarea>
      </div>
    `,
    getParams: () => ({
      matA: document.getElementById("in-matA").value,
      matB: document.getElementById("in-matB").value,
    }),
    run: runGaussJordan,
  },

  newtonSystem: {
    title: "Newton Hệ Phi Tuyến",
    subtitle: "Newton Method for Nonlinear Systems",
    buildForm: () => `
      <div class="matrix-help">
        ⚙️ Hệ phương trình được cố định từ bài toán mẫu:<br/>
        <code>3x₁ - cos(x₂x₃) - 0.5 = 0</code><br/>
        <code>x₁² - 81(x₂+0.1)² + sin(x₃) + 1.06 = 0</code><br/>
        <code>e^(-x₁x₂) + 20x₃ + 9.1389 = 0</code>
      </div>
      <div class="form-section-title">Điểm xuất phát X₀</div>
      <div class="form-group">
        <label class="form-label" for="in-x0">X₀ = [x₁, x₂, x₃] (cách nhau bằng dấu cách hoặc phẩy)</label>
        <input class="form-input" id="in-x0" type="text" value="0.1 0.1 -0.1" spellcheck="false" />
        <div class="form-hint">Ví dụ: <code>0.1 0.1 -0.1</code> hoặc <code>0.1, 0.1, -0.1</code></div>
      </div>
      <div class="form-group">
        <label class="form-label" for="in-tol">Tolerance (sai số hội tụ)</label>
        <input class="form-input" id="in-tol" type="text" value="1e-6" />
      </div>
    `,
    getParams: () => ({
      x0Str: document.getElementById("in-x0").value,
      tol: document.getElementById("in-tol").value,
    }),
    run: runNewtonSystem,
  },

  lapdonSystem: {
    title: "Lặp Đơn Hệ Phi Tuyến",
    subtitle: "Fixed-Point Iteration for Nonlinear Systems",
    buildForm: () => `
      <div class="matrix-help">
        ⚙️ Hệ hàm lặp Φ được cố định từ bài toán mẫu:<br/>
        <code>φ₁ = (cos(x₂x₃) + 0.5) / 3</code><br/>
        <code>φ₂ = (1/25)·√(x₁² + 0.3125) - 0.03</code><br/>
        <code>φ₃ = -(1/20)·e^(-x₁x₂) - (10π-3)/60</code>
      </div>
      <div class="form-section-title">Điểm xuất phát X₀</div>
      <div class="form-group">
        <label class="form-label" for="in-x0">X₀ = [x₁, x₂, x₃]</label>
        <input class="form-input" id="in-x0" type="text" value="0 0 0" spellcheck="false" />
        <div class="form-hint">Ví dụ: <code>0 0 0</code></div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="in-q">Hệ số co <code>q</code> (0 &lt; q &lt; 1)</label>
          <input class="form-input" id="in-q" type="number" value="0.34" step="any" />
        </div>
        <div class="form-group">
          <label class="form-label" for="in-eps">Sai số <code>ε</code></label>
          <input class="form-input" id="in-eps" type="text" value="1e-6" />
        </div>
      </div>
    `,
    getParams: () => ({
      x0Str: document.getElementById("in-x0").value,
      q: document.getElementById("in-q").value,
      epsilon: document.getElementById("in-eps").value,
    }),
    run: runLapDonSystem,
  },
};

// ============================================================
// LOCALSTORAGE — Save & Restore form state per algorithm
// ============================================================
const LS_PREFIX = "gts-v1-";

/**
 * Lưu tất cả input/textarea trong form hiện tại vào localStorage.
 * Key: "gts-v1-{algoKey}-{elementId}"
 */
function saveFormState(algoKey) {
  inputBody.querySelectorAll("input[id], textarea[id]").forEach((el) => {
    const key = `${LS_PREFIX}${algoKey}-${el.id}`;
    try {
      localStorage.setItem(key, el.value);
    } catch (e) {
      /* quota exceeded — ignore */
    }
  });
}

/**
 * Khôi phục giá trị form từ localStorage (nếu có).
 * Chỉ ghi đè giá trị default nếu localStorage có dữ liệu.
 */
function restoreFormState(algoKey) {
  inputBody.querySelectorAll("input[id], textarea[id]").forEach((el) => {
    const key = `${LS_PREFIX}${algoKey}-${el.id}`;
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      el.value = saved;
    }
  });
}

// ============================================================
// APP STATE & DOM REFS
// ============================================================
let currentAlgo = "bisection";

const btnRun = document.getElementById("btnRun");
const btnClear = document.getElementById("btnClear");
const inputBody = document.getElementById("inputBody");
const outputBody = document.getElementById("outputBody");
const emptyState = document.getElementById("emptyState");
const logCount = document.getElementById("logCount");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

// ============================================================
// SWITCH ALGORITHM
// ============================================================
function switchAlgo(algoKey) {
  if (!ALGORITHMS[algoKey]) return;
  currentAlgo = algoKey;

  // Update sidebar buttons
  document.querySelectorAll(".algo-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.algo === algoKey);
  });

  // Update title
  const cfg = ALGORITHMS[algoKey];
  pageTitle.textContent = cfg.title;
  pageSubtitle.textContent = cfg.subtitle;

  // Rebuild form (default values baked in HTML)
  inputBody.innerHTML = cfg.buildForm();

  // Restore saved values over the defaults
  restoreFormState(algoKey);

  // Clear output
  clearOutput();

  // Auto-save on every change + Enter to run
  inputBody.querySelectorAll("input[id], textarea[id]").forEach((el) => {
    el.addEventListener("input", () => saveFormState(algoKey));
    el.addEventListener("change", () => saveFormState(algoKey));
    if (el.tagName === "INPUT") {
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") runAlgorithm();
      });
    }
  });
}

// ============================================================
// RUN ALGORITHM
// ============================================================
function runAlgorithm() {
  const cfg = ALGORITHMS[currentAlgo];
  if (!cfg) return;

  btnRun.disabled = true;
  btnRun.classList.add("running");
  btnRun.textContent = "⏳ Đang chạy...";

  // Small timeout to allow UI to repaint
  setTimeout(() => {
    try {
      const params = cfg.getParams();
      const logger = createLogger();

      // Parse epsilon safely
      if (params.epsilon !== undefined) {
        try {
          const parsed = parseFloat(params.epsilon);
          params.epsilon = isNaN(parsed) ? params.epsilon : parsed;
        } catch (e) {
          /* keep as string */
        }
      }
      if (params.tol !== undefined) {
        const parsed = parseFloat(params.tol);
        params.tol = isNaN(parsed) ? params.tol : parsed;
      }

      cfg.run(params, logger);
      displayOutput(logger.entries);
    } catch (err) {
      const logger = createLogger();
      logger.error("Lỗi không xác định: " + err.message);
      if (err.stack) logger.text(err.stack.split("\n").slice(0, 3).join("\n"));
      displayOutput(logger.entries);
    } finally {
      btnRun.disabled = false;
      btnRun.classList.remove("running");
      btnRun.textContent = "▶ Chạy";
    }
  }, 20);
}

// ============================================================
// DISPLAY OUTPUT
// ============================================================
function displayOutput(entries) {
  if (emptyState) emptyState.style.display = "none";
  const count = renderLog(entries, outputBody);
  logCount.textContent = `${count} mục`;
  // Scroll to top of output
  outputBody.scrollTop = 0;
}

// ============================================================
// CLEAR OUTPUT
// ============================================================
function clearOutput() {
  outputBody.innerHTML = "";
  logCount.textContent = "0 mục";
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.id = "emptyState";
  empty.innerHTML = `
    <div class="empty-icon">🔬</div>
    <p>Nhập tham số và nhấn <strong>▶ Chạy</strong> để bắt đầu.</p>
  `;
  outputBody.appendChild(empty);
}

// ============================================================
// EVENT LISTENERS
// ============================================================
btnRun.addEventListener("click", runAlgorithm);
btnClear.addEventListener("click", clearOutput);

document.querySelectorAll(".algo-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchAlgo(btn.dataset.algo));
});

// Sidebar toggle (mobile / compact)
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebar = document.getElementById("sidebar");

sidebarToggle.addEventListener("click", () => {
  const isCollapsed = sidebar.style.width === "60px";
  sidebar.style.width = isCollapsed ? "var(--sidebar-width)" : "60px";
  sidebar
    .querySelectorAll(
      ".algo-info, .sidebar-section-label, .logo-title, .logo-sub",
    )
    .forEach((el) => {
      el.style.display = isCollapsed ? "" : "none";
    });
});

// ============================================================
// INIT — restore last used algorithm from localStorage
// ============================================================
const lastAlgo = localStorage.getItem(`${LS_PREFIX}last-algo`);

// Persist current algorithm on every switch
const _origSwitchAlgo = switchAlgo;
function switchAlgoWithPersist(algoKey) {
  _origSwitchAlgo(algoKey);
  try {
    localStorage.setItem(`${LS_PREFIX}last-algo`, algoKey);
  } catch (e) {}
}

// Re-bind sidebar buttons to use persistent version
document.querySelectorAll(".algo-btn").forEach((btn) => {
  // Remove old listener by cloning, then re-add
  const clone = btn.cloneNode(true);
  btn.parentNode.replaceChild(clone, btn);
  clone.addEventListener("click", () =>
    switchAlgoWithPersist(clone.dataset.algo),
  );
});

// Start with last algo or default
const startAlgo = lastAlgo && ALGORITHMS[lastAlgo] ? lastAlgo : "bisection";
switchAlgoWithPersist(startAlgo);
