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
    logger.error('Lỗi đọc ma trận: ' + e.message);
    return;
  }

  if (A.length === 0) { logger.error('Ma trận A không hợp lệ.'); return; }
  if (A.length !== B.length) { logger.error('Số hàng của A và B phải bằng nhau.'); return; }

  const B2D = B.map(row => Array.isArray(row) ? row : [row]);

  logger.section('MA TRẬN ĐẦU VÀO');
  logger.text(`Kích thước A: ${A.length} × ${A[0].length}`);
  logger.text(`Số vế phải (cột B): ${B2D[0].length}`);

  solveGaussJordanUI(A, B2D, logger);
}

function parseMatrixGJ(text) {
  const lines = text.trim().split('\n').filter(l => l.trim() !== '');
  return lines.map((line, i) => {
    const vals = line.trim().split(/[\s,;]+/).map(v => {
      const n = parseFloat(v);
      if (isNaN(n)) throw new Error(`Giá trị không hợp lệ "${v}" ở hàng ${i + 1}`);
      return n;
    });
    return vals;
  });
}

function _fmtGJ(M, n, p) {
  return M.map(row => {
    const obj = {};
    row.forEach((val, c) => {
      const name = c < n ? `x${c+1}` : `b${c-n+1}`;
      obj[name] = Math.abs(val) < 1e-10 ? '0.0000' : val.toFixed(4);
    });
    return obj;
  });
}

function _exprGJ({ const: c, terms }) {
  const entries = Object.entries(terms).filter(([, v]) => Math.abs(v) > 1e-10);
  const hasC = Math.abs(c) > 1e-10;
  if (!hasC && entries.length === 0) return '0';
  let parts = [];
  if (hasC) parts.push(c.toFixed(4));
  for (const [t, coeff] of entries) {
    if (parts.length === 0) {
      if (Math.abs(coeff - 1) < 1e-10) parts.push(t);
      else if (Math.abs(coeff + 1) < 1e-10) parts.push(`-${t}`);
      else parts.push(`${coeff.toFixed(4)}*${t}`);
    } else {
      const sign = coeff >= 0 ? '+' : '-';
      const abs = Math.abs(coeff);
      if (Math.abs(abs - 1) < 1e-10) parts.push(`${sign} ${t}`);
      else parts.push(`${sign} ${abs.toFixed(4)}*${t}`);
    }
  }
  return parts.join(' ');
}

function solveGaussJordanUI(A, B, logger) {
  const m = A.length, n = A[0].length, p = B[0].length;
  let M = A.map((row, r) => [...row, ...B[r]]);

  logger.section('QUÁ TRÌNH KHỬ GAUSS-JORDAN (KHỬ CẢ TRÊN VÀ DƯỚI)');
  logger.table(_fmtGJ(M, n, p));

  let i = 0, j = 0, step = 1;
  const pivotCols = [];

  while (i < m && j < n) {
    let maxRow = i, maxVal = Math.abs(M[i][j]);
    for (let t = i + 1; t < m; t++) {
      if (Math.abs(M[t][j]) > maxVal) { maxVal = Math.abs(M[t][j]); maxRow = t; }
    }
    if (maxVal < 1e-10) { logger.text(`Cột x${j+1} toàn 0, bỏ qua.`); j++; continue; }

    if (maxRow !== i) {
      [M[i], M[maxRow]] = [M[maxRow], M[i]];
      logger.info(`Hoán vị hàng ${i+1} ↔ hàng ${maxRow+1}`);
      logger.table(_fmtGJ(M, n, p));
    }

    logger.step(`[Bước ${step}] Chọn pivot: a(${i+1},${j+1}) = ${M[i][j].toFixed(4)}`);
    const ops = [];
    let changed = false;

    // Gauss-Jordan: khử CẢ trên lẫn dưới
    for (let k = 0; k < m; k++) {
      if (k !== i && Math.abs(M[k][j]) > 1e-10) {
        const factor = M[k][j] / M[i][j];
        ops.push(`L${k+1} = L${k+1} - (${factor.toFixed(4)}) × L${i+1}`);
        for (let col = j; col < n + p; col++) M[k][col] -= factor * M[i][col];
        M[k][j] = 0;
        changed = true;
      }
    }
    if (changed) {
      logger.text(ops.join('\n'));
      logger.table(_fmtGJ(M, n, p));
    }
    step++; pivotCols.push({ row: i, col: j }); i++; j++;
  }

  // Chuẩn hóa đường chéo
  logger.section('CHUẨN HÓA ĐƯỜNG CHÉO (CHIA PIVOT = 1)');

  // Kiểm tra vô nghiệm
  const pivotRowSet = new Set(pivotCols.map(pc => pc.row));
  for (let r = 0; r < m; r++) {
    if (!pivotRowSet.has(r)) {
      for (let k = 0; k < p; k++) {
        if (Math.abs(M[r][n + k]) > 1e-10) {
          logger.error(`VÔ NGHIỆM: Hàng ${r+1} cho 0 = ${M[r][n+k].toFixed(4)}`);
          return null;
        }
      }
    }
  }

  const pivotColIndices = new Set(pivotCols.map(pc => pc.col));
  const freeCols = [];
  for (let c = 0; c < n; c++) if (!pivotColIndices.has(c)) freeCols.push(c);

  if (freeCols.length > 0) {
    logger.warn(`Phát hiện ${freeCols.length} biến tự do:`);
    freeCols.forEach((fc, idx) => logger.info(`  Đặt x${fc+1} = t${idx+1} (∈ ℝ)`));
  }

  let X = Array.from({ length: n }, () =>
    Array.from({ length: p }, () => ({ const: 0, terms: {} }))
  );
  freeCols.forEach((fc, idx) => {
    const tName = `t${idx+1}`;
    for (let k = 0; k < p; k++) X[fc][k] = { const: 0, terms: { [tName]: 1 } };
  });

  for (const { row: r, col: c } of pivotCols) {
    const diagVal = M[r][c];
    for (let k = 0; k < p; k++) {
      const constPart = M[r][n + k] / diagVal;
      const termsPart = {};
      for (const fc of freeCols) {
        const coeff = M[r][fc] / diagVal;
        if (Math.abs(coeff) > 1e-10) {
          const tName = `t${freeCols.indexOf(fc)+1}`;
          termsPart[tName] = (termsPart[tName] || 0) - coeff;
        }
      }
      X[c][k] = { const: constPart, terms: termsPart };
    }
  }

  logger.table(_fmtGJ(M, n, p));

  logger.section('MA TRẬN NGHIỆM X');
  const resultTable = X.map((row, xi) => {
    const obj = { 'Biến': `x${xi+1}` };
    row.forEach((cell, k) => { obj[`b${k+1}`] = _exprGJ(cell); });
    return obj;
  });
  logger.table(resultTable);
  logger.success('Hoàn thành Gauss-Jordan.');
  return X;
}
