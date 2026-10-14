# CAST. Studio

NotebookLM 簡報與講解口白提示詞工作台。純 HTML、CSS、JavaScript，直接開啟 `index.html` 即可使用，不需安裝依賴或建置。

## 使用流程

1. 選擇 17 款視覺風格之一，以及不使用、單主角或雙主角模式。
2. 複製全域規劃提示詞到 NotebookLM，根據筆記本來源產生簡報規劃 YAML。
3. 將 YAML 貼回分段工作台，選擇每組 10 或 12 頁，再複製各組到 NotebookLM 生成簡報。
4. 後續組別含第一頁風格錨點、上一組最後一頁作為銜接參考。合併簡報時，刪除這兩張重複參考頁。
5. 在「簡報講解口白」設定講者、語氣、長度及單人／雙人模式，複製口白提示詞。

本工具產生提示詞與分段 YAML；簡報、語音及影片由使用者另行在相關工具生成。分組頁數是本工具設定，不代表 NotebookLM 的固定官方限制，也不保證外部工具一定遵循提示詞。

## YAML 支援範圍

以本工具提示詞格式為準：頂層 `slide_planning:`，其下使用相同縮排的 `- page: 正整數` 清單。支援 CRLF 與外層 YAML Markdown 程式碼框。保留全域設定、原始標題與頁面內文，不重新序列化字串。

這是保留文字的分段器，並非完整 YAML 語法驗證器。重複頁碼、不支援的清單格式或投影片清單後的其他頂層欄位會顯示錯誤。任意 YAML 語法、錨點與跨頁引用不在完整支援範圍內。

## 介面與檔案

暗色炭灰與鼠尾草綠配色，搭配生成的簡報與聲波主視覺。提供窄螢幕版面、鍵盤分頁切換、可見焦點、錯誤狀態朗讀與減少動畫偏好。提示詞預覽預設收折，仍可直接複製。

圖片及核心程式均為本機檔案；Google Fonts 字型需要網路，離線時使用系統字型。複製功能優先使用 Clipboard API，權限不可用時嘗試相容方式，仍失敗時可手動選取提示詞。

- `index.html`：介面與表單。
- `style.css`：原有元件樣式，已移除舊獨立吉祥物頁的未使用樣式。
- `studio.css`：新版暗色視覺、主視覺及響應式規則。
- `app.js`：提示詞、角色與風格設定，以及介面事件。
- `yaml-splitter.js`：可獨立測試的分段邏輯。
- `images/studio-hero.webp`：內建 imagegen 生成並壓縮的主視覺，約 80 KB。
- `tests/`：使用 Node.js 內建測試工具，無外部測試依賴。
- `PROJECT_REVIEW.md`：本次檢查、調整與驗證限制。
- `images/GENERATION.md`：主視覺生成提示詞。

## 開發檢查

使用已安裝的 Node.js：

```powershell
node --check app.js
node --check yaml-splitter.js
node --test tests/yaml-splitter.test.cjs tests/prompts.test.cjs
```

使用工具本身不需要 Node.js。
