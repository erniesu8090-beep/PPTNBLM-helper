/* Text-preserving splitter for the YAML format emitted by CAST. Studio.
   Deliberately not a general YAML parser: unsupported structures fail explicitly. */
(function (root) {
  function splitYaml(source, limit = 10) {
    if (!Number.isInteger(limit) || limit < 3) throw new Error("每組頁數必須是至少 3 的整數。");
    const text = source.trim().replace(/^```(?:yaml|yml)?\s*\r?\n/i, "").replace(/\r?\n```\s*$/, "");
    const lines = text.split(/\r?\n/);
    const planning = lines.findIndex(line => /^slide_planning:\s*(?:#.*)?$/.test(line));
    if (planning < 0) throw new Error("找不到頂層 slide_planning: 欄位，請確認 YAML 格式。");
    const globalLines = lines.slice(0, planning);
    const pages = [];
    let indent = null;
    for (const line of lines.slice(planning + 1)) {
      const match = line.match(/^( *)-\s+page:\s*(\d+)\s*(?:#.*)?$/);
      if (indent === null && match) indent = match[1].length;
      if (match && match[1].length === indent) {
        const num = Number(match[2]);
        if (!Number.isSafeInteger(num) || num < 1 || pages.some(page => page.num === num)) {
          throw new Error("頁碼必須為不重複的正整數。");
        }
        pages.push({ num, lines: [line] });
      } else if (!line.trim() || line.trimStart().startsWith("#")) {
        if (pages.length) pages.at(-1).lines.push(line);
      } else {
        const depth = line.length - line.trimStart().length;
        if (!pages.length || depth <= indent) {
          throw new Error("slide_planning 請使用相同縮排的 - page: 數字清單；其後不支援其他頂層欄位。");
        }
        pages.at(-1).lines.push(line);
      }
    }
    if (!pages.length) throw new Error("找不到投影片頁面，請使用 - page: 數字格式。");
    const parts = [];
    let cursor = 0;
    while (cursor < pages.length) {
      const partNum = parts.length + 1;
      const fresh = pages.slice(cursor, cursor + (partNum === 1 ? limit : limit - 2));
      const selected = partNum === 1 ? fresh : [pages[0], pages[cursor - 1], ...fresh];
      cursor += fresh.length;
      parts.push({
        partNum,
        pageRange: `第 ${selected.map(page => page.num).join("、")} 頁`,
        yaml: [...globalLines, "slide_planning:",
          ...selected.flatMap((page, index) => [
            ...(partNum > 1 && index < 2 ? [index === 0 ? "  # 風格錨點：合併時刪除此重複頁" : "  # 銜接緩衝：合併時刪除此重複頁"] : []),
            ...page.lines
          ]),
          cursor === pages.length ? "# 所有分段已完成。" : "# 請繼續生成下一組分段。"
        ].join("\n") + "\n"
      });
    }
    return parts;
  }
  root.CastYaml = { splitYaml };
  if (typeof module !== "undefined" && module.exports) module.exports = { splitYaml };
})(globalThis);
