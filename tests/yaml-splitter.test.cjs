const { test } = require('node:test');
const assert = require('node:assert/strict');
const { splitYaml } = require('../yaml-splitter.js');
const fixture = (count) => 'global_design_specification:\n  color: "#000"\nslide_planning:\n' + Array.from({length:count}, (_, i) => `  - page: ${i + 1}\n    title: 'Page ${i + 1}'\n    content: |\n      page: 999\n      - page: 888`).join('\n');
test('preserves nested page text and titles', () => {
  const parts = splitYaml(fixture(23));
  assert.equal(parts.length, 3);
  assert.deepEqual(parts.map(p => [...p.yaml.matchAll(/^  - page: (\d+)/gm)].map(m => +m[1])), [[1,2,3,4,5,6,7,8,9,10], [1,10,11,12,13,14,15,16,17,18], [1,18,19,20,21,22,23]]);
  assert.ok(parts[1].yaml.includes("title: 'Page 1'"));
  assert.ok(parts[1].yaml.includes('      - page: 888'));
  assert.ok(parts.every(p => p.yaml.startsWith('global_design_specification:')));
});
test('12-page limit, short inputs, CRLF and markdown fences', () => {
  assert.equal(splitYaml(fixture(12), 12).length, 1);
  assert.equal(splitYaml(fixture(13), 12).length, 2);
  assert.equal(splitYaml('```yaml\r\n' + fixture(1).replaceAll('\n','\r\n') + '\r\n```').length, 1);
});
test('rejects invalid limits, missing list, duplicates and trailing fields', () => {
  for (const limit of [0, 2, NaN, 3.5]) assert.throws(() => splitYaml(fixture(1), limit));
  assert.throws(() => splitYaml('nonsense'));
  assert.throws(() => splitYaml('slide_planning:\n  page: 1'));
  assert.throws(() => splitYaml(fixture(2).replace('  - page: 2','  - page: 1')));
  assert.throws(() => splitYaml(fixture(1) + '\nother: true'));
});
test('all fresh pages appear once and each part respects limit', () => {
  for (const limit of [3,10,12]) for (const count of [1,10,11,30,100]) {
    const parts = splitYaml(fixture(count), limit);
    const fresh = parts.flatMap((p,i) => [...p.yaml.matchAll(/^  - page: (\d+)/gm)].map(m => +m[1]).slice(i ? 2 : 0));
    assert.deepEqual(fresh, Array.from({length:count}, (_,i) => i+1));
    assert.ok(parts.every(p => [...p.yaml.matchAll(/^  - page:/gm)].length <= limit));
  }
});
