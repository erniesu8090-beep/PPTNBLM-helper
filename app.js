/* ==========================================================================
   CAST. Studio - SLIDE & NARRATIVE EDITION ENGINE
   ========================================================================== */

function init() {
  // Tab Navigation Handling (For Presentation Helper & Slide Narrative)
  const tabButtons = document.querySelectorAll(".tab-btn");
  const workspaces = document.querySelectorAll(".workspace-tab-content");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");

      // Update active tab button style
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Show target workspace tab content
      workspaces.forEach(ws => {
        if (ws.id === `${targetTab}-workspace`) {
          ws.classList.add("active");
        } else {
          ws.classList.remove("active");
        }
      });

      // Update header tagline text and theme based on active tab
      const headerTitle = document.getElementById("header-title");
      const headerDesc = document.getElementById("header-desc");
      const headerElement = document.querySelector(".header");

      if (headerTitle && headerDesc) {
        if (targetTab === "presentation-helper") {
          headerTitle.textContent = "突破簡報 15 頁的生成限制";
          headerDesc.textContent = "自動分組規劃與首尾銜接，無損合併完美長簡報";
        } else if (targetTab === "slide-narrative") {
          headerTitle.textContent = "為簡報投影片調配口白與腳本";
          headerDesc.textContent = "設定角色人設與口說調性，一鍵生成高品質投影片講解口白提示詞";
        }
      }

      if (headerElement) {
        headerElement.classList.remove("theme-ppt", "theme-narrative");
        if (targetTab === "presentation-helper") {
          headerElement.classList.add("theme-ppt");
        } else if (targetTab === "slide-narrative") {
          headerElement.classList.add("theme-narrative");
        }
      }
    });
  });

  // Copy PPT Template to Clipboard
  const copyPptBtn = document.getElementById("copy-ppt-btn");
  const pptTemplateText = document.getElementById("ppt-template-text");
  
  if (copyPptBtn && pptTemplateText) {
    copyPptBtn.addEventListener("click", () => {
      const textToCopy = pptTemplateText.textContent;
      
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          copyPptBtn.classList.add("success");
          const origText = copyPptBtn.querySelector(".btn-text").textContent;
          copyPptBtn.querySelector(".btn-text").textContent = "✓ 已複製簡報規劃提示詞！";
          
          setTimeout(() => {
            copyPptBtn.classList.remove("success");
            copyPptBtn.querySelector(".btn-text").textContent = origText;
          }, 2000);
        })
        .catch(err => {
          console.error("複製失敗：", err);
          alert("複製失敗，請手動選取文字複製。");
        });
    });
  }

  // Toggle PPT Prompt preview box collapse/expand
  const togglePptPromptBtn = document.getElementById("toggle-ppt-prompt-btn");
  const pptPromptBox = document.querySelector(".prompt-preview-box");
  
  if (togglePptPromptBtn && pptPromptBox) {
    togglePptPromptBtn.addEventListener("click", () => {
      const isCollapsed = pptPromptBox.classList.toggle("collapsed");
      togglePptPromptBtn.classList.toggle("collapsed", isCollapsed);
      const text = togglePptPromptBtn.querySelector(".toggle-text");
      
      if (text) {
        text.textContent = isCollapsed ? "展開提示詞" : "收折提示詞";
      }
    });
  }

  // YAML Splitter Event Listeners and Logic
  const pptSplitBtn = document.getElementById("ppt-split-btn");
  const pptClearBtn = document.getElementById("ppt-clear-btn");
  const pptYamlInput = document.getElementById("ppt-yaml-input");
  const yamlSplitResults = document.getElementById("yaml-split-results");

  if (pptSplitBtn && pptYamlInput && yamlSplitResults) {
    pptSplitBtn.addEventListener("click", () => {
      const rawYaml = pptYamlInput.value.trim();
      if (!rawYaml) {
        yamlSplitResults.innerHTML = `<span style="color: var(--status-red);">❌ 請先貼入 YAML 內容再進行切割！</span>`;
        return;
      }

      try {
        const parts = splitYaml(rawYaml);
        renderSplitParts(parts);
      } catch (err) {
        yamlSplitResults.innerHTML = `<span style="color: var(--status-red);">❌ 解析錯誤：${err.message}</span>`;
      }
    });
  }

  if (pptClearBtn && pptYamlInput && yamlSplitResults) {
    pptClearBtn.addEventListener("click", () => {
      pptYamlInput.value = "";
      yamlSplitResults.innerHTML = "等待輸入 YAML 並點擊開始切割...";
      yamlSplitResults.className = "split-results-placeholder";
    });
  }

  function splitYaml(yamlString) {
    const lines = yamlString.split(/\r?\n/);
    
    let globalSpecStart = -1;
    let slidePlanningStart = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("global_design_specification:")) {
        globalSpecStart = i;
      }
      if (line.startsWith("slide_planning:")) {
        slidePlanningStart = i;
        break;
      }
    }
    
    if (slidePlanningStart === -1) {
      throw new Error("找不到 `slide_planning:` 欄位，請確認 YAML 格式是否正確。");
    }
    
    const globalSpecLines = lines.slice(Math.max(0, globalSpecStart), slidePlanningStart);
    
    const pageBlocks = [];
    let currentPageLines = [];
    let currentPageNum = -1;
    
    for (let i = slidePlanningStart + 1; i < lines.length; i++) {
      const line = lines[i];
      const pageMatch = line.match(/^(\s*)-\s*page:\s*(\d+)/) || line.match(/^(\s*)page:\s*(\d+)/);
      
      if (pageMatch) {
        if (currentPageLines.length > 0) {
          pageBlocks.push({ num: currentPageNum, lines: currentPageLines });
        }
        currentPageNum = parseInt(pageMatch[2], 10);
        currentPageLines = [line];
      } else {
        if (currentPageNum !== -1) {
          currentPageLines.push(line);
        }
      }
    }
    
    if (currentPageLines.length > 0) {
      pageBlocks.push({ num: currentPageNum, lines: currentPageLines });
    }
    
    if (pageBlocks.length === 0) {
      throw new Error("找不到任何投影片頁面資訊（`- page: [數字]`），請確認 YAML 格式。");
    }
    
    const pptSplitLimitEl = document.getElementById("ppt-split-limit");
    const limit = pptSplitLimitEl ? parseInt(pptSplitLimitEl.value, 10) : 10;
    
    const parts = [];
    const totalPages = pageBlocks.length;
    
    // Part 1: First `limit` pages (index 0 to limit-1)
    const part1Pages = pageBlocks.slice(0, Math.min(limit, totalPages));
    const isPart1Last = totalPages <= limit;
    parts.push({
      partNum: 1,
      pageRange: `第 1 - ${part1Pages[part1Pages.length - 1].num} 頁`,
      yaml: assemblePartYaml(globalSpecLines, part1Pages, isPart1Last, 1)
    });
    
    // Subsequent parts: (limit - 2) pages per part, plus style anchor (page 1) and buffer (prev part's last page)
    const newPagesPerPart = limit - 2;
    let currentIndex = limit;
    let partCounter = 2;
    while (currentIndex < totalPages) {
      const partPages = [];
      // Style anchor
      partPages.push(pageBlocks[0]);
      // Buffer zone (previous part's last page)
      partPages.push(pageBlocks[currentIndex - 1]);
      
      // New pages
      const newPages = pageBlocks.slice(currentIndex, Math.min(currentIndex + newPagesPerPart, totalPages));
      partPages.push(...newPages);
      
      const startPageNum = newPages[0].num;
      const endPageNum = newPages[newPages.length - 1].num;
      
      const isThisPartLast = (currentIndex + newPagesPerPart) >= totalPages;
      
      parts.push({
        partNum: partCounter,
        pageRange: `第 1, ${pageBlocks[currentIndex - 1].num}, ${startPageNum} - ${endPageNum} 頁`,
        yaml: assemblePartYaml(globalSpecLines, partPages, isThisPartLast, partCounter)
      });
      
      currentIndex += newPagesPerPart;
      partCounter++;
    }
    
    return parts;
  }

  function assemblePartYaml(globalLines, pages, isLastPart, partNum) {
    let output = "";
    if (globalLines.length > 0) {
      output += globalLines.join("\n") + "\n";
    } else {
      output += "global_design_specification:\n  # 全域設計規範已省略\n";
    }
    output += "slide_planning:\n";
    
    pages.forEach((p, idx) => {
      let linesToUse = p.lines;
      if (idx === 0 && partNum > 1) {
        linesToUse = [...p.lines];
        for (let i = 0; i < linesToUse.length; i++) {
          const line = linesToUse[i];
          const match = line.match(/^(\s*title:\s*)(["']?)(.*?)\2\s*$/);
          if (match) {
            const prefix = match[1];
            const quote = match[2] || '"';
            const titleText = match[3];
            linesToUse[i] = `${prefix}${quote}[Part ${partNum}] ${titleText}${quote}`;
            break;
          }
        }
      }
      output += linesToUse.join("\n") + "\n";
    });
    
    if (isLastPart) {
      output += "\n# 🎉 提示：所有簡報內容已全數規劃完畢！\n";
    } else {
      output += "\n# ⚠️ 提示：簡報尚未完全規劃完畢，請繼續複製並生成下一組分段 (Part)。\n";
    }
    
    return output;
  }

  function renderSplitParts(parts) {
    yamlSplitResults.innerHTML = "";
    yamlSplitResults.className = "";
    
    parts.forEach((part) => {
      const partCard = document.createElement("div");
      partCard.className = "split-part-card";
      
      const header = document.createElement("div");
      header.className = "split-part-header";
      
      const title = document.createElement("div");
      title.className = "split-part-title";
      title.innerHTML = `📦 Part ${part.partNum} <span class="split-part-badge">${part.pageRange}</span>`;
      
      const copyBtn = document.createElement("button");
      copyBtn.className = "action-btn copy-btn";
      copyBtn.style.padding = "4px 10px";
      copyBtn.style.fontSize = "12px";
      copyBtn.innerHTML = `<span>📋 複製此段</span>`;
      
      header.appendChild(title);
      header.appendChild(copyBtn);
      
      const textarea = document.createElement("textarea");
      textarea.className = "split-part-textarea";
      textarea.readOnly = true;
      textarea.value = part.yaml;
      
      partCard.appendChild(header);
      partCard.appendChild(textarea);
      
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(part.yaml)
          .then(() => {
            const origText = copyBtn.innerHTML;
            copyBtn.innerHTML = `<span>✓ 已複製！</span>`;
            copyBtn.style.background = "#2ecc71";
            copyBtn.style.borderColor = "#2ecc71";
            
            setTimeout(() => {
              copyBtn.innerHTML = origText;
              copyBtn.style.background = "";
              copyBtn.style.borderColor = "";
            }, 2000);
          })
          .catch(err => {
            console.error("複製失敗：", err);
            alert("複製失敗，請手動複製文字框內容。");
          });
      });
      
      yamlSplitResults.appendChild(partCard);
    });
  }

  // SLIDE NARRATIVE WORKSPACE INITIALIZATION
  const singleModeBtn = document.getElementById("mode-single-btn");
  const dialogueModeBtn = document.getElementById("mode-dialogue-btn");
  const singleRoleContainer = document.getElementById("single-role-container");
  const dialogueRoleContainer = document.getElementById("dialogue-role-container");

  if (singleModeBtn && dialogueModeBtn && singleRoleContainer && dialogueRoleContainer) {
    singleModeBtn.addEventListener("click", () => setSpeechMode("single"));
    dialogueModeBtn.addEventListener("click", () => setSpeechMode("dialogue"));
  }

  const narrativeTopicInput = document.getElementById("narrative-topic-input");
  const narrativeRoleSelect = document.getElementById("narrative-role-select");
  const narrativeRoleCustom = document.getElementById("narrative-role-custom");
  const narrativeBackgroundInput = document.getElementById("narrative-background-input");
  const narrativeToneSelect = document.getElementById("narrative-tone-select");
  const narrativeLengthSelect = document.getElementById("narrative-length-select");
  const narrativeStructureSelect = document.getElementById("narrative-structure-select");
  const narrativeDirectivesInput = document.getElementById("narrative-directives-input");

  if (narrativeStructureSelect) {
    narrativeStructureSelect.addEventListener("change", () => {
      const val = narrativeStructureSelect.value;
      if (val.includes("雙人對話") && currentSpeechMode !== "dialogue") {
        setSpeechMode("dialogue");
      } else if (!val.includes("雙人對話") && currentSpeechMode !== "single") {
        setSpeechMode("single");
      }
    });
  }

  // Dual Dialogue Inputs
  const dialogueRoleATitle = document.getElementById("dialogue-role-a-title");
  const dialogueRoleABg = document.getElementById("dialogue-role-a-bg");
  const dialogueRoleBTitle = document.getElementById("dialogue-role-b-title");
  const dialogueRoleBBg = document.getElementById("dialogue-role-b-bg");

  const narrativeInputs = [
    narrativeTopicInput, narrativeRoleSelect, narrativeRoleCustom, narrativeBackgroundInput,
    narrativeToneSelect, narrativeLengthSelect, narrativeStructureSelect, narrativeDirectivesInput,
    dialogueRoleATitle, dialogueRoleABg, dialogueRoleBTitle, dialogueRoleBBg
  ];

  narrativeInputs.forEach(input => {
    if (input) {
      input.addEventListener("input", updateNarrativePrompt);
      input.addEventListener("change", updateNarrativePrompt);
    }
  });

  const narrativeTagPills = document.querySelectorAll(".narrative-tag-pill");
  const NARRATIVE_TAG_TOPICS = {
    "科普教學": "關於「大自然的水循環與氣候變遷」科普教學簡報",
    "工業技術": "關於「化工廠精餾系統操作優化與安全防護」技術培訓簡報",
    "商業簡報": "關於「AI 創新科技在智慧零售的應用與未來展望」商業提案簡報",
    "理財分享": "關於「存股心法與家庭資產配置複利效應」理財規劃簡報",
    "產品介紹": "關於「最新旗艦降噪藍牙耳機規格與功能評測」產品開箱簡報",
    "法規宣導": "關於「公司企業誠信經營與反貪腐法規合規宣導」簡報",
    "人生智慧": "關於「論語智慧與現代職場人際關係引導」哲理簡報"
  };

  narrativeTagPills.forEach(pill => {
    pill.addEventListener("click", () => {
      narrativeTagPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      
      const tagValue = pill.getAttribute("data-tag");
      if (narrativeTopicInput && NARRATIVE_TAG_TOPICS[tagValue]) {
        narrativeTopicInput.value = NARRATIVE_TAG_TOPICS[tagValue];
        updateNarrativePrompt();
      }
    });
  });

  const NARRATIVE_PRESETS = {
    technical: {
      mode: "single",
      topic: "化工廠精餾系統底重沸器管線操作與閥門切換技術簡報",
      role: "技術專家 (工程師/科學家)",
      custom: "",
      background: "擁有 20 年一線精餾塔操作運轉與 DCS 調試經驗",
      tone: "專業嚴謹、邏輯清晰、用語精確",
      length: "50-300字 (結構適中，約0.5-2分鐘解說)",
      structure: "逐頁解說 + 轉場引導 (包含上一頁到下一頁的口語轉接句)",
      directives: "特別針對製程流程圖頁面（PFD）加強管線介質與閥門開啟先後順序的口說引導，口白要有一線人員的務實口吻。"
    },
    science: {
      mode: "single",
      topic: "大自然的水循環與全球氣候變遷科學教學簡報",
      role: "通識科普講師",
      custom: "",
      background: "擅長將深奧科學原理解碼為日常趣味比喻的科普作家",
      tone: "生動風趣、通俗易懂、善用日常比喻",
      length: "50-300字 (結構適中，約0.5-2分鐘解說)",
      structure: "逐頁解說 + 重點整理 (標示每頁主題與 3 個重點項目)",
      directives: "多用「想像一下...」或問句開頭，將蒸發、凝結比喻成煮開水與冰水杯壁的露水，適合國中學生聽講。"
    },
    business: {
      mode: "single",
      topic: "AI 創新科技在智慧零售人流分析系統的應用商業簡報",
      role: "資深產品經理 (PM)",
      custom: "",
      background: "具備多年 SaaS 產品規劃與企業客戶提案經驗的資深經理",
      tone: "具說服力、直擊痛點、極具商業氣場",
      length: "150字以內 (極簡精煉，約30秒解說)",
      structure: "逐頁解說 + 重點整理 (標示每頁主題與 3 個重點項目)",
      directives: "簡報口白聚焦在產品如何幫客戶『降低 30% 損耗率』與『提升 15% 提袋率』，用詞明快精煉，直擊商業價值。"
    },
    law: {
      mode: "single",
      topic: "公司企業誠信經營與反貪腐法規合規宣導簡報",
      role: "法規監察與合規官",
      custom: "",
      background: "具備多年企業合規審查與法律風險防範經驗的資深法務專家",
      tone: "穩重客觀、條理分明、強調合規與預防",
      length: "50-300字 (結構適中，約0.5-2分鐘解說)",
      structure: "逐頁解說 + 重點整理 (標示每頁主題與 3 個重點項目)",
      directives: "用語應嚴謹客觀且條理分明，重點提醒法規風險防範與案例警示，強調企業誠信經營之核心價值。"
    },
    wisdom: {
      mode: "single",
      topic: "論語智慧與現代職場人際關係引導簡報",
      role: "心靈導師 / 人生教練",
      custom: "",
      background: "深研中西哲學與個人成長諮商十餘年、擅長引導心靈反思的人生導師",
      tone: "溫和謙遜、睿智溫暖、啟發心靈與感悟",
      length: "50-300字 (結構適中，約0.5-2分鐘解說)",
      structure: "逐頁解說 + 重點整理 (標示每頁主題與 3 個重點項目)",
      directives: "用詞需溫柔且富有洞察力，適當融入古人哲理與生活反思，幫助聽眾將職場摩擦轉化為自我修煉的契機。"
    },
    "dialogue-finance": {
      mode: "dialogue",
      topic: "關於「家庭資產配置與存股複利效應」雙人理財對談簡報",
      roleATitle: "節目主持人 (Host A)",
      roleABg: "負責開場、話題引導、代表一般大眾提出財務痛點與轉場穿針引線",
      roleBTitle: "資深理財專家 (Guest B)",
      roleBBg: "擁有 20 年資產配置與存股心法經驗，能將複雜金融概念極簡比喻說明",
      tone: "白話易懂、循序漸進、適合初學者",
      length: "50-300字 (結構適中，約0.5-2分鐘解說)",
      structure: "雙人對話逐頁解說 (A: 主持人 + B: 來賓對談，符合自動匯入規範)",
      directives: "對白必須使用 A: 與 B: 標籤並採用換行分段格式。A 負責拋出大眾關心的理財疑問，B 負責給出極具說服力的解答。"
    },
    "dialogue-tech": {
      mode: "dialogue",
      topic: "關於「離心式轉動設備機械振動診斷與預測維護」技術專訪簡報",
      roleATitle: "資深產品經理 (Host A / PM)",
      roleABg: "代表現場維修工程師與高層主管提出工廠維運痛點與安全考量",
      roleBTitle: "振動診斷首席專家 (Guest B)",
      roleBBg: "擁有 25 年旋轉機械振動分析與 ISO 10816 規範評估權威經驗",
      tone: "專業嚴謹、邏輯清晰、用語精確",
      length: "50-300字 (結構適中，約0.5-2分鐘解說)",
      structure: "雙人對話逐頁解說 (A: 主持人 + B: 來賓對談，符合自動匯入規範)",
      directives: "對答呈現工業現場權威交流感，針對 PFD 圖與振動頻譜頁面加強一問一答的口說引導。"
    },
    "dialogue-wisdom": {
      mode: "dialogue",
      topic: "關於「論語智慧與現代職場人際關係引導」雙人生智慧哲理對談簡報",
      roleATitle: "職場對談主持人 (Host A)",
      roleABg: "負責開場引言、分享現代職場溝通與困頓情境、代表聽眾提出反思問題",
      roleBTitle: "心靈導師 / 人生教練 (Guest B)",
      roleBBg: "深研中西哲學與個人成長諮商十餘年，擅長融會古今哲理給予溫暖與睿智啟發",
      tone: "溫和謙遜、睿智溫暖、啟發心靈與感悟",
      length: "50-300字 (結構適中，約0.5-2分鐘解說)",
      structure: "雙人對話逐頁解說 (A: 主持人 + B: 來賓對談，符合自動匯入規範)",
      directives: "對話用語需溫柔富有洞察力。角色 A 提問職場困境或情緒拉扯，角色 B 帶入哲言智慧與日常透徹反思，引導學員轉化心境。"
    }
  };

  function loadNarrativePreset(key) {
    const preset = NARRATIVE_PRESETS[key];
    if (!preset) return;

    if (preset.mode) {
      setSpeechMode(preset.mode);
    }

    if (narrativeTopicInput) narrativeTopicInput.value = preset.topic;
    if (preset.mode === "single") {
      if (narrativeRoleSelect) narrativeRoleSelect.value = preset.role;
      if (narrativeRoleCustom) narrativeRoleCustom.value = preset.custom;
      if (narrativeBackgroundInput) narrativeBackgroundInput.value = preset.background;
    } else if (preset.mode === "dialogue") {
      if (dialogueRoleATitle) dialogueRoleATitle.value = preset.roleATitle;
      if (dialogueRoleABg) dialogueRoleABg.value = preset.roleABg;
      if (dialogueRoleBTitle) dialogueRoleBTitle.value = preset.roleBTitle;
      if (dialogueRoleBBg) dialogueRoleBBg.value = preset.roleBBg;
    }

    if (narrativeToneSelect) narrativeToneSelect.value = preset.tone;
    if (narrativeLengthSelect) narrativeLengthSelect.value = preset.length;
    if (narrativeStructureSelect) narrativeStructureSelect.value = preset.structure;
    if (narrativeDirectivesInput) narrativeDirectivesInput.value = preset.directives;

    ["technical", "science", "business", "law", "wisdom", "dialogue-finance", "dialogue-tech", "dialogue-wisdom"].forEach(k => {
      const btn = document.getElementById(`narrative-preset-${k}`);
      if (btn) {
        if (k === key) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      }
    });

    updateNarrativePrompt();
  }

  ["technical", "science", "business", "law", "wisdom", "dialogue-finance", "dialogue-tech", "dialogue-wisdom"].forEach(key => {
    const btn = document.getElementById(`narrative-preset-${key}`);
    if (btn) {
      btn.addEventListener("click", () => loadNarrativePreset(key));
    }
  });

  const copyNarrativeBtn = document.getElementById("copy-narrative-btn");
  const narrativePromptOutput = document.getElementById("narrative-prompt-output");
  if (copyNarrativeBtn && narrativePromptOutput) {
    copyNarrativeBtn.addEventListener("click", () => {
      const textToCopy = narrativePromptOutput.textContent;
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          copyNarrativeBtn.classList.add("success");
          const origText = copyNarrativeBtn.querySelector(".btn-text").textContent;
          copyNarrativeBtn.querySelector(".btn-text").textContent = "✓ 已複製簡報口白指令！";
          
          setTimeout(() => {
            copyNarrativeBtn.classList.remove("success");
            copyNarrativeBtn.querySelector(".btn-text").textContent = origText;
          }, 2000);
        })
        .catch(err => {
          console.error("複製失敗：", err);
          alert("複製失敗，請手動選取文字複製。");
        });
    });
  }

  // Initial load for narrative workspace
  loadNarrativePreset("technical");
}

