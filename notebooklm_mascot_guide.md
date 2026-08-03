# 🎭 NotebookLM 簡報吉祥物 (Mascot Continuity) 視覺貫穿指南與配方庫

本指南紀錄將 **「吉祥物/視覺主角人設 (Visual Mascot Anchor)」** 融入 NotebookLM / Gemini 簡報生成的全新技巧。透過在來源文件或全域提示詞中設置統一的角色視覺生圖 Prompt，讓整份簡報的每一頁都具備連貫、生動且具備故事引導感的小人物！

---

## 💡 運作機制與優勢

1. **視覺高度連貫 (Visual Consistency)**：避免 AI 簡報每一頁圖片風格迥異，全篇維持一致的角色美學與色彩調性。
2. **生動故事引導 (Storytelling Guidance)**：讓角色在不同頁面呈現配合主題的動作（如：**封面打招呼、數據頁指著視窗、案例頁展現思考狀、結尾頁舉牌致謝**）。
3. **性別與人設自由切換**：可根據簡報主題（工安培訓、商業提案、科普教育、AI 科技）輕鬆搭配男/女角色。

---

## 🎨 角色生圖提示詞配方庫 (Mascot Prompt Library)

在筆記本來源文件中加入下方角色生圖 Prompt（或作為全域視覺規範），即可讓 NotebookLM 參照該角色進行投影片繪圖：

### 1. 👷 工安與現場工程師 (Field Engineer)

* **👨 男性工程師 (Male Engineer)**
  ```text
  A cute chibi male engineer character design, wearing a safety helmet, professional work clothes, and safety shoes. 2.5D illustration style, 3D isometric, exquisite material details, soft lighting, clean solid white background, full body composition, high quality, masterpiece, 8k resolution.
  ```

* **👩 女性工程師 (Female Engineer)**
  ```text
  A cute chibi female engineer character design, wearing a safety helmet, professional work clothes, and safety shoes. 2.5D illustration style, 3D isometric, exquisite material details, soft lighting, clean solid white background, full body composition, high quality, masterpiece, 8k resolution.
  ```

---

### 2. 💼 商業顧問與資深 PM (Business Manager / PM)

* **👨 男性 PM / 顧問 (Male Manager)**
  ```text
  A cute chibi male business manager character design, wearing a smart dark suit, neat hair, holding a tablet computer. 2.5D illustration style, 3D isometric, clean solid white background, full body, soft studio lighting, high quality, masterpiece, 8k resolution.
  ```

* **👩 女性 PM / 顧問 (Female Manager)**
  ```text
  A cute chibi female business manager character design, wearing a stylish suit blazer, professional look, holding a tablet computer. 2.5D illustration style, 3D isometric, clean solid white background, full body, soft studio lighting, high quality, masterpiece, 8k resolution.
  ```

---

### 3. 🎓 科普與教育講師 (Science Educator / Teacher)

* **👨 男性講師 (Male Teacher)**
  ```text
  A cute chibi male teacher character design, wearing glasses, a smart casual vest and shirt, holding a pointer stick, friendly expression. 2.5D illustration style, 3D isometric, clean solid white background, full body, soft lighting, 8k resolution.
  ```

* **👩 女性講師 (Female Teacher)**
  ```text
  A cute chibi female teacher character design, wearing glasses, a smart casual blazer, holding a pointer stick, warm friendly expression. 2.5D illustration style, 3D isometric, clean solid white background, full body, soft lighting, 8k resolution.
  ```

---

### 4. 🤖 科技感 AI 夥伴 (Futuristic AI Robot Companion)

* **🤖 可愛 AI 機器人 (Neutral Robot Mascot)**
  ```text
  A cute floating friendly AI robot mascot character design, futuristic sleek metallic white and cyan finish, glowing blue eyes, friendly expression. 3D isometric, clean solid white background, full body, soft studio lighting, masterpiece, 8k resolution.
  ```

---

## 📝 NotebookLM 簡報提示詞注入語法 (YAML Directive Examples)

當您將上述角色生圖 Prompt 放入來源或全域提示詞時，請在簡報提示詞中加入以下指令，引導 AI 讓角色貫穿每一頁：

### 1. 全域設計規範 (Global Design Spec)
```yaml
global_design_specification:
  mascot_anchor:
    character_description: "使用來源中定義的 [男性/女性] Q版工程師角色作為全簡報視覺主角"
    style: "2.5D 3D Isometric 立體卡片去背風"
    rule: "每一頁簡報的視覺畫面中，必須出現該主角，並根據該頁主題展現適當的互動姿態"
```


---

## 🚀 實戰操作 SOP

1. **步驟 1**：選擇需要的角色配方（男/女），複製提示詞貼入 NotebookLM 作為**來源筆記**或對話說明。
2. **步驟 2**：複製簡報全域提示詞，並在註記中加上：`「請使用來源圖片中的 [男性/女性] 主角呈現在每一頁簡報中。」`
3. **步驟 3**：生成簡報後，每一頁都會有專屬的吉祥物人物在其中穿梭，打造高度連貫的視覺大作！
