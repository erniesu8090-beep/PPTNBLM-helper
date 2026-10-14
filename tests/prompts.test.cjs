const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({ document: { addEventListener() {} }, navigator: {} });
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
test('all design styles produce complete prompt schemas', () => {
  const keys = vm.runInContext('Object.keys(DESIGN_STYLES)', context);
  assert.equal(keys.length, 17);
  for (const key of keys) {
    context.styleUnderTest = key;
    const prompt = vm.runInContext('buildGlobalPptPrompt("none", undefined, styleUnderTest)', context);
    assert.match(prompt, /global_design_specification:/);
    assert.match(prompt, /slide_planning:\n  - page: 1/);
    assert.ok(!prompt.includes('undefined'));
    assert.match(prompt, /不可捏造/);
  }
});
test('single and dual mascot prompt constraints are included', () => {
  const single = vm.runInContext('buildGlobalPptPrompt("male_engineer")', context);
  const dual = vm.runInContext('buildGlobalPptPrompt("male_engineer", undefined, "auto_detect", "female_manager")', context);
  assert.match(single, /mascot_anchor:/);
  assert.match(dual, /角色 A/);
  assert.match(dual, /角色 B/);
  assert.ok(!dual.includes('undefined'));
});
test('clipboard falls back after permission denial and restores focus', async () => {
  let removed = false, focused = false, selected = false;
  context.navigator.clipboard = { writeText: async () => { throw new Error('denied'); } };
  context.document.activeElement = { focus: () => { focused = true; } };
  context.document.createElement = () => ({ style: {}, select: () => { selected = true; }, remove: () => { removed = true; } });
  context.document.body = { appendChild() {} };
  context.document.execCommand = () => true;
  await vm.runInContext('copyText("test")', context);
  assert.ok(selected && removed && focused);
  context.document.execCommand = () => false;
  await assert.rejects(vm.runInContext('copyText("test")', context));
});

test('every catalog role supports both prompt modes and all drawing styles', () => {
  const roles = vm.runInContext('MASCOT_CATALOG', context);
  const styles = vm.runInContext('Object.keys(MASCOT_STYLE_DETAILS)', context);
  assert.equal(roles.length, 13);
  for (const role of roles) {
    context.roleKey = role.key;
    for (const style of styles) {
      context.drawingStyle = style;
      const single = vm.runInContext('buildGlobalPptPrompt(roleKey, drawingStyle)', context);
      const dual = vm.runInContext('buildGlobalPptPrompt("male_engineer", drawingStyle, "auto_detect", roleKey)', context);
      const image = vm.runInContext('buildMascotImagePrompt(roleKey, drawingStyle)', context);
      const snippet = vm.runInContext('MASCOT_STYLE_DETAILS[drawingStyle].snippet', context);
      assert.ok(single.includes(style));
      assert.ok(dual.includes(role.label) || dual.includes(vm.runInContext('MASCOT_PRESETS[roleKey].name', context)));
      assert.ok(image.includes(snippet));
      assert.ok(!image.includes('undefined'));
      assert.match(single, /不得遮擋/);
    }
  }
  const dualImage = vm.runInContext('buildMascotImagePrompt("owl_guide", "溫馨手繪水彩風格", "fox_guide")', context);
  assert.match(dualImage, /owl/);
  assert.match(dualImage, /fox/);
  assert.match(dualImage, /Warm watercolor/);
});