// Global speech mode state & switcher
let currentSpeechMode = "single";

function setSpeechMode(mode) {
  currentSpeechMode = mode;
  const singleModeBtn = document.getElementById("mode-single-btn");
  const dialogueModeBtn = document.getElementById("mode-dialogue-btn");
  const singleRoleContainer = document.getElementById("single-role-container");
  const dialogueRoleContainer = document.getElementById("dialogue-role-container");
  const structureSelectEl = document.getElementById("narrative-structure-select");

  if (mode === "single") {
    if (singleModeBtn) singleModeBtn.classList.add("active");
    if (dialogueModeBtn) dialogueModeBtn.classList.remove("active", "dialogue-active");
    if (singleRoleContainer) singleRoleContainer.style.display = "block";
    if (dialogueRoleContainer) dialogueRoleContainer.style.display = "none";
    if (structureSelectEl && structureSelectEl.value.includes("雙人對話")) {
      structureSelectEl.value = "逐頁解說 + 重點整理 (標示每頁主題與 3 個重點項目)";
    }
  } else {
    if (singleModeBtn) singleModeBtn.classList.remove("active");
    if (dialogueModeBtn) dialogueModeBtn.classList.add("active", "dialogue-active");
    if (singleRoleContainer) singleRoleContainer.style.display = "none";
    if (dialogueRoleContainer) dialogueRoleContainer.style.display = "flex";
    if (structureSelectEl && !structureSelectEl.value.includes("雙人對話")) {
      structureSelectEl.value = "雙人對話逐頁解說 (A: 主持人 + B: 來賓對談，符合自動匯入規範)";
    }
  }
  updateNarrativePrompt();
}

