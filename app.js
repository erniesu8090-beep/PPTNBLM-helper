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
        } else if (targetTab === "mascot-guide") {
          headerTitle.textContent = "簡報吉祥物視覺貫穿 (Mascot Continuity)";
          headerDesc.textContent = "統一角色生圖規範，讓投影片每一頁都擁有連貫且生動的故事引導主角";
        }
      }

      if (headerElement) {
        headerElement.classList.remove("theme-ppt", "theme-narrative", "theme-mascot");
        if (targetTab === "presentation-helper") {
          headerElement.classList.add("theme-ppt");
        } else if (targetTab === "slide-narrative") {
          headerElement.classList.add("theme-narrative");
        } else if (targetTab === "mascot-guide") {
          headerElement.classList.add("theme-mascot");
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
      
      // Guaranteed inline display toggle for absolute collapse
      pptPromptBox.style.display = isCollapsed ? "none" : "block";
      
      const icon = togglePptPromptBtn.querySelector(".toggle-icon");
      const text = togglePptPromptBtn.querySelector(".toggle-text");
      
      if (icon) {
        icon.style.transform = isCollapsed ? "rotate(180deg)" : "rotate(0deg)";
      }
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

    Object.keys(NARRATIVE_PRESETS).forEach(k => {
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

  Object.keys(NARRATIVE_PRESETS).forEach(key => {
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

  // Initial load for design style gallery
  initDesignStyleGallery();

  // Initial load for mascot feature
  initMascotFeature();
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
1. 頁面標頭格式：【第 X 頁：該頁標題/大綱】（⚠️ 註：【第 X 頁：標題】僅作為腳本分頁結構標籤，對話語音內容開頭絕對嚴禁唸出「第 X 頁」或「第一頁」）
2. 發言標籤規範：
   - 角色 A 發言前請統一加標籤 "A: "（或 "A："）
   - 角色 B 發言前請統一加標籤 "B: "（或 "B："）
3. 【核心要求：每一頁都必須包含多回合頻繁對答 (有來有往)】：
   - **每一頁的解說絕對嚴禁只有單次一問一答（嚴禁 A 講一句、B 講一句就結束）**。
   - **每一頁必須包含至少 2 至 4 個回合（即 4~8 句）的角色 A 與 角色 B 交替對白**，創造頻繁、流暢且真實的對話張力！
   - 對話交替推進結構：
     - 回合一 (引題開場)：A 拋出該頁主題或聽眾最好奇的痛點現象，B 給出核心初步解答。（⚠️ 開場請直接自然切入主題，絕對勿講「第 1 頁」、「第一頁」等死板開頭）
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
5. 口語對話感與自然開頭規範：
   - 【禁止死板開頭】：每頁對話開頭絕對不要提到「第 X 頁」、「第一頁」、「在這一頁」或念出頁碼標題，必須直接自然流暢地切入主題、問題、畫面或情境，讓對白生動真實。
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
   ⚠️【開頭自然流暢規範】：【第 X 頁：標題】僅作為文檔結構標籤，口白解說內文開頭**絕對嚴禁出現「第 X 頁」、「第一頁」、「在這一頁」或念出頁碼標題**！請直接自然流暢切入該頁主題、聽眾痛點或畫面重點。
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

/* ==========================================================================
   MASCOT CONTINUITY ENGINE & PRESETS
   ========================================================================== */

const MASCOT_PRESETS = {
  male_engineer: {
    name: "男性工安工程師 (CPC 安全帽)",
    roleText: "使用來源中定義的男性 Q版工程師角色（戴有 CPC 標誌黃色安全帽）作為全簡報視覺主角",
    promptSnippet: "a cute chibi male engineer wearing a yellow safety helmet with CPC logo",
    prompt: "A cute chibi male engineer character design, wearing a yellow safety helmet with CPC logo, professional work clothes, and safety shoes. 2.5D illustration style, 3D isometric, exquisite material details, soft lighting, clean solid white background, full body composition, high quality, masterpiece, 8k resolution."
  },
  female_engineer: {
    name: "女性工安工程師 (CPC 安全帽)",
    roleText: "使用來源中定義的女性 Q版工程師角色（戴有 CPC 標誌黃色安全帽）作為全簡報視覺主角",
    promptSnippet: "a cute chibi female engineer wearing a yellow safety helmet with CPC logo",
    prompt: "A cute chibi female engineer character design, wearing a yellow safety helmet with CPC logo, professional work clothes, and safety shoes. 2.5D illustration style, 3D isometric, exquisite material details, soft lighting, clean solid white background, full body composition, high quality, masterpiece, 8k resolution."
  },
  male_manager: {
    name: "男性商業顧問/PM",
    roleText: "使用來源中定義的男性 Q版商業顧問角色作為全簡報視覺主角",
    promptSnippet: "a cute chibi male business manager wearing a suit",
    prompt: "A cute chibi male business manager character design, wearing a smart dark suit, neat hair, holding a tablet computer. 2.5D illustration style, 3D isometric, clean solid white background, full body, soft studio lighting, high quality, masterpiece, 8k resolution."
  },
  female_manager: {
    name: "女性商業顧問/PM",
    roleText: "使用來源中定義的女性 Q版商業顧問角色作為全簡報視覺主角",
    promptSnippet: "a cute chibi female business manager wearing a suit blazer",
    prompt: "A cute chibi female business manager character design, wearing a stylish suit blazer, professional look, holding a tablet computer. 2.5D illustration style, 3D isometric, clean solid white background, full body, soft studio lighting, high quality, masterpiece, 8k resolution."
  },
  male_teacher: {
    name: "男性科普講師",
    roleText: "使用來源中定義的男性 Q版科普講師角色作為全簡報視覺主角",
    promptSnippet: "a cute chibi male teacher wearing glasses and vest",
    prompt: "A cute chibi male teacher character design, wearing glasses, a smart casual vest and shirt, holding a pointer stick, friendly expression. 2.5D illustration style, 3D isometric, clean solid white background, full body, soft lighting, 8k resolution."
  },
  female_teacher: {
    name: "女性科普講師",
    roleText: "使用來源中定義的女性 Q版科普講師角色作為全簡報視覺主角",
    promptSnippet: "a cute chibi female teacher wearing glasses and blazer",
    prompt: "A cute chibi female teacher character design, wearing glasses, a smart casual blazer, holding a pointer stick, warm friendly expression. 2.5D illustration style, 3D isometric, clean solid white background, full body, soft lighting, 8k resolution."
  },
  neutral_robot: {
    name: "可愛 AI 機器人夥伴",
    roleText: "使用來源中定義的可愛 AI 浮空機器人夥伴作為全簡報視覺主角",
    promptSnippet: "a cute floating friendly AI robot mascot",
    prompt: "A cute floating friendly AI robot mascot character design, futuristic sleek metallic white and cyan finish, glowing blue eyes, friendly expression. 3D isometric, clean solid white background, full body, soft studio lighting, masterpiece, 8k resolution."
  }
};

const MASCOT_ROLE_MAP = {
  "男性 Q版工程師": "male_engineer",
  "女性 Q版工程師": "female_engineer",
  "男性 Q版商業顧問/PM": "male_manager",
  "女性 Q版商業顧問/PM": "female_manager",
  "男性 Q版科普講師": "male_teacher",
  "女性 Q版科普講師": "female_teacher",
  "可愛 AI 浮空機器人": "neutral_robot"
};

function buildGlobalPptPrompt(mascotKey = "none", styleOption = "2.5D 3D Isometric 立體卡片去背風", styleKey = currentDesignStyleKey, dualKeyB = null) {
  const isDual = mascotKey !== "none" && dualKeyB && dualKeyB !== "none";
  const hasMascot = mascotKey && mascotKey !== "none" && MASCOT_PRESETS[mascotKey];
  const mascotInfoA = hasMascot ? MASCOT_PRESETS[mascotKey] : null;
  const mascotInfoB = isDual ? MASCOT_PRESETS[dualKeyB] : null;
  const designStyle = (typeof DESIGN_STYLES !== "undefined" && DESIGN_STYLES[styleKey]) ? DESIGN_STYLES[styleKey] : null;

  let mascotDirectiveInSchema = "";
  let mascotRuleInPrompt = "";

  if (isDual && mascotInfoA && mascotInfoB) {
    mascotDirectiveInSchema = `
  mascot_anchors:
    primary_host: "${mascotInfoA.name} (主講/主持人)"
    co_host: "${mascotInfoB.name} (解答/協同者)"
    style: "${styleOption}"
    auto_composition_logic:
      rule: "根據每頁內容主題自動在【左右對分構圖】與【主次輔助構圖】之間切換"
      dialogue_mode: "對比、辯論與數據頁採用『角色 A (左下角) ↔ 角色 B (右下角)，眼神聚焦中央卡片』"
      assistant_mode: "單一重點、警示與總結頁採用『角色 A (主講大標題)，角色 B (小尺寸點綴於 Callout 提示框旁)』"
      visual_cleanliness: "畫面極致簡潔高雅，嚴禁對話氣泡與漫畫框"`;

    mascotRuleInPrompt = `
- 【📐 雙主角投影片 AI 自適應構圖規範 (Smart Dual Composition)】：
  請根據每一頁投影片的主題與對話脈絡，**自動選擇最具視覺表現力的構圖方式**（畫面保持極致乾淨，嚴禁加入對話氣泡與文字漫畫框）：
  1. **【左右對位構圖 (Left-Right Dialogue)】** (適用於：對比頁、討論頁、案例數據分析頁)：
     - 角色 A (${mascotInfoA.name}) 固定於【左下角】，眼神指向右側大標題。
     - 角色 B (${mascotInfoB.name}) 固定於【右下角】，眼神指向左側數據圖表。
     - 畫面中央為核心資訊卡片，打造臨場雙人對談感。
  2. **【主次輔助構圖 (Primary & Assistant)】** (適用於：封面頁、單一重點頁、風險警示頁、結尾致謝頁)：
     - 角色 A (${mascotInfoA.name}) 作為【左側主講者】，引導全頁核心標題。
     - 角色 B (${mascotInfoB.name}) 採用【小尺寸】，浮空或靜置於右側關鍵 Callout 高亮提示框旁進行重點補充。`;
  } else if (hasMascot) {
    mascotDirectiveInSchema = `
  mascot_anchor:
    character_description: "${mascotInfoA.roleText}"
    style: "${styleOption}"
    rule: "每一頁簡報的視覺畫面中，必須出現該主角，並根據該頁主題展現適當的互動姿態"`;

    mascotRuleInPrompt = `
- 【吉祥物貫穿規範】：請務必在每一頁投影片的 visual_description 中安排吉祥物主角（${mascotInfoA.name}），配合該頁主題呈現適當姿態（如封面揮手打招呼、數據頁手持指示棒指向 KPI、流程頁向前走、事故頁思考狀、結尾頁致謝）。`;
  }

  let globalSpecSection = "";
  let styleHeaderNotice = "";

  if (designStyle) {
    styleHeaderNotice = `📌 【當前套用之視覺 DNA】：${designStyle.icon} ${designStyle.name} (背景色: ${designStyle.color_scheme.bg} | 強調色: ${designStyle.color_scheme.accent})\n\n`;
    globalSpecSection = `${designStyle.presetYaml}${mascotDirectiveInSchema}`;
  } else {
    globalSpecSection = `global_design_specification:
  atmosphere: ["明亮專業", "極簡俐落", "高可讀性"]
  color_scheme:
    background: "#FFFFFF"
    text: "#1E293B"
    accent: "#2563EB"
    secondary: "#64748B"
  typography:
    heading: "粗體現代無襯線體"
    body: "清晰易讀內文"
  layout_rules:
    navigation: "簡約頁碼標示"
    image_style: "白底去背高品質圖片"
    decorative_elements: "極細分隔線與幾何卡片框"${mascotDirectiveInSchema}`;
  }

  return `${styleHeaderNotice}你是一位頂尖的簡報架構師 (Presentation Architect)。請深入分析目前筆記本中的所有來源文件，並為我規劃**完整且極致豐富**的簡報架構（不要有頁數限制）。你具備以下能力與遵循準則：

【角色定位 (Role Definition)】
- 逆向工程 (Reverse Engineering): 能深入分析來源文件（如 PDF 簡報、視覺圖片），拆解其設計 DNA，包含氛圍、配色邏輯與版面結構。
- 結構生成 (Structure Generation): 能根據純文字來源，規劃出具備敘事邏輯與視覺張力的簡報架構。

【核心任務與行為準則 (Core Tasks & Behavior)】
無論使用者的請求為何，你必須且僅能以 YAML 格式輸出回應（不可包含任何非 YAML 的說明文字）。請嚴格遵守以下邏輯：
- 規劃**完整**的簡報，不要自我設限在 10 頁內。**為了能深入且完整地覆蓋所有內容，簡報的理想總頁數應設定為至少 12 至 30 頁（請根據來源文件的資訊量與複雜度進行最大化的延展規劃，確保沒有遺漏任何子主題、背景脈絡或細部流程）**。
- **深度展開與細節化 (Granularity)**：請將來源文件中的每一個章節、核心論點、運作機制、具體步驟、數據表格、案例分析與後續展望，皆拆解並展開為獨立的投影片頁面。**嚴禁為了精簡而合併多個重要觀點到同一頁中**。
- 每個核心論點規劃為 1 頁（單頁資訊密度為 1 大標題 + 最多 3 個 Bullet points，且在 generation_prompt 中，必須撰寫盡可能詳細、豐富、條理清晰且具備實體細節與排版引導的生成指令，避免過於簡短或抽象描述，以利生成高品質簡報）。
- 當要求「分析」來源時：觀察來源的視覺特徵，提取出 global_design_specification（全域設計規範），並歸納其內容邏輯，轉化為 slide_planning（頁面規劃）。
- 當要求「生成」簡報架構時：根據來源內容的主題，將內容拆解為 slide_planning，確保每一頁都有明確的 visual_description 與 generation_prompt。${mascotRuleInPrompt}
- 移除所有來源的項目編號，確保內容簡潔。
- 生成的簡報內容不要有字體的名字。

【YAML 輸出標準格式 (Output Schema)】
所有輸出內容必須嚴格遵守以下 YAML 架構（不可包含任何非 YAML 的 markdown 說明文字），請務必維持欄位的精簡（特別是描述與指令的長度），以防貼入簡報系統時字數超限：

${globalSpecSection}

slide_planning:
  - page: 1
    type: "頁面功能 (如：封面、對比頁)"
    layout_style: "佈局風格 (如：左右分割、滿版聚焦)"
    visual_description: "畫面視覺與配色描述 (極簡富創意，30字內${hasMascot ? '，包含吉祥物主角互動姿態' : ''})"
    content:
      title: "頁面大標題"
      subtitle: "副標題"
      generation_prompt: "給 AI 的投影片版面文字生成指令 (包含重點列點與邏輯，請提供盡可能詳細、具體且豐富的排版描述與簡報內容細節，生動且富有深度，至少 50-80 字)"

  - page: 2
    # 依此類推，持續規劃後續所有頁面...

【編寫規範 (Rules)】
- 所有字串值必須包裹在雙引號 "" 內。
- 層級縮排必須準確（2 個空格）。
- 若來源資訊不足，請根據專業設計邏輯進行「合理推斷」並填入 YAML 中，而非留白。`;
}

const MASCOT_STYLE_DETAILS = {
  "2.5D 3D Isometric 立體卡片去背風": {
    icon: "🧊",
    img: "images/female_engineer_isometric.png",
    tags: ["3D Isometric", "去背透卡", "科技現代"],
    desc: "💡 視覺特色：極具現代科技感的 3D 微縮幾何場景，角色與物件具備立體去背質感，視覺焦點清晰突出。",
    snippet: "2.5D illustration style, 3D isometric, exquisite material details, soft lighting, clean solid white background",
    color: "#a55eea"
  },
  "3D Q版柔光微縮模型風": {
    icon: "🧸",
    img: "images/male_manager_clay.png",
    tags: ["Q版盲盒", "柔光黏土", "親和療癒"],
    desc: "💡 視覺特色：圓潤可愛的盲盒公仔/黏土模型質感，帶有溫和攝影柔光與軟膠質感，極具親和力與視覺趣味感。",
    snippet: "3D chibi style, soft clay model texture, miniature toy figure, studio soft lighting, cute figurine",
    color: "#00d2d3"
  },
  "扁平簡約質感幾何風": {
    icon: "📐",
    img: "images/neutral_robot_flat.png",
    tags: ["Flat Vector", "商務極簡", "專業俐落"],
    desc: "💡 視覺特色：乾淨優雅的極簡向量插畫，色塊清晰、線條精緻，適合嚴謹的商業簡報、顧問提案與數據報告。",
    snippet: "Flat vector design, minimal geometric shapes, clean corporate style, elegant layout, modern flat illustration",
    color: "#ff9f43"
  },
  "溫馨手繪水彩風格": {
    icon: "🎨",
    img: "images/male_engineer_watercolor.png",
    tags: ["Hand-drawn", "人文水彩", "溫暖故事"],
    desc: "💡 視覺特色：富有人文溫度的水彩渲染與手繪筆觸，色彩柔和自然，特別適合教育培訓、公益宣導與故事演講。",
    snippet: "Warm watercolor texture, hand-drawn illustration, soft pastel color palette, storybook style, artistic",
    color: "#2ecc71"
  }
};

function initMascotFeature() {
  const pptTemplateText = document.getElementById("ppt-template-text");

  const tab1MascotMode = document.getElementById("tab1-mascot-mode");
  const tab1SingleMascotCol = document.getElementById("tab1-single-mascot-col");
  const tab1DualMascotColA = document.getElementById("tab1-dual-mascot-col-a");
  const tab1DualMascotColB = document.getElementById("tab1-dual-mascot-col-b");

  const tab1MascotRole = document.getElementById("tab1-mascot-role");
  const tab1MascotRoleA = document.getElementById("tab1-mascot-role-a");
  const tab1MascotRoleB = document.getElementById("tab1-mascot-role-b");
  const tab1MascotStyle = document.getElementById("tab1-mascot-style");

  const tab1MascotPreviewBox = document.getElementById("tab1-mascot-preview-box");
  const tab1MascotImg = document.getElementById("tab1-mascot-img");
  const tab1MascotTitle = document.getElementById("tab1-mascot-title");
  const tab1MascotDesc = document.getElementById("tab1-mascot-desc");

  window.updateTab1Prompt = function() {
    if (!pptTemplateText) return;
    const mode = tab1MascotMode ? tab1MascotMode.value : "none";
    const styleVal = tab1MascotStyle ? tab1MascotStyle.value : "2.5D 3D Isometric 立體卡片去背風";
    const styleDetails = MASCOT_STYLE_DETAILS[styleVal] || MASCOT_STYLE_DETAILS["2.5D 3D Isometric 立體卡片去背風"];

    if (mode === "none") {
      if (tab1SingleMascotCol) tab1SingleMascotCol.style.display = "none";
      if (tab1DualMascotColA) tab1DualMascotColA.style.display = "none";
      if (tab1DualMascotColB) tab1DualMascotColB.style.display = "none";
      if (tab1MascotPreviewBox) tab1MascotPreviewBox.style.display = "none";

      pptTemplateText.textContent = buildGlobalPptPrompt("none", styleVal, currentDesignStyleKey);
    } else if (mode === "single") {
      if (tab1SingleMascotCol) tab1SingleMascotCol.style.display = "flex";
      if (tab1DualMascotColA) tab1DualMascotColA.style.display = "none";
      if (tab1DualMascotColB) tab1DualMascotColB.style.display = "none";
      if (tab1MascotPreviewBox) tab1MascotPreviewBox.style.display = "flex";

      const roleVal = tab1MascotRole ? tab1MascotRole.value : "男性 Q版工程師";
      const mascotKey = MASCOT_ROLE_MAP[roleVal] || "male_engineer";
      const mascotDetails = MASCOT_PRESETS[mascotKey];

      if (tab1MascotImg && styleDetails) tab1MascotImg.src = styleDetails.img;
      if (tab1MascotTitle && mascotDetails) tab1MascotTitle.textContent = `👤 單主角：${mascotDetails.name}`;
      if (tab1MascotDesc) tab1MascotDesc.textContent = "已將該主角動作與姿態規範注入全域提示詞中！系統將自動在每頁投影片安排該主角對應主題之動作與場景互動。";

      pptTemplateText.textContent = buildGlobalPptPrompt(mascotKey, styleVal, currentDesignStyleKey);
    } else if (mode === "dual") {
      if (tab1SingleMascotCol) tab1SingleMascotCol.style.display = "none";
      if (tab1DualMascotColA) tab1DualMascotColA.style.display = "flex";
      if (tab1DualMascotColB) tab1DualMascotColB.style.display = "flex";
      if (tab1MascotPreviewBox) tab1MascotPreviewBox.style.display = "flex";

      const roleA_Title = tab1MascotRoleA ? tab1MascotRoleA.value : "男性 Q版工程師";
      const roleB_Title = tab1MascotRoleB ? tab1MascotRoleB.value : "女性 Q版商業顧問/PM";

      const keyA = MASCOT_ROLE_MAP[roleA_Title] || "male_engineer";
      const keyB = MASCOT_ROLE_MAP[roleB_Title] || "female_manager";

      const mascotA = MASCOT_PRESETS[keyA];
      const mascotB = MASCOT_PRESETS[keyB];

      if (tab1MascotImg && styleDetails) tab1MascotImg.src = styleDetails.img;
      if (tab1MascotTitle && mascotA && mascotB) tab1MascotTitle.textContent = `👥 雙主角對談：${mascotA.name} ＆ ${mascotB.name}`;
      if (tab1MascotDesc) tab1MascotDesc.textContent = "已將【雙主角簡報對話對位規範】注入全域提示詞！每頁投影片由雙角色分立左右側專註配合數據對話，無漫畫對話框雜訊。";

      pptTemplateText.textContent = buildGlobalPptPrompt(keyA, styleVal, currentDesignStyleKey, keyB);
    }
  };

  if (tab1MascotMode) tab1MascotMode.addEventListener("change", updateTab1Prompt);
  if (tab1MascotRole) tab1MascotRole.addEventListener("change", updateTab1Prompt);
  if (tab1MascotRoleA) tab1MascotRoleA.addEventListener("change", updateTab1Prompt);
  if (tab1MascotRoleB) tab1MascotRoleB.addEventListener("change", updateTab1Prompt);
  if (tab1MascotStyle) tab1MascotStyle.addEventListener("change", updateTab1Prompt);

  // Copy Tab 1 Mascot Image Prompt
  const tab1CopyMascotPromptBtn = document.getElementById("tab1-copy-mascot-prompt-btn");
  if (tab1CopyMascotPromptBtn) {
    tab1CopyMascotPromptBtn.addEventListener("click", () => {
      const mode = tab1MascotMode ? tab1MascotMode.value : "single";
      const styleVal = tab1MascotStyle ? tab1MascotStyle.value : "2.5D 3D Isometric 立體卡片去背風";
      const styleDetails = MASCOT_STYLE_DETAILS[styleVal] || MASCOT_STYLE_DETAILS["2.5D 3D Isometric 立體卡片去背風"];

      let textToCopy = "";
      if (mode === "dual") {
        const roleA_Title = tab1MascotRoleA ? tab1MascotRoleA.value : "男性 Q版工程師";
        const roleB_Title = tab1MascotRoleB ? tab1MascotRoleB.value : "女性 Q版商業顧問/PM";
        const keyA = MASCOT_ROLE_MAP[roleA_Title] || "male_engineer";
        const keyB = MASCOT_ROLE_MAP[roleB_Title] || "female_manager";
        const mascotA = MASCOT_PRESETS[keyA];
        const mascotB = MASCOT_PRESETS[keyB];
        textToCopy = `Dual character design: ${mascotA.promptSnippet} and ${mascotB.promptSnippet}, standing side-by-side discussing presentation charts, ${styleDetails.snippet}`;
      } else {
        const roleVal = tab1MascotRole ? tab1MascotRole.value : "男性 Q版工程師";
        const mascotKey = MASCOT_ROLE_MAP[roleVal] || "male_engineer";
        const mascotDetails = MASCOT_PRESETS[mascotKey];
        if (mascotDetails && styleDetails) {
          textToCopy = mascotDetails.prompt;
        }
      }

      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            tab1CopyMascotPromptBtn.classList.add("success");
            const btnText = tab1CopyMascotPromptBtn.querySelector(".btn-text");
            if (btnText) btnText.textContent = "✓ 已複製生圖 Prompt！";
            setTimeout(() => {
              tab1CopyMascotPromptBtn.classList.remove("success");
              if (btnText) btnText.textContent = "📋 複製生圖 Prompt";
            }, 2000);
          })
          .catch(err => alert("複製失敗，請手動複製"));
      }
    });
  }

  // Initial prompt builds
  updateTab1Prompt();
}

const DESIGN_STYLES = {
  auto_detect: {
    key: "auto_detect",
    name: "自動推導風格 (讓 NBLM 自己決定)",
    icon: "🪄",
    category: "AI 智慧推導 / 自由決策",
    desc: "不指定特定的 Hex 色號與風格，由 NotebookLM 根據來源文件內容主題（如科技、醫學、財務、教學）自動推理並定義最適切的全域設計規範。",
    color_scheme: { bg: "#FFFFFF (AI推導)", text: "#1E293B", accent: "#2563EB", secondary: "#00D2D3" },
    presetYaml: `global_design_specification:
  atmosphere: ["根據來源主題自動定義形容詞1", "形容詞2", "形容詞3"]
  color_scheme:
    background: "Hex Code (AI自動推薦明亮潔淨白底)"
    text: "Hex Code (高對比文字)"
    accent: "Hex Code (主題重點標示色)"
    secondary: "Hex Code (次要點綴色)"
  typography:
    heading: "根據主題適配之字體與樣式描述"
    body: "清晰易讀內文字體"
  layout_rules:
    navigation: "適合主題之頁碼導覽形式"
    image_style: "白底去背高品質圖片與圖解"
    decorative_elements: "配合主題之視覺點綴元素"`
  },
  corporate_pro: {
    key: "corporate_pro",
    name: "專業企業商務風格",
    icon: "💻",
    category: "高階商務 / 對外提案",
    desc: "明亮灰白底搭配高階藍灰與寶藍 accents，彰顯企業權威與俐落專業質感。",
    color_scheme: { bg: "#F8FAFC", text: "#0F172A", accent: "#2563EB", secondary: "#475569" },
    presetYaml: `global_design_specification:
  atmosphere: ["明亮專業", "俐落沉穩", "企業高階"]
  color_scheme:
    background: "#F8FAFC"
    text: "#0F172A"
    accent: "#2563EB"
    secondary: "#475569"
  typography:
    heading: "粗體現代無襯線字體，展現大氣質感"
    body: "清晰易讀的現代無襯線體"
  layout_rules:
    navigation: "頁碼與當前章節標示於右上方"
    image_style: "高質感白底去背 3D 微縮圖與實體物件"
    decorative_elements: "極細極簡線條、極輕微陰影白底圓角卡片"`
  },
  minimal_white: {
    key: "minimal_white",
    name: "白底商務簡約風格",
    icon: "📄",
    category: "簡約明亮 / 報告",
    desc: "純白質感背景搭配高對比藍黑主色，乾淨俐落、資訊密度極高。",
    color_scheme: { bg: "#FFFFFF", text: "#1A1D20", accent: "#0066FF", secondary: "#6C757D" },
    presetYaml: `global_design_specification:
  atmosphere: ["極簡俐落", "明亮清晰", "專業商務"]
  color_scheme:
    background: "#FFFFFF"
    text: "#1A1D20"
    accent: "#0066FF"
    secondary: "#6C757D"
  typography:
    heading: "黑體大標題，極簡高對比"
    body: "細體內文，極佳閱讀留白"
  layout_rules:
    navigation: "簡約底部微型進度條"
    image_style: "高畫質去背實物圖片"
    decorative_elements: "極細分隔線、單色極簡卡片圓角邊框"`
  },
  financial_exec: {
    key: "financial_exec",
    name: "白底高階財經風格",
    icon: "📈",
    category: "金融財經 / 數據報告",
    desc: "典雅米白配合金綠與深藍色系，適合財務報表、投資分析與權威報告。",
    color_scheme: { bg: "#F8F9FA", text: "#0F172A", accent: "#059669", secondary: "#3B82F6" },
    presetYaml: `global_design_specification:
  atmosphere: ["高階財經", "數據驅動", "嚴謹權威"]
  color_scheme:
    background: "#F8F9FA"
    text: "#0F172A"
    accent: "#059669"
    secondary: "#3B82F6"
  typography:
    heading: "古典襯線/高階黑體相結合"
    body: "清晰等寬數據排版"
  layout_rules:
    navigation: "頁碼標記於左下角，附帶報表日期"
    image_style: "專業數據圖表與金屬質感徽章"
    decorative_elements: "Bento Grid 數據網格、精緻微陰影邊框"`
  },
  hand_drawn_diary: {
    key: "hand_drawn_diary",
    name: "手繪日記風格+主角",
    icon: "✏️",
    category: "故事分享 / 溫馨塗鴉",
    desc: "溫暖紙張質感搭配手繪塗鴉與可愛主角，滿溢親和力與手作溫度。",
    color_scheme: { bg: "#FAF7F2", text: "#2B2D42", accent: "#E63946", secondary: "#F4A261" },
    presetYaml: `global_design_specification:
  atmosphere: ["溫暖手繪", "日常塗鴉", "親和故事"]
  color_scheme:
    background: "#FAF7F2"
    text: "#2B2D42"
    accent: "#E63946"
    secondary: "#F4A261"
  typography:
    heading: "手寫感溫柔字體風格"
    body: "親切日常閱讀字體"
  layout_rules:
    navigation: "手繪小書籤頁碼標記"
    image_style: "水彩插畫與手繪塗鴉主角互動"
    decorative_elements: "手繪圓圈標記、便利貼卡片、紙張膠帶貼裝飾"`
  },
  clay_ui: {
    key: "clay_ui",
    name: "3D 奶油 UI 科技風格",
    icon: "🍦",
    category: "前衛科技 / 產品發表",
    desc: "柔光黏土與圓潤 3D UI 元素，兼具科技前衛感與柔軟視效。",
    color_scheme: { bg: "#121824", text: "#F8FAFC", accent: "#A855F7", secondary: "#06B6D4" },
    presetYaml: `global_design_specification:
  atmosphere: ["3D柔光", "奶油UI", "未來科技"]
  color_scheme:
    background: "#121824"
    text: "#F8FAFC"
    accent: "#A855F7"
    secondary: "#06B6D4"
  typography:
    heading: "圓潤現代科技體"
    body: "乾淨高透閱讀體"
  layout_rules:
    navigation: "膠囊形狀的發光進度條"
    image_style: "3D Claymorphism 盲盒公仔與柔光幾何物件"
    decorative_elements: "浮空立體按鈕、柔光漸層微縮邊框"`
  },
  editorial_mag: {
    key: "editorial_mag",
    name: "雜誌編輯風格",
    icon: "📖",
    category: "品牌時尚 / 高訂視覺",
    desc: "大膽版面留白、大字體對比與質感排版，展現雜誌封面的藝術張力。",
    color_scheme: { bg: "#F4F1EA", text: "#111111", accent: "#D90429", secondary: "#8D99AE" },
    presetYaml: `global_design_specification:
  atmosphere: ["雜誌排版", "高訂典雅", "大膽留白"]
  color_scheme:
    background: "#F4F1EA"
    text: "#111111"
    accent: "#D90429"
    secondary: "#8D99AE"
  typography:
    heading: "經典襯線大字體 (Serif Font)"
    body: "優雅細緻襯線體"
  layout_rules:
    navigation: "雜誌期刊式的細小頁頭文字"
    image_style: "黑白高品質攝影與去背人物寫真"
    decorative_elements: "大黑體數字引言、經典雙線分隔排版"`
  },
  warm_illustration: {
    key: "warm_illustration",
    name: "溫馨插畫風格",
    icon: "🎨",
    category: "科普教育 / 感性分享",
    desc: "柔和暖色調插畫，營造放鬆、友善且易於吸收的感性簡報氛圍。",
    color_scheme: { bg: "#FFF9F2", text: "#332C27", accent: "#FF8C42", secondary: "#4D908E" },
    presetYaml: `global_design_specification:
  atmosphere: ["溫馨友善", "柔和色彩", "輕鬆學習"]
  color_scheme:
    background: "#FFF9F2"
    text: "#332C27"
    accent: "#FF8C42"
    secondary: "#4D908E"
  typography:
    heading: "溫和圓體/手感字體"
    body: "舒適閱讀體"
  layout_rules:
    navigation: "小圓點進度標示"
    image_style: "溫馨扁平向量與水彩插畫"
    decorative_elements: "柔和有機形狀色塊、植物與幾何圖案"`
  },
  high_contrast: {
    key: "high_contrast",
    name: "高對比度極簡風格",
    icon: "⬛",
    category: "簡約極致 / 概念展演",
    desc: "純黑底高亮鮮黃或純白，極致張力，適合發布會與震撼觀點展示。",
    color_scheme: { bg: "#000000", text: "#FFFFFF", accent: "#FFE600", secondary: "#00F0FF" },
    presetYaml: `global_design_specification:
  atmosphere: ["強烈對比", "極致極簡", "視覺震撼"]
  color_scheme:
    background: "#000000"
    text: "#FFFFFF"
    accent: "#FFE600"
    secondary: "#00F0FF"
  typography:
    heading: "超粗黑體/幾何字體 (Bold Sans-Serif)"
    body: "高對比無襯線體"
  layout_rules:
    navigation: "純黃色高亮進度方塊"
    image_style: "高對比單色剪影與Neon發光去背圖"
    decorative_elements: "極粗黃色邊框、大型強烈標點符號"`
  },
  isometric_25d: {
    key: "isometric_25d",
    name: "2.5D 等距視角風格+主角",
    icon: "🧊",
    category: "科技架構 / 工安流程",
    desc: "2.5D Isometric 視角透視，適合展示系統架構、工安流程與立體場景。",
    color_scheme: { bg: "#0F172A", text: "#F8FAFC", accent: "#38BDF8", secondary: "#818CF8" },
    presetYaml: `global_design_specification:
  atmosphere: ["2.5D透視", "立體幾何", "清晰連貫"]
  color_scheme:
    background: "#0F172A"
    text: "#F8FAFC"
    accent: "#38BDF8"
    secondary: "#818CF8"
  typography:
    heading: "現代幾何科技體"
    body: "乾淨清晰無襯線"
  layout_rules:
    navigation: "等距視角方塊導航"
    image_style: "2.5D Isometric 3D 卡片與去背主角互動"
    decorative_elements: "立體網格底座、高光透光玻璃卡片"`
  },
  flat_illustration: {
    key: "flat_illustration",
    name: "扁平化插畫風格",
    icon: "🎨",
    category: "商業通用 / 團隊簡報",
    desc: "經典乾淨向量扁平風格，色彩鮮明活潑，傳達資訊精準無負擔。",
    color_scheme: { bg: "#F8FAFC", text: "#1E293B", accent: "#2563EB", secondary: "#F59E0B" },
    presetYaml: `global_design_specification:
  atmosphere: ["活潑明亮", "向量扁平", "通用商業"]
  color_scheme:
    background: "#F8FAFC"
    text: "#1E293B"
    accent: "#2563EB"
    secondary: "#F59E0B"
  typography:
    heading: "標準現代無襯線體"
    body: "簡潔易讀體"
  layout_rules:
    navigation: "圓形步驟點進度條"
    image_style: "彩色向量扁平插畫"
    decorative_elements: "雙色對比幾何背景色塊"`
  },
  nordic_minimal: {
    key: "nordic_minimal",
    name: "北歐簡約插畫風格",
    icon: "🌿",
    category: "自然永續 / 生活風格",
    desc: "大地暖灰莫蘭迪配色與北歐植物線條，呈現淡雅高級的生活質感。",
    color_scheme: { bg: "#F5F3EF", text: "#2D3748", accent: "#E28743", secondary: "#768A76" },
    presetYaml: `global_design_specification:
  atmosphere: ["北歐極簡", "自然大地", "優雅平和"]
  color_scheme:
    background: "#F5F3EF"
    text: "#2D3748"
    accent: "#E28743"
    secondary: "#768A76"
  typography:
    heading: "人文質感襯線體"
    body: "典雅無襯線體"
  layout_rules:
    navigation: "極簡細線頁碼"
    image_style: "莫蘭迪色系質感手繪插畫"
    decorative_elements: "弧形幾何色塊、抽象植物線條塗鴉"`
  },
  glassmorphism: {
    key: "glassmorphism",
    name: "漸層玻璃擬態風格",
    icon: "✨",
    category: "前衛設計 / Web3/新潮",
    desc: "炫彩霓虹漸層與毛玻璃透光質感，營造未來感的極致視覺體驗。",
    color_scheme: { bg: "#0F0C29", text: "#FFFFFF", accent: "#F72585", secondary: "#4CC9F0" },
    presetYaml: `global_design_specification:
  atmosphere: ["玻璃擬態", "夢幻漸層", "前衛現代"]
  color_scheme:
    background: "#0F0C29"
    text: "#FFFFFF"
    accent: "#F72585"
    secondary: "#4CC9F0"
  typography:
    heading: "未來感漸層字體"
    body: "高透亮無襯線體"
  layout_rules:
    navigation: "發光玻璃按鈕導航"
    image_style: "半透明毛玻璃卡片與Neon漸層物件"
    decorative_elements: "微光模糊光圈、半透明透光邊框"`
  },
  gamified_ui: {
    key: "gamified_ui",
    name: "教育型遊戲UI風格+主角",
    icon: "🎮",
    category: "趣味學習 / 闖關培訓",
    desc: "遊戲化關卡 UI、血條/積分元素與互動主角，大幅提升學習專注度。",
    color_scheme: { bg: "#1E1B4B", text: "#FFFFFF", accent: "#F59E0B", secondary: "#10B981" },
    presetYaml: `global_design_specification:
  atmosphere: ["趣味遊戲", "像素UI", "生動學習"]
  color_scheme:
    background: "#1E1B4B"
    text: "#FFFFFF"
    accent: "#F59E0B"
    secondary: "#10B981"
  typography:
    heading: "遊戲卡牌風格粗字體"
    body: "清晰像素感/無襯線體"
  layout_rules:
    navigation: "闖關地圖與等級進度條"
    image_style: "遊戲像素風/Q版角色RPG動態姿態"
    decorative_elements: "金幣徽章、星級成就卡片、遊戲血條框"`
  },
  chemical_process: {
    key: "chemical_process",
    name: "化工製程與實驗科學風格",
    icon: "🧪",
    category: "化工工程 / 製程解析",
    desc: "清爽明亮藍白底搭配專業工程藍與青綠重點色，清晰展現化工反應、流體力學與實驗製程。",
    color_scheme: { bg: "#F4F8FA", text: "#0F172A", accent: "#0284C7", secondary: "#0D9488" },
    presetYaml: `global_design_specification:
  atmosphere: ["明亮潔淨", "工程專業", "清晰條理"]
  color_scheme:
    background: "#F4F8FA"
    text: "#0F172A"
    accent: "#0284C7"
    secondary: "#0D9488"
  typography:
    heading: "專業工程無襯線黑體"
    body: "清晰易讀技術字體"
  layout_rules:
    navigation: "簡約藍色製程流向線條進度條"
    image_style: "高解析度白底去背 3D 分子結構與反應器圖"
    decorative_elements: "極細青藍製程線條、白底資訊卡片圓角框"`
  },
  safety_risk: {
    key: "safety_risk",
    name: "工安事故分析與警示風格",
    icon: "⚠️",
    category: "工安檢討 / 事故分析",
    desc: "明亮潔淨米白底搭配警示紅與安全橙，條理分明、焦點集中，極利於工安案例檢討與避險演練。",
    color_scheme: { bg: "#FAF9F6", text: "#1E1E1E", accent: "#DC2626", secondary: "#D97706" },
    presetYaml: `global_design_specification:
  atmosphere: ["明亮聚焦", "條理清晰", "風險警示"]
  color_scheme:
    background: "#FAF9F6"
    text: "#1E1E1E"
    accent: "#DC2626"
    secondary: "#D97706"
  typography:
    heading: "醒目無襯線黑體"
    body: "極佳閱讀條理體"
  layout_rules:
    navigation: "簡約黃紅警示小點標示"
    image_style: "白底去背安全防具與事故示意圖"
    decorative_elements: "細邊框警示卡片、清晰風險時間軸、紅黃高亮劃重點"`
  },
  science_research: {
    key: "science_research",
    name: "科普研究與技術解密風格",
    icon: "🔬",
    category: "學術科普 / 技術拆解",
    desc: "實驗室明亮白底搭配研究藍與翡翠綠，圖文並茂，極利於科普解密與複雜技術說明。",
    color_scheme: { bg: "#F8FAFC", text: "#0F172A", accent: "#0284C7", secondary: "#059669" },
    presetYaml: `global_design_specification:
  atmosphere: ["技術拆解", "圖解科普", "清晰可視"]
  color_scheme:
    background: "#F8FAFC"
    text: "#0F172A"
    accent: "#0284C7"
    secondary: "#059669"
  typography:
    heading: "科研現代黑體大標題"
    body: "清晰易讀技術內文"
  layout_rules:
    navigation: "步驟拆解點陣導覽條"
    image_style: "高解析度技術拆解圖與科研實驗設備"
    decorative_elements: "引線標註框 (Callout Lines)、數據對比卡片、實驗流程圖塊"`
  }
};

let currentDesignStyleKey = "auto_detect";

function initDesignStyleGallery() {
  const chipsContainer = document.getElementById("design-style-chips");
  const activeCardContainer = document.getElementById("design-style-active-card");
  const pptTemplateText = document.getElementById("ppt-template-text");

  if (!chipsContainer || !activeCardContainer) return;

  function renderChips() {
    chipsContainer.innerHTML = Object.keys(DESIGN_STYLES).map(key => {
      const style = DESIGN_STYLES[key];
      const isActive = (key === currentDesignStyleKey);
      return `
        <button class="style-chip-btn ${isActive ? 'active' : ''}" data-style="${key}">
          <span>${style.icon}</span>
          <span>${style.name}</span>
        </button>
      `;
    }).join("");

    const chipBtns = chipsContainer.querySelectorAll(".style-chip-btn");
    chipBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-style");
        selectDesignStyle(key);
      });
    });
  }

  function selectDesignStyle(key) {
    if (!DESIGN_STYLES[key]) return;
    currentDesignStyleKey = key;
    renderChips();
    renderActiveCard(key);

    if (typeof window.updateTab1Prompt === "function") {
      window.updateTab1Prompt();
    }

    if (pptTemplateText) {
      pptTemplateText.style.transition = "box-shadow 0.3s ease";
      pptTemplateText.style.boxShadow = "0 0 24px rgba(247, 37, 133, 0.75)";
      setTimeout(() => {
        pptTemplateText.style.boxShadow = "";
      }, 1500);
    }
  }

  function renderActiveCard(key) {
    const style = DESIGN_STYLES[key];
    if (!style) return;

    activeCardContainer.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 4px; height: 24px; background: linear-gradient(to bottom, #f72585, #7209b7); border-radius: 2px;"></div>
          <h4 style="font-size: 16px; font-weight: 700; color: #ffffff; margin: 0; display: flex; align-items: center; gap: 8px;">
            <span>${style.icon}</span> ${style.name}
          </h4>
        </div>
        <span style="font-size: 11px; font-weight: 600; background: rgba(247, 37, 133, 0.15); border: 1px solid rgba(247, 37, 133, 0.4); color: #ff85a1; padding: 4px 12px; border-radius: 12px;">
          ${style.category}
        </span>
      </div>

      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.5;">
        ${style.desc}
      </p>

      <!-- Color Palette Swatches -->
      <div class="style-swatch-list" style="margin-bottom: 16px;">
        <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 500;">設計色盤:</span>
        <div class="style-swatch-item">
          <span class="swatch-color-dot" style="background: ${style.color_scheme.bg};"></span>
          <span>背景: ${style.color_scheme.bg}</span>
        </div>
        <div class="style-swatch-item">
          <span class="swatch-color-dot" style="background: ${style.color_scheme.text};"></span>
          <span>文字: ${style.color_scheme.text}</span>
        </div>
        <div class="style-swatch-item">
          <span class="swatch-color-dot" style="background: ${style.color_scheme.accent};"></span>
          <span>強調標示色: ${style.color_scheme.accent}</span>
        </div>
        <div class="style-swatch-item">
          <span class="swatch-color-dot" style="background: ${style.color_scheme.secondary};"></span>
          <span>點綴色: ${style.color_scheme.secondary}</span>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end;">
        <button class="action-btn" style="background: linear-gradient(135deg, #f72585, #7209b7); color: white; padding: 8px 18px; font-size: 13px; font-weight: 600; border-radius: 8px; border: none; cursor: default; display: flex; align-items: center; gap: 6px;">
          <span>✓ 已將此風格 DNA 注入全域提示詞</span>
        </button>
      </div>
    `;
  }

  // Initial render
  renderChips();
  renderActiveCard(currentDesignStyleKey);
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", init);


