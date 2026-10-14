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
