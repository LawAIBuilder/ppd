import assert from 'node:assert/strict';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`✗ ${name}`);
    console.error(err?.stack || err);
  }
}

// ---- Tests will be added/expanded in later phases.
test('sanity', () => {
  assert.equal(1 + 1, 2);
});

// ---- DOI parsing + boundary selection
import { parseDate, getMultiplierTableId, getScheduleSet } from '../src/lib/doi.js';

test('DOI boundary: 2023-10-01 selects t2023', () => {
  const doi = parseDate('2023-10-01');
  assert.ok(doi);
  assert.equal(getMultiplierTableId(doi), 't2023');
});

test('DOI boundary: 2018-10-01 selects t2018', () => {
  const doi = parseDate('2018-10-01');
  assert.ok(doi);
  assert.equal(getMultiplierTableId(doi), 't2018');
});

test('DOI boundary: 2000-10-01 selects t2000', () => {
  const doi = parseDate('2000-10-01');
  assert.ok(doi);
  assert.equal(getMultiplierTableId(doi), 't2000');
});

test('DOI boundary: 1995-10-01 selects t1995', () => {
  const doi = parseDate('1995-10-01');
  assert.ok(doi);
  assert.equal(getMultiplierTableId(doi), 't1995');
});

test('Schedule boundary: 1993-07-01 selects post1993 schedule set', () => {
  const doi = parseDate('1993-07-01');
  assert.ok(doi);
  assert.equal(getScheduleSet(doi).id, 'post1993');
});

test('Schedule gating: 1993-06-30 is pre1993 schedule set', () => {
  const doi = parseDate('1993-06-30');
  assert.ok(doi);
  assert.equal(getScheduleSet(doi).id, 'pre1993');
});

// ---- Knee flow (5223.0510): modes, ROM, combinable, cap
import { calcKnee } from '../src/flows/knee.js';

test('Knee exclusive: patellar shaving 1%', () => {
  const res = calcKnee({ k2: 'exclusive', k_exclusive: 'patellar_shaving' }, { doi: parseDate('2020-01-01') });
  assert.equal(res.percent, 1);
  assert.ok(res.breakdown?.some((b) => b.label.includes('Patellar shaving')));
});

test('Knee ROM only: extension 0-9, flexion 91-120 → 2%', () => {
  const res = calcKnee(
    { k2: 'rom_only', k_rom_ank: 'no', k_rom_ext: 'ext_0_9', k_rom_flex: 'flex_91_120' },
    { doi: parseDate('2020-01-01') }
  );
  assert.equal(res.percent, 2);
});

test('Knee ROM only: extension 10-20, flexion 51-90 → 14%', () => {
  const res = calcKnee(
    { k2: 'rom_only', k_rom_ank: 'no', k_rom_ext: 'ext_10_20', k_rom_flex: 'flex_51_90' },
    { doi: parseDate('2020-01-01') }
  );
  assert.equal(res.percent, 14);
});

test('Knee combinable: meniscectomy >50% both = 6%', () => {
  const res = calcKnee(
    { k2: 'combinable_rom', k_combinable: { men_gt50_both: true }, k_rom_ank: 'yes', k_rom_ank_angle: 'ank_neutral_20' },
    { doi: parseDate('2020-01-01') }
  );
  const combined = 6 + 20; // 6% + 20% ROM combined
  const expected = Math.min(100 - (1 - 6/100) * (1 - 20/100) * 100, 34);
  assert.equal(Math.round(res.percent * 10) / 10, Math.round(expected * 10) / 10);
  assert.ok(res.breakdown?.some((b) => b.label.includes('more than 50% of both')));
});

test('Knee combinable: meniscus mixed 5% only for DOI ≥ 8/9/2010', () => {
  const resLate = calcKnee(
    { k2: 'combinable_rom', k_combinable: { men_mixed_2010: true }, k_rom_ank: 'no', k_rom_ext: 'ext_0_9', k_rom_flex: 'flex_gt120' },
    { doi: parseDate('2010-08-09') }
  );
  assert.ok(resLate.breakdown?.some((b) => b.label.includes('one ≤50%') || b.percent === 5));
  const resEarly = calcKnee(
    { k2: 'combinable_rom', k_combinable: { men_mixed_2010: true }, k_rom_ank: 'no', k_rom_ext: 'ext_0_9', k_rom_flex: 'flex_gt120' },
    { doi: parseDate('2010-08-08') }
  );
  assert.ok(!resEarly.breakdown?.some((b) => b.percent === 5 && b.label?.includes('mixed')));
});

