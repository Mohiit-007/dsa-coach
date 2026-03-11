/**
 * Extract Striver A2Z questions from the provided PDF and output JSON dataset.
 *
 * Usage (PowerShell):
 *   node backend/scripts/extract_striver_pdf.js "C:\path\to\Striver A2Z ...pdf"
 *
 * Output:
 *   data/striver_456_questions.json
 */
const fs = require("fs");
const path = require("path");
const PDFParser = require("pdf2json");

const DEFAULT_OUT = path.join(__dirname, "..", "..", "data", "striver_456_questions.json");

function safeTopicFromStep(stepTitle) {
  const t = String(stepTitle || "").toLowerCase();
  if (t.includes("arrays")) return "Arrays";
  if (t.includes("binary search")) return "Binary Search";
  if (t.includes("string")) return "Strings";
  if (t.includes("linkedlist") || t.includes("linked list")) return "Linked List";
  if (t.includes("stack") || t.includes("queue")) return "Stack & Queue";
  if (t.includes("heap")) return "Heap";
  if (t.includes("greedy")) return "Greedy";
  if (t.includes("graph")) return "Graphs";
  if (t.includes("dynamic programming")) return "Dynamic Programming";
  if (t.includes("trie")) return "Trie";
  if (t.includes("recursion")) return "Recursion";
  if (t.includes("backtracking")) return "Backtracking";
  if (t.includes("tree")) return "Trees";
  if (t.includes("bit")) return "Bit Manipulation";
  if (t.includes("sorting")) return "Sorting";
  return "Basics";
}

function guessDifficulty(title, topic) {
  const s = String(title || "").toLowerCase();
  const hardTokens = [
    "lfu",
    "lru",
    "sudoku",
    "expression add",
    "word ladder 2",
    "morris",
    "serialize",
    "deserialize",
    "swim in rising water",
    "burst balloons",
    "evaluate boolean",
    "wildcard",
    "edit distance",
    "matrix chain",
    "reverse pairs",
  ];
  const easyTokens = [
    "introduction",
    "implement",
    "check",
    "print",
    "count digits",
    "reverse a number",
    "gcd",
    "prime",
    "pattern",
    "selection sort",
    "bubble sort",
    "insertion sort",
    "binary search to find",
    "lower bound",
    "upper bound",
  ];
  if (hardTokens.some((t) => s.includes(t))) return "Hard";
  if (easyTokens.some((t) => s.includes(t))) return "Easy";
  if (topic === "Basics" || topic === "Sorting") return "Easy";
  return "Medium";
}

function leetcodeSearchUrl(title) {
  return `https://leetcode.com/problemset/all/?search=${encodeURIComponent(String(title || ""))}`;
}

function uniqueBy(arr, keyFn) {
  const out = [];
  const seen = new Set();
  for (const x of arr) {
    const k = keyFn(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

async function main() {
  const pdfPath = process.argv[2];
  const outPath = process.argv[3] || DEFAULT_OUT;

  if (!pdfPath) {
    console.error("❌ Missing PDF path.\nExample: node backend/scripts/extract_striver_pdf.js \"C:\\path\\file.pdf\"");
    process.exit(1);
  }
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ PDF not found: ${pdfPath}`);
    process.exit(1);
  }

  const text = await new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.on("pdfParser_dataError", (err) => reject(err?.parserError || err));
    parser.on("pdfParser_dataReady", (pdfData) => {
      try {
        // pdf2json stores text chunks per page under pdfData.Pages[*].Texts[*].R[*].T (url-encoded)
        const pages = Array.isArray(pdfData?.Pages) ? pdfData.Pages : [];
        const out = [];
        for (const page of pages) {
          const texts = Array.isArray(page?.Texts) ? page.Texts : [];
          // Reconstruct visual lines using y/x coordinates
          const sorted = [...texts].sort((a, b) => (a.y - b.y) || (a.x - b.x));
          let currentY = null;
          let line = [];

          const flush = () => {
            const s = line.join(" ").replace(/\s+/g, " ").trim();
            if (s) out.push(s);
            line = [];
          };

          for (const t of sorted) {
            const y = typeof t?.y === "number" ? t.y : null;
            if (currentY === null) currentY = y;
            // new line when y changes enough
            if (y !== null && currentY !== null && Math.abs(y - currentY) > 0.28) {
              flush();
              currentY = y;
            }

            const runs = Array.isArray(t?.R) ? t.R : [];
            const txt = runs
              .map((r) => (r?.T ? decodeURIComponent(r.T) : ""))
              .join("")
              .replace(/\s+/g, " ")
              .trim();
            if (txt) line.push(txt);
          }
          flush();
          out.push(""); // page break
        }
        resolve(out.join("\n"));
      } catch (e) {
        reject(e);
      }
    });
    parser.loadPDF(pdfPath);
  });

  const lines = text
    .split(/\r?\n/g)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  let currentStepTitle = "Basics";
  const items = [];

  for (const line of lines) {
    // Step headings like: "Step 3: Arrays [Easy -> Medium -> Hard]"
    const stepMatch = line.match(/^Step\s*\d+\s*:\s*(.+)$/i);
    if (stepMatch) {
      currentStepTitle = stepMatch[1].trim();
      continue;
    }

    // Numbered question lines: "39 Largest Element in an Array"
    const qMatch = line.match(/^(\d{1,4})\s+(.+?)$/);
    if (!qMatch) continue;
    const id = Number(qMatch[1]);
    const title = String(qMatch[2]).trim();
    if (!Number.isFinite(id) || !title) continue;

    const topic = safeTopicFromStep(currentStepTitle);
    const difficulty = guessDifficulty(title, topic);

    items.push({
      id,
      title,
      topic,
      difficulty,
      platform: "LeetCode",
      link: leetcodeSearchUrl(title),
    });
  }

  const cleaned = uniqueBy(items, (q) => `${q.id}::${q.title.toLowerCase()}::${q.topic}`);
  cleaned.sort((a, b) => a.id - b.id);

  // Ensure ids are dense (optional) — keep original id for stability.
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(cleaned, null, 2) + "\n", "utf-8");

  console.log(`✅ Extracted ${cleaned.length} questions → ${outPath}`);
}

main().catch((e) => {
  console.error("❌ Failed to extract:", e.message);
  process.exit(1);
});

