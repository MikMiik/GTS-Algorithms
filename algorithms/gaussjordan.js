/**
 * Phương pháp Gauss-Jordan — adapted for UI
 */
function runGaussJordan(params, logger) {
  const { matA, matB } = params;

  let A, B;
  try {
    A = parseMatrixGJ(matA);
    B = parseMatrixGJ(matB);
  } catch (e) {
    logger.error("Lỗi đọc ma trận: " + e.message);
    return;
  }

  if (A.length === 0) {
    logger.error("Ma trận A không hợp lệ.");
    return;
  }
  if (A.length !== B.length) {
    logger.error("Số hàng của A và B phải bằng nhau.");
    return;
  }

  const B2D = B.map((row) => (Array.isArray(row) ? row : [row]));

  logger.section("MA TRẬN ĐẦU VÀO");
  logger.text(`Kích thước A: ${A.length} × ${A[0].length}`);
  logger.text(`Số vế phải (cột B): ${B2D[0].length}`);

  solveGaussJordanUI(A, B2D, logger);
}

function parseMatrixGJ(text) {
  const lines = text
    .trim()
    .split("\n")
    .filter((l) => l.trim() !== "");
  return lines.map((line, i) => {
    const vals = line
      .trim()
      .split(/[\s,;]+/)
      .map((v) => {
        const n = parseFloat(v);
        if (isNaN(n))
          throw new Error(`Giá trị không hợp lệ "${v}" ở hàng ${i + 1}`);
        return n;
      });
    return vals;
  });
}

// Hiển thị ma trận: cột luôn giữ đúng thứ tự gốc x1..xn
function _fmtGJ(M, n, p) {
  return M.map((row) => {
    const obj = {};
    row.forEach((val, c) => {
      const name = c < n ? `x${c + 1}` : `b${c - n + 1}`;
      obj[name] = Math.abs(val) < 1e-10 ? "0.0000" : val.toFixed(4);
    });
    return obj;
  });
}

function _exprGJ({ const: c, terms }) {
  const entries = Object.entries(terms).filter(([, v]) => Math.abs(v) > 1e-10);
  const hasC = Math.abs(c) > 1e-10;
  if (!hasC && entries.length === 0) return "0";
  let parts = [];
  if (hasC) parts.push(c.toFixed(4));
  for (const [t, coeff] of entries) {
    if (parts.length === 0) {
      if (Math.abs(coeff - 1) < 1e-10) parts.push(t);
      else if (Math.abs(coeff + 1) < 1e-10) parts.push(`-${t}`);
      else parts.push(`${coeff.toFixed(4)}*${t}`);
    } else {
      const sign = coeff >= 0 ? "+" : "-";
      const abs = Math.abs(coeff);
      if (Math.abs(abs - 1) < 1e-10) parts.push(`${sign} ${t}`);
      else parts.push(`${sign} ${abs.toFixed(4)}*${t}`);
    }
  }
  return parts.join(" ");
}

/**
 * Quy tắc chọn pivot 3 tầng ưu tiên (theo lý thuyết học thuật):
 *   Tầng 1 (cao nhất): |pivot| = 1  → chia cho 1, không sinh phân số
 *   Tầng 2: |pivot| là số nguyên dương bất kỳ (≥ 2) → ưu tiên hơn số thập phân
 *   Tầng 3 (thấp nhất): |pivot| lớn nhất (giảm sai số làm tròn)
 * Trong cùng tầng: chọn |pivot| lớn hơn.
 */
function _pivotTier(value) {
  const abs = Math.abs(value);
  if (Math.abs(abs - 1) < 1e-9) return 2; // tầng 1: chính xác là ±1
  if (Math.abs(abs - Math.round(abs)) < 1e-9 && abs > 0) return 1; // tầng 2: số nguyên khác ±1
  return 0; // tầng 3: số thập phân
}

function _findBestPivot(M, m, n, usedRows, usedCols) {
  let best = null;
  for (let r = 0; r < m; r++) {
    if (usedRows.has(r)) continue;
    for (let c = 0; c < n; c++) {
      if (usedCols.has(c)) continue;
      const abs = Math.abs(M[r][c]);
      if (abs < 1e-10) continue;
      const tier = _pivotTier(M[r][c]);
      if (!best) {
        best = { row: r, col: c, abs, tier };
        continue;
      }
      if (tier > best.tier) {
        best = { row: r, col: c, abs, tier };
        continue;
      }
      if (tier === best.tier && abs > best.abs) {
        best = { row: r, col: c, abs, tier };
      }
    }
  }
  return best;
}