test('Knee combinable: cruciate anterior mild 3%, severe 5%, posterior 5%', () => {
  const r1 = calcKnee({ k2: 'exclusive', k_exclusive: 'plateau_undisplaced' }, {}); // 2% to have a result
  assert.equal(r1.percent, 2);
  const r2 = calcKnee(
    { k2: 'combinable_rom', k_combinable: { cruciate_ant_mild: true }, k_rom_ank: 'no', k_rom_ext: 'ext_0_9', k_rom_flex: 'flex_gt120' },
    { doi: parseDate('2020-01-01') }
  );
  assert.equal(r2.percent, 3);
  const r3 = calcKnee(
    { k2: 'combinable_rom', k_combinable: { cruciate_ant_severe: true }, k_rom_ank: 'no', k_rom_ext: 'ext_0_9', k_rom_flex: 'flex_gt120' },
    { doi: parseDate('2020-01-01') }
  );
  assert.equal(r3.percent, 5);
  const r4 = calcKnee(
    { k2: 'combinable_rom', k_combinable: { cruciate_posterior: true }, k_rom_ank: 'no', k_rom_ext: 'ext_0_9', k_rom_flex: 'flex_gt120' },
    { doi: parseDate('2020-01-01') }
  );
  assert.equal(r4.percent, 5);
});

test('Knee combinable: arthroplasty unicondylar 7%, total condylar 8%, patella replacement 7%', () => {
  const r1 = calcKnee(
    { k2: 'combinable_rom', k_combinable: { arthro_unicondylar: true }, k_rom_ank: 'no', k_rom_ext: 'ext_0_9', k_rom_flex: 'flex_gt120' },
    { doi: parseDate('2020-01-01') }
  );
  assert.equal(r1.percent, 7);
  const r2 = calcKnee(
    { k2: 'combinable_rom', k_combinable: { arthro_total_condylar: true }, k_rom_ank: 'no', k_rom_ext: 'ext_0_9', k_rom_flex: 'flex_gt120' },
    { doi: parseDate('2020-01-01') }
  );
  assert.equal(r2.percent, 8);
  const r3 = calcKnee(
    { k2: 'combinable_rom', k_combinable: { arthro_patella_replacement: true }, k_rom_ank: 'no', k_rom_ext: 'ext_0_9', k_rom_flex: 'flex_gt120' },
    { doi: parseDate('2020-01-01') }
  );
  assert.equal(r3.percent, 7);
});

test('Knee cap at 34%', () => {
  const res = calcKnee(
    { k2: 'rom_only', k_rom_ank: 'yes', k_rom_ank_angle: 'ank_gt90' },
    { doi: parseDate('2020-01-01') }
  );
  assert.equal(res.percent, 34);
  assert.equal(res.postCapPercent, 34);
  assert.ok(res.preCapPercent >= 34);
});

// ---- Dollar threshold and t1995 bracket (Phase 4)
import { calcPpdDollars } from '../src/lib/multipliers.js';

test('Dollar threshold: 5.49% in lower bracket, 5.50% in next (t2023)', () => {
  const doi = parseDate('2023-10-01');
  const r49 = calcPpdDollars(doi, 5.49);
  const r50 = calcPpdDollars(doi, 5.5);
  assert.ok(r49.supported && r50.supported);
  assert.ok(r49.bracketLabel?.includes('5.5') || r49.bracketLabel === '< 5.5%', '5.49 should be < 5.5% bracket');
  assert.ok(r50.bracketLabel?.includes('5.5') && r50.bracketLabel?.includes('10.5'), '5.50 should be 5.5–10.5% bracket');
  assert.notEqual(r49.amountBase, r50.amountBase, 'different brackets => different base amounts');
});

test('Dollar t1995: decimal percent maps to integer bracket', () => {
  const doi = parseDate('1995-10-01');
  const r25 = calcPpdDollars(doi, 25.4);
  const r26 = calcPpdDollars(doi, 25.6);
  assert.ok(r25.supported && r26.supported);
  assert.ok(r25.bracketLabel?.includes('0') && r25.bracketLabel?.includes('25'));
  assert.ok(r26.bracketLabel?.includes('26') && r26.bracketLabel?.includes('30'));
});

if (failed > 0) {
  console.error(`\n${failed} failed, ${passed} passed`);
  process.exit(1);
} else {
  console.log(`\n${passed} passed`);
}