// Global update function for Slide Narrative Prompt
function updateNarrativePrompt() {
  const topicInputEl = document.getElementById("narrative-topic-input");
  const topic = (topicInputEl ? topicInputEl.value.trim() : "") || "未設定簡報主題";

  const toneSelectEl = document.getElementById("narrative-tone-select");
  const tone = toneSelectEl ? toneSelectEl.value : "專業嚴謹、邏輯清晰、用語精確";
  const lengthSelectEl = document.getElementById("narrative-length-select");
  const length = lengthSelectEl ? lengthSelectEl.value : "50-300字 (結構適中)";
  const structureSelectEl = document.getElementById("narrative-structure-select");
  const structure = structureSelectEl ? structureSelectEl.value : "逐頁解說 + 重點整理";
  const directivesInputEl = document.getElementById("narrative-directives-input");
  const directives = (directivesInputEl ? directivesInputEl.value.trim() : "") || "無特殊微調指令";

  const isDialogueMode = (currentSpeechMode === "dialogue");

  let finalPrompt = "";

  if (isDialogueMode) {
    // Dual Person Dialogue Prompt Logic
    const roleATitleEl = document.getElementById("dialogue-role-a-title");
    const roleATitle = (roleATitleEl ? roleATitleEl.value.trim() : "") || "節目主持人 (Host A)";
    const roleABgEl = document.getElementById("dialogue-role-a-bg");
    const roleABg = (roleABgEl ? roleABgEl.value.trim() : "") || "負責開場、引導議題討論與提問";

    const roleBTitleEl = document.getElementById("dialogue-role-b-title");
    const roleBTitle = (roleBTitleEl ? roleBTitleEl.value.trim() : "") || "特邀領域專家 (Guest B)";
    const roleBBgEl = document.getElementById("dialogue-role-b-bg");
    const roleBBg = (roleBBgEl ? roleBBgEl.value.trim() : "") || "擁有實務權威經驗，負責權威精闢解答";

    finalPrompt = `你是一位簡報講解專家與雙人對話廣播/配音導演。請閱讀我所提供的來源簡報文檔（或簡報內容大綱），並針對主題「${topic}」為我產出高品質、符合 Speaker Tags 規範與自動配音匯入標準的【雙人對談講解口白與腳本】。

━━━━━━━━ 🎙️ NOTEBOOKLM SLIDE NARRATIVE PROMPT (雙人對談版) ━━━━━━━

【一、雙人對談角色人設與任務】
- 🔷 角色 A (主講人 / Host)：${roleATitle}
  - 任務與風格：${roleABg}
  - 發言標籤：A: （必須在每次發言最開頭加上 "A:" 或 "A：" 標籤）
- 💜 角色 B (對談者 / Guest)：${roleBTitle}
  - 專業背景：${roleBBg}
  - 發言標籤：B: （必須在每次發言最開頭加上 "B:" 或 "B：" 標籤）
- 對談口語調性：${tone} (對答時請嚴格以此風格展現)

【二、簡報口白設定與要求】
- 簡報主題：${topic}
- 單頁字數長度：${length}
- 口白輸出結構：雙人對話逐頁解說 (Host & Guest 對談腳本)

【三、雙人對話格式與頻繁對答規範 (依據雙人對話腳本指南)】
請針對來源簡報中的每一頁（從第 1 頁封面開始，依序至最後一頁），提供對應的雙人對答口白腳本。每頁格式必須嚴格遵守以下要求：
1. 頁面標頭格式：【第 X 頁：該頁標題/大綱】
2. 發言標籤規範：
   - 角色 A 發言前請統一加標籤 "A: "（或 "A："）
   - 角色 B 發言前請統一加標籤 "B: "（或 "B："）
3. 【核心要求：每一頁都必須包含多回合頻繁對答 (有來有往)】：
   - **每一頁的解說絕對嚴禁只有單次一問一答（嚴禁 A 講一句、B 講一句就結束）**。
   - **每一頁必須包含至少 2 至 4 個回合（即 4~8 句）的角色 A 與 角色 B 交替對白**，創造頻繁、流暢且真實的對話張力！
   - 對話交替推進結構：
     - 回合一 (引題開場)：A 拋出該頁主題或聽眾最好奇的痛點現象，B 給出核心初步解答。
     - 回合二 (追問探討)：A 針對簡報畫面中的具體數據、圖表或步驟進行追問（例如：「聽起來很有道理，但實務上該怎麼執行？」或「這項參數代表什麼意義？」），B 深入剖析具體機制與操作細節。
     - 回合三/四 (總結與轉場)：A 進行重點歸納或心得共鳴（例如：「原來如此！所以關鍵在於...」），B 補充溫馨提醒或關鍵總結，最後由 A 自然帶出下一頁主題的過渡引導。
4. 採用換行分段書寫（最推薦與清晰易讀）：
   【第 X 頁：主題名稱】
   A: 各位好，今天我們要深入探討這項關鍵議題。
   B: 沒錯！這項主題在實際操作中非常關鍵，大家可以看到畫面中的重點...
   A: 專家，您剛才提到這個關鍵點，那在實務上大家最容易踩到什麼坑？
   B: 這問得非常好！大家最容易忽略的是第二個步驟的細節...
   A: 原來是這樣！那有沒有什麼好方法可以避免？
   B: 只要記住先評估再執行的六字口訣...
5. 口語對話感與語言張力：
   - 善用自然對話連結詞（如「等等，專家您剛才提到...」、「這確實是很多人的痛點！」、「沒錯，但很多人忽略了這個關鍵...」、「原來如此！那如果遇到...該怎麼處理？」）。
   - 嚴禁單一角色單次長篇大論，每次發言請控制在 30-70 字內，保持輕快、有來有往的高互動對談體感。

【四、客製微調指令】
- 敘事與微調指示：
  ${directives}

【五、輸出與 TTS 防崩潰約束】
- 所有對講口白均應使用繁體中文（台灣）呈現，語氣要像是兩人現場口頭報告或對話般自然、生動且具互動感。
- 嚴格僅依據上傳的簡報內容大綱進行解說與提煉，不可憑空捏造簡報中未提及的實證數據或事實。
- 【內文符號避坑】：句中內文中嚴禁單獨出現獨立的 "A:" 或 "B:" 字樣，以免自動解析器誤判為角色切換。
- 【標點符號規範】：句子之間請使用標準標點符號（如逗號「，」、句號「。」、問號「？」、感嘆號「！」），系統將依據標點符號自動切分字幕與配音動態對齊。
- 口白與字幕文本中嚴禁出現任何不必要的星號「*」（例如用以表示粗體或強調的 ** 或 *），請一律以純文字格式輸出。
- 【重要：語音合成防崩潰限制】：
  1. 嚴禁在口白與配音內文中使用「雞排」及任何讀音為 jī pái 的諧音字（如：炸雞排、吉排、積排、基牌等），請以「下午茶」、「點心」、「雞肉排」或「炸雞」等字眼替代。
  2. 嚴禁在口白與配音內文中使用任何中英文引號（如「」、『』、“”）、書名號（如《》）或括號（如()、[]、{}），請以純文字或空格取代，以防止微調 TTS 解析時無聲或生成失敗。`;

  } else {
    // Single Presenter Logic
    const roleSelectEl = document.getElementById("narrative-role-select");
    const roleVal = roleSelectEl ? roleSelectEl.value : "技術專家 (工程師/科學家)";
    const roleCustomEl = document.getElementById("narrative-role-custom");
    const roleCustom = roleCustomEl ? roleCustomEl.value.trim() : "";
    const role = roleVal === "自訂人設" && roleCustom ? roleCustom : roleVal;

    const bgInputEl = document.getElementById("narrative-background-input");
    const background = (bgInputEl ? bgInputEl.value.trim() : "") || "未設定專業背景";

    let structureGuide = "";
    if (structure.includes("重點整理")) {
      structureGuide = `請在每頁的口白下方，以條列式列出 3 個「本頁核心重點整理 (Key Takeaways)」，方便簡報錄製者快速抓到核心要點。`;
    } else if (structure.includes("轉場引導")) {
      structureGuide = `請在每頁的口白結尾處，自然融入一兩句轉場銜接句子，能順暢銜接下一頁簡報的主題內容，讓簡報錄影的語氣聽起來自然流暢、一氣呵成。請直接將此轉場銜接句接在口白尾端，嚴禁加註「(轉場引導句)」、「轉場引導：」等任何註記、括號或星號。`;
    } else {
      structureGuide = `請僅輸出純口白逐字稿。無須輸出多餘的標題標記、重點整理或轉場說明，以利錄音設備直接朗讀或轉換為旁白音軌。`;
    }

    finalPrompt = `你是一位簡報講解專家與幕後口白配音導演。請閱讀我所提供的來源簡報文檔（或簡報內容大綱），並針對主題「${topic}」為我產出高品質、符合特定角色人設與口說調性的簡報講解口白與腳本。

━━━━━━━━ 🎙️ NOTEBOOKLM SLIDE NARRATIVE PROMPT ━━━━━━━

【一、講解者角色人設】
- 角色身份：${role}
- 專業背景經歷：${background}
- 口語調性風格：${tone} (講解時請嚴格以此風格發言)

【二、簡報口白設定與要求】
- 簡報主題：${topic}
- 單頁字數長度：${length}
- 口白輸出結構：${structure}

【三、結構引導要求】
請針對來源簡報中的每一頁（從第 1 頁封面開始，依序至最後一頁），提供對應的口白腳本。每頁的口白與格式必須嚴格遵守以下要求：
1. 口白格式為：【第 X 頁：該頁標題/大綱】該頁口白解說內文
   （例如：【第 1 頁：化工製程介紹】大家好，今天我們要討論的是精餾系統的操作優化...）
2. 【結構與附加要求】：
   ${structureGuide}

【四、客製微調指令】
- 敘事與微調指示：
  ${directives}

【五、輸出約束】
- 所有講解口白均應使用繁體中文（台灣）呈現，語氣要像是一對口頭報告般自然、生動且具口語感。
- 嚴格僅依據上傳的簡報內容大綱進行解說與提煉，不可憑空捏造簡報中未提及的實證數據或事實。
- 口白與字幕文本中嚴禁出現任何不必要的星號「*」（例如用以表示粗體或強調的 ** 或 *），請一律以純文字格式輸出。
- 如果包含轉場引導句，請直接將轉場句子自然連貫地接在口白解說內文的最末尾，絕對不需要且嚴禁額外加註「(轉場引導句)」、「轉場引導：」等任何標籤、括號或註記。
- 【重要：語音合成防崩潰限制】：
  1. 嚴禁在口白與配音內文中使用「雞排」及任何讀音為 jī pái 的諧音字（如：炸雞排、吉排、積排、基牌等），請以「下午茶」、「點心」、「雞肉排」或「炸雞」等字眼替代。
  2. 嚴禁在口白與配音內文中使用任何中英文引號（如「」、『』、“”）、書名號（如《》）或括號（如()、[]、{}），請以純文字或空格取代，以防止微調 TTS 解析時無聲或生成失敗。`;
  }

  const outputEl = document.getElementById("narrative-prompt-output");
  if (outputEl) {
    outputEl.textContent = finalPrompt;
  }
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", init);