function solveGaussJordanUI(A, B, logger) {
  const m = A.length,
    n = A[0].length,
    p = B[0].length;
  let M = A.map((row, r) => [...row, ...B[r]]);

  logger.section("QUÁ TRÌNH KHỬ GAUSS-JORDAN (KHỬ CẢ TRÊN VÀ DƯỚI)");
  logger.text(
    "Quy tắc chọn pivot toàn cục: ưu tiên |a| ∈ {1,2,4,5} trên toàn bộ phần chưa khử, sau đó lấy |a| lớn nhất.",
  );
  logger.text("Cột KHÔNG hoán vị — thứ tự biến x₁…xₙ cố định suốt quá trình.");
  logger.table(_fmtGJ(M, n, p));

  const usedRows = new Set(); // hàng đã dùng làm pivot
  const usedCols = new Set(); // cột đã được khử
  const pivotList = []; // { row, col } theo thứ tự xử lý
  let step = 1;

  while (pivotList.length < Math.min(m, n)) {
    const best = _findBestPivot(M, m, n, usedRows, usedCols);
    if (!best) {
      logger.text("Toàn bộ phần chưa khử đều bằng 0 — dừng.");
      break;
    }

    const { row: pr, col: pc } = best;
    const pivotVal = M[pr][pc];
    const tierLabels = [
      "[số thập phân — lớn nhất]",
      "[số nguyên — lớn nhất]",
      "[±1 — tối ưu]",
    ];
    const tierNote = " " + tierLabels[best.tier];
    logger.step(
      `[Bước ${step}] Chọn pivot: a(${pr + 1},${pc + 1}) = ${pivotVal.toFixed(4)}${tierNote}`,
    );

    // Khử cột pc khỏi TẤT CẢ hàng khác (kể cả hàng đã làm pivot trước đó)
    const ops = [];
    let changed = false;
    for (let k = 0; k < m; k++) {
      if (k === pr) continue;
      if (Math.abs(M[k][pc]) < 1e-10) continue;
      const factor = M[k][pc] / pivotVal;
      ops.push(`L${k + 1} = L${k + 1} - (${factor.toFixed(4)}) × L${pr + 1}`);
      for (let col = 0; col < n + p; col++) M[k][col] -= factor * M[pr][col];
      M[k][pc] = 0;
      changed = true;
    }
    if (changed) logger.text(ops.join("\n"));
    logger.table(_fmtGJ(M, n, p));

    usedRows.add(pr);
    usedCols.add(pc);
    pivotList.push({ row: pr, col: pc });
    step++;
  }

  // ── CHUẨN HÓA: chia mỗi hàng pivot cho giá trị pivot để được 1 ──
  logger.section("CHUẨN HÓA ĐƯỜNG CHÉO (CHIA PIVOT = 1)");

  // Kiểm tra vô nghiệm: hàng nào không có pivot mà B ≠ 0
  for (let r = 0; r < m; r++) {
    if (usedRows.has(r)) continue;
    for (let k = 0; k < p; k++) {
      if (Math.abs(M[r][n + k]) > 1e-10) {
        logger.error(
          `VÔ NGHIỆM: Hàng ${r + 1} cho 0 = ${M[r][n + k].toFixed(4)}`,
        );
        return null;
      }
    }
  }

  // Biến tự do = cột không được chọn làm pivot
  const freeCols = [];
  for (let c = 0; c < n; c++) if (!usedCols.has(c)) freeCols.push(c);

  if (freeCols.length > 0) {
    logger.warn(`Phát hiện ${freeCols.length} biến tự do:`);
    freeCols.forEach((fc, idx) =>
      logger.info(`  Đặt x${fc + 1} = t${idx + 1} (∈ ℝ)`),
    );
  }

  // Hiển thị ma trận sau chuẩn hóa (chỉ để xem, không sửa M)
  const Mnorm = M.map((row) => [...row]);
  for (const { row: r, col: c } of pivotList) {
    const d = Mnorm[r][c];
    for (let col = 0; col < n + p; col++) Mnorm[r][col] /= d;
  }
  logger.table(_fmtGJ(Mnorm, n, p));

  // ── XÂY DỰNG NGHIỆM ──
  let X = Array.from({ length: n }, () =>
    Array.from({ length: p }, () => ({ const: 0, terms: {} })),
  );

  // Biến tự do: x_{fc} = t_{idx+1}
  freeCols.forEach((fc, idx) => {
    const tName = `t${idx + 1}`;
    for (let k = 0; k < p; k++) X[fc][k] = { const: 0, terms: { [tName]: 1 } };
  });

  // Biến cơ sở: tính từ hàng pivot đã chuẩn hóa
  for (const { row: r, col: c } of pivotList) {
    const diagVal = M[r][c];
    for (let k = 0; k < p; k++) {
      const constPart = M[r][n + k] / diagVal;
      const termsPart = {};
      for (const fc of freeCols) {
        const coeff = M[r][fc] / diagVal;
        if (Math.abs(coeff) > 1e-10) {
          const tName = `t${freeCols.indexOf(fc) + 1}`;
          termsPart[tName] = (termsPart[tName] || 0) - coeff;
        }
      }
      X[c][k] = { const: constPart, terms: termsPart };
    }
  }

  logger.section("MA TRẬN NGHIỆM X");
  const resultTable = X.map((row, xi) => {
    const obj = { Biến: `x${xi + 1}` };
    row.forEach((cell, k) => {
      obj[`b${k + 1}`] = _exprGJ(cell);
    });
    return obj;
  });
  logger.table(resultTable);
  logger.success("Hoàn thành Gauss-Jordan.");
  return X;
}