test('role cards, dual target switching and disabled mode stay synchronized', () => {
  class Element {
    constructor(value = '') { this.value = value; this.children = []; this.dataset = {}; this.style = {}; this.events = {}; this.attributes = {}; }
    appendChild(child) { this.children.push(child); }
    replaceChildren(...children) { this.children = children; }
    addEventListener(name, handler) { this.events[name] = handler; }
    setAttribute(name, value) { this.attributes[name] = value; }
    querySelectorAll() { return this.children; }
  }
  const ids = ['ppt-template-text', 'tab1-mascot-mode', 'tab1-single-mascot-col', 'tab1-dual-mascot-col-a', 'tab1-dual-mascot-col-b', 'tab1-mascot-role', 'tab1-mascot-role-a', 'tab1-mascot-role-b', 'tab1-mascot-style', 'tab1-mascot-style-col', 'tab1-mascot-preview-box', 'tab1-mascot-img', 'tab1-mascot-title', 'tab1-mascot-desc', 'mascot-role-cards', 'mascot-library', 'mascot-targets', 'mascot-cast', 'mascot-style-label', 'mascot-selection-note'];
  const elements = Object.fromEntries(ids.map(id => [id, new Element()]));
  elements['tab1-mascot-mode'].value = 'none';
  elements['tab1-mascot-role'].value = elements['tab1-mascot-role-a'].value = '男性 Q版工程師';
  elements['tab1-mascot-role-b'].value = '女性 Q版商業顧問/PM';
  elements['tab1-mascot-style'].value = '溫馨手繪水彩風格';
  const targets = [new Element(), new Element()];
  targets[0].dataset.target = 'a'; targets[1].dataset.target = 'b';
  const ui = vm.createContext({ document: {
    addEventListener() {}, getElementById: id => elements[id] || null,
    createElement: () => new Element(), querySelectorAll: () => targets
  }, navigator: {} });
  ui.window = ui;
  vm.runInContext(fs.readFileSync('app.js', 'utf8'), ui);
  vm.runInContext('initMascotFeature()', ui);
  assert.equal(elements['mascot-library'].hidden, true);
  assert.equal(elements['mascot-role-cards'].children.length, 13);
  elements['tab1-mascot-mode'].value = 'single';
  elements['tab1-mascot-mode'].events.change();
  elements['mascot-role-cards'].children.find(card => card.dataset.key === 'owl_guide').events.click();
  assert.equal(elements['tab1-mascot-role'].value, '智慧貓頭鷹');
  assert.match(elements['ppt-template-text'].textContent, /智慧貓頭鷹/);
  assert.match(elements['mascot-cast'].innerHTML, /🦉/);
  elements['tab1-mascot-mode'].value = 'dual';
  elements['tab1-mascot-mode'].events.change();
  targets[1].events.click();
  elements['mascot-role-cards'].children.find(card => card.dataset.key === 'fox_guide').events.click();
  assert.equal(elements['tab1-mascot-role-a'].value, '男性 Q版工程師');
  assert.equal(elements['tab1-mascot-role-b'].value, '探險狐狸嚮導');
  assert.match(elements['ppt-template-text'].textContent, /探險狐狸嚮導/);
  assert.match(elements['mascot-cast'].innerHTML, /主角 B/);
  elements['tab1-mascot-mode'].value = 'none';
  elements['tab1-mascot-mode'].events.change();
  assert.equal(elements['tab1-mascot-preview-box'].style.display, 'none');
  assert.ok(!elements['ppt-template-text'].textContent.includes('mascot_anchor'));
});

test('mascot image prompts specify reusable identities and unambiguous compositions', () => {
  const single = vm.runInContext('buildMascotImagePrompt("male_teacher", "扁平簡約質感幾何風")', context);
  assert.match(single, /Portrait 4:5/);
  assert.match(single, /Exactly one character/);
  assert.match(single, /sage-green knitted vest/);
  assert.match(single, /10% clear margin/);
  assert.match(single, /no gradients, volumetric shading, 3D rendering/);
  assert.ok(!single.includes('8k'));
  assert.ok(!single.includes('masterpiece'));
  const dual = vm.runInContext('buildMascotImagePrompt("owl_guide", "3D Q版柔光微縮模型風", "fox_guide")', context);
  assert.match(dual, /Landscape 3:2/);
  assert.match(dual, /Exactly two characters/);
  assert.match(dual, /Character A, left:.*owl/);
  assert.match(dual, /Character B, right:.*fox/);
  assert.match(dual, /never transfer features/);
  const same = vm.runInContext('buildMascotImagePrompt("neutral_robot", undefined, "neutral_robot")', context);
  assert.match(same, /round teal badge/);
  assert.match(same, /round amber badge/);
  assert.match(same, /no human legs/);
  const engineer = vm.runInContext('buildMascotImagePrompt("female_engineer")', context);
  assert.match(engineer, /official logo reference/);
  assert.match(engineer, /otherwise leave the patch blank/);
  assert.throws(() => vm.runInContext('buildMascotImagePrompt("invalid")', context), /有效的角色/);
});
