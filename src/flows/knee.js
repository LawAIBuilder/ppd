/**
 * Knee & lower leg — Minn. R. 5223.0510 (subp. 1–4).
 * Three modes: (1) Exclusive — one Subp. 2 item, cap 34%;
 * (2) Combinable + ROM — Subp. 3 items + Subp. 4 ROM, combined, cap 34%;
 * (3) ROM only — Subp. 4 only, cap 34%.
 * All percentages and categories per current Revisor text only.
 */

import { combinePercents, clamp, round } from '../lib/combine.js';
import { isOnOrAfter } from '../lib/doi.js';

const CAP_PERCENT = 34; // 5223.0510 subp. 1: knee schedule cap
const CITE = 'Minn. R. 5223.0510';

// ---- Subp. 2 — Exclusive (pick one)
const SUBP2_EXCLUSIVE = [
  { id: 'plateau_undisplaced', label: 'Plateau fracture, undisplaced', percent: 2, citation: `${CITE} subp. 2(A)(1)` },
  { id: 'plateau_one_intact', label: 'Plateau fracture, depressed/elevated medial or lateral, cartilage intact', percent: 7, citation: `${CITE} subp. 2(A)(2)(a)` },
  { id: 'plateau_one_excised', label: 'Plateau fracture, depressed/elevated medial or lateral, cartilage excised', percent: 9, citation: `${CITE} subp. 2(A)(2)(b)` },
  { id: 'plateau_both_intact', label: 'Plateau fracture, both plateaus, both intact', percent: 9, citation: `${CITE} subp. 2(A)(3)(a)` },
  { id: 'plateau_both_excised', label: 'Plateau fracture, both plateaus, one or both excised', percent: 11, citation: `${CITE} subp. 2(A)(3)(b)` },
  { id: 'supracondylar_undisplaced', label: 'Supracondylar or intercondylar fracture, undisplaced', percent: 2, citation: `${CITE} subp. 2(B)(1)` },
  { id: 'bicondylar_undisplaced', label: 'Bicondylar fracture, undisplaced', percent: 5, citation: `${CITE} subp. 2(B)(2)` },
  { id: 'supracondylar_displaced', label: 'Supracondylar fracture, displaced', percent: 4, citation: `${CITE} subp. 2(B)(3)` },
  { id: 'unicondylar_displaced', label: 'Unicondylar fracture, displaced', percent: 6, citation: `${CITE} subp. 2(B)(4)` },
  { id: 'bicondylar_displaced', label: 'Bicondylar fracture, displaced', percent: 10, citation: `${CITE} subp. 2(B)(5)` },
  { id: 'patellar_shaving', label: 'Patellar shaving', percent: 1, citation: `${CITE} subp. 2(C)` },
  { id: 'collateral_mild', label: 'Collateral ligament laxity, mild', percent: 2, citation: `${CITE} subp. 2(D)(1)` },
  { id: 'collateral_moderate', label: 'Collateral ligament laxity, moderate', percent: 4, citation: `${CITE} subp. 2(D)(2)` },
  { id: 'repair_patellar_dislocation', label: 'Repair patellar dislocation', percent: 5, citation: `${CITE} subp. 2(E)` },
  { id: 'lateral_retinacular', label: 'Lateral retinacular release', percent: 1, citation: `${CITE} subp. 2(F)` },
  { id: 'painful_organic', label: 'Painful organic syndrome (no passive ROM limitation)', percent: 0, citation: `${CITE} subp. 2(G)` },
  { id: 'nerve_resolved', label: 'Nerve entrapment, resolved', percent: 0, citation: `${CITE} subp. 2(H)(1)` },
  { id: 'nerve_recurring_no_edx', label: 'Nerve entrapment, recurring/persisting, no EDX', percent: 0, citation: `${CITE} subp. 2(H)(2)` },
  { id: 'nerve_edx', label: 'Nerve entrapment, persisting with EDX', percent: 2, citation: `${CITE} subp. 2(H)(3)` },
  { id: 'nerve_motor_sensory', label: 'Nerve entrapment with motor/sensory loss (rate under 5223.0420/0430)', percent: 0, citation: `${CITE} subp. 2(H)(4)`, type: 'info' },
  { id: 'tibia_nonunion_orthosis', label: 'Tibia nonunion requiring nonweight-bearing orthosis', percent: 18, citation: `${CITE} subp. 2(I)` },
];

// ---- Subp. 3 — Combinable (multi-select)
const SUBP3_COMBINABLE = [
  { id: 'patellectomy', label: 'Patellectomy (partial or total)', percent: 4, citation: `${CITE} subp. 3(A)` },
  { id: 'men_up50_one', label: 'Meniscectomy: up to 50% of one cartilage', percent: 2, citation: `${CITE} subp. 3(B)(1)` },
  { id: 'men_gt50_one', label: 'Meniscectomy: more than 50% of one cartilage', percent: 3, citation: `${CITE} subp. 3(B)(2)` },
  { id: 'men_up50_both', label: 'Meniscectomy: up to 50% of both cartilages', percent: 4, citation: `${CITE} subp. 3(B)(3)` },
  { id: 'men_gt50_both', label: 'Meniscectomy: more than 50% of both cartilages', percent: 6, citation: `${CITE} subp. 3(B)(4)` },
  { id: 'men_mixed_2010', label: 'Meniscectomy: DOI ≥ 8/9/2010 — one ≤50%, other >50%', percent: 5, citation: `${CITE} subp. 3(B)(5)`, doiGate: '2010-08-09' },
  { id: 'arthro_unicondylar', label: 'Arthroplasty: unicondylar', percent: 7, citation: `${CITE} subp. 3(C)(1)` },
  { id: 'arthro_total_condylar', label: 'Arthroplasty: total condylar', percent: 8, citation: `${CITE} subp. 3(C)(2)` },
  { id: 'arthro_patella_replacement', label: 'Arthroplasty: patella replacement', percent: 7, citation: `${CITE} subp. 3(C)(3)` },
  { id: 'cruciate_ant_mild', label: 'Cruciate: anterior mild (positive drawer, no pivot)', percent: 3, citation: `${CITE} subp. 3(D)(1)` },
  { id: 'cruciate_ant_severe', label: 'Cruciate: anterior severe (drawer + pivot)', percent: 5, citation: `${CITE} subp. 3(D)(2)` },
  { id: 'cruciate_posterior', label: 'Cruciate: posterior', percent: 5, citation: `${CITE} subp. 3(D)(3)` },
  { id: 'varus_0', label: 'Varus 0°–5°', percent: 0, citation: `${CITE} subp. 3(E)` },
  { id: 'varus_2', label: 'Varus 6°–10°', percent: 2, citation: `${CITE} subp. 3(E)` },
  { id: 'varus_4', label: 'Varus 11° or more', percent: 4, citation: `${CITE} subp. 3(E)` },
  { id: 'valgus_0', label: 'Valgus 0°–5°', percent: 0, citation: `${CITE} subp. 3(F)` },
  { id: 'valgus_2', label: 'Valgus 6°–10°', percent: 2, citation: `${CITE} subp. 3(F)` },
  { id: 'valgus_4', label: 'Valgus 11° or more', percent: 4, citation: `${CITE} subp. 3(F)` },
  { id: 'prox_tibial_osteotomy', label: 'Proximal tibial osteotomy', percent: 4, citation: `${CITE} subp. 3(G)` },
  { id: 'distal_femoral_osteotomy', label: 'Distal femoral osteotomy', percent: 4, citation: `${CITE} subp. 3(H)` },
  { id: 'not_otherwise_ratable', label: 'Not otherwise ratable', percent: 0, citation: `${CITE} subp. 3(I)` },
];

// ---- Subp. 4 — ROM table (extension bracket × flexion)
// Extension rows: 0–9, 10–20, 21–35, 36–50, 51–90, >90
// Flexion columns: >120, 91–120, 51–90, 20–50, <20 (for 21–35: <51 is one column 24; for 36–50: <90 is one column 28)
const ROM_TABLE = {
  ext_0_9:   { flex_gt120: 0,  flex_91_120: 2,  flex_51_90: 12, flex_20_50: 16, flex_lt20: 20 },
  ext_10_20: { flex_gt120: 2,  flex_91_120: 4,  flex_51_90: 14, flex_20_50: 18, flex_lt20: 20 },
  ext_21_35: { flex_gt120: 8,  flex_91_120: 10, flex_51_90: 20, flex_lt51: 24 },
  ext_36_50: { flex_gt120: 16, flex_91_120: 18, flex_lt90: 28 },
  ext_51_90: { flex_gt120: 26, flex_lt121: 28 },
  ext_gt90: 36,
};

const ANKYLOSIS = [
  { id: 'ank_neutral_20', label: 'Neutral to 20° flexion', percent: 20, citation: `${CITE} subp. 4(7)(a)` },
  { id: 'ank_21_50', label: '21°–50° flexion', percent: 24, citation: `${CITE} subp. 4(7)(b)` },
  { id: 'ank_51_90', label: '51°–90° flexion', percent: 28, citation: `${CITE} subp. 4(7)(c)` },
  { id: 'ank_gt90', label: '>90° flexion', percent: 36, citation: `${CITE} subp. 4(7)(d)` },
];

function getExclusiveOption(item) {
  const next = item.type === 'info' ? 'k_nerve_info' : 'k_result';
  return { label: `${item.label} (${item.percent}%)`, value: item.id, next };
}

export const kneeFlow = {
  id: 'knee',
  label: 'Knee & lower leg',
  description: 'Minn. R. 5223.0510 — exclusive, combinable + ROM, or ROM-only.',
  start: 'k1',
  nodes: {
    k1: {
      type: 'choice',
      prompt: 'Which side are you rating?',
      options: [
        { label: 'Left knee', value: 'left', next: 'k2' },
        { label: 'Right knee', value: 'right', next: 'k2' },
      ],
    },

    k2: {
      type: 'choice',
      prompt: 'How is this impairing condition rated?',
      help: 'Exclusive: one Subp. 2 finding only. Combinable + ROM: Subp. 3 items plus ROM. ROM only: loss of motion only (Subp. 4).',
      options: [
        { label: 'Exclusive (Subp. 2) — one finding only', value: 'exclusive', next: 'k_exclusive' },
        { label: 'Combinable + ROM (Subp. 3 + Subp. 4)', value: 'combinable_rom', next: 'k_combinable' },
        { label: 'Loss of function only (Subp. 4 ROM)', value: 'rom_only', next: 'k_rom_ank' },
      ],
    },

    k_exclusive: {
      type: 'choice',
      prompt: 'Select the one exclusive finding (Subp. 2)',
      help: 'Choose exactly one. If none apply, use Combinable + ROM or ROM-only path instead.',
      options: SUBP2_EXCLUSIVE.map(getExclusiveOption),
    },

    k_nerve_info: {
      type: 'info',
      title: 'Rate under other rules',
      body: 'Motor and sensory loss from nerve entrapment are rated under Minn. R. 5223.0420 (motor) and 5223.0430 (sensory). This knee schedule does not assign a percentage for that finding.',
      nextLabel: 'Done',
      next: 'k_result',
    },

    k_combinable: {
      type: 'multi',
      prompt: 'Combinable procedures/conditions (Subp. 3) — check all that apply',
      options: SUBP3_COMBINABLE.map((o) => ({ key: o.id, label: `${o.label} (${o.percent}%)` })),
      next: 'k_rom_ank',
    },

    k_rom_ank: {
      type: 'choice',
      prompt: 'Is there ankylosis of the knee?',
      help: 'If yes, rate under ankylosis categories; if no, use flexion and extension limits.',
      options: [
        { label: 'No', value: 'no', next: 'k_rom_ext' },
        { label: 'Yes', value: 'yes', next: 'k_rom_ank_angle' },
      ],
    },

    k_rom_ank_angle: {
      type: 'choice',
      prompt: 'Ankylosis angle (best match)',
      options: ANKYLOSIS.map((a) => ({ label: `${a.label} (${a.percent}%)`, value: a.id, next: 'k_result' })),
    },

    k_rom_ext: {
      type: 'choice',
      prompt: 'Extension limit / flexion contracture (best match)',
      options: [
        { label: 'Extension limited to 0°–9° flexion', value: 'ext_0_9', next: 'k_rom_flex' },
        { label: 'Extension limited to 10°–20° flexion', value: 'ext_10_20', next: 'k_rom_flex' },
        { label: 'Extension limited to 21°–35° flexion', value: 'ext_21_35', next: 'k_rom_flex' },
        { label: 'Extension limited to 36°–50° flexion', value: 'ext_36_50', next: 'k_rom_flex' },
        { label: 'Extension limited to 51°–90° flexion', value: 'ext_51_90', next: 'k_rom_flex' },
        { label: 'Extension limited to >90° flexion', value: 'ext_gt90', next: 'k_result' },
      ],
    },

    k_rom_flex: {
      type: 'choice',
      prompt: 'Flexion limit (best match)',
      options: [
        { label: 'Flexion >120°', value: 'flex_gt120', next: 'k_result' },
        { label: 'Flexion 91°–120°', value: 'flex_91_120', next: 'k_result' },
        { label: 'Flexion 51°–90°', value: 'flex_51_90', next: 'k_result' },
        { label: 'Flexion 20°–50°', value: 'flex_20_50', next: 'k_result' },
        { label: 'Flexion <20°', value: 'flex_lt20', next: 'k_result' },
      ],
    },

    k_result: {
      type: 'result',
      compute: (answers, ctx) => computeKneeResult(answers, ctx),
    },
  },
};

function computeKneeResult(answers, ctx) {
  const doi = ctx?.doi || null;
  const mode = answers['k2'];

  if (mode === 'exclusive') {
    const id = answers['k_exclusive'];
    const item = SUBP2_EXCLUSIVE.find((x) => x.id === id);
    const pct = item ? item.percent : 0;
    const preCap = pct;
    const postCap = Math.min(preCap, CAP_PERCENT);
    const breakdown = item
      ? [{ label: item.label, percent: item.percent, citation: item.citation, category: 'exclusive' }]
      : [];
    const notes = [];
    if (item?.type === 'info') notes.push('Rate motor/sensory loss under Minn. R. 5223.0420 and 5223.0430.');
    if (postCap < preCap) notes.push(`Knee schedule capped at ${CAP_PERCENT}% (5223.0510 subp. 1).`);
    return {
      title: 'Knee & lower leg rating',
      percent: round(clamp(postCap, 0, 100), 1),
      preCapPercent: preCap,
      postCapPercent: postCap,
      breakdown,
      notes: [...notes, 'Verify against current Minn. R. 5223.0510 and medical records.'],
    };
  }

  // combinable_rom or rom_only
  const breakdown = [];
  let combinablePercents = [];

  if (mode === 'combinable_rom') {
    const flags = answers['k_combinable'] || {};
    for (const opt of SUBP3_COMBINABLE) {
      if (!flags[opt.id]) continue;
      if (opt.doiGate) {
        const [y, m, d] = opt.doiGate.split('-').map(Number);
        if (!isOnOrAfter(doi, y, m, d)) continue;
      }
      combinablePercents.push(opt.percent);
      breakdown.push({ label: opt.label, percent: opt.percent, citation: opt.citation, category: 'combinable' });
    }
  }

  let romPercent = 0;
  const ank = answers['k_rom_ank'] === 'yes';
  if (ank) {
    const aid = answers['k_rom_ank_angle'];
    const a = ANKYLOSIS.find((x) => x.id === aid);
    if (a) {
      romPercent = a.percent;
      breakdown.push({ label: `ROM: ${a.label}`, percent: a.percent, citation: a.citation, category: 'rom' });
    }
    } else {
      const extId = answers['k_rom_ext'];
      if (extId === 'ext_gt90') {
        romPercent = 36;
        breakdown.push({ label: 'ROM: extension limited to >90° flexion', percent: 36, citation: `${CITE} subp. 4(6)`, category: 'rom' });
      } else {
        const flexId = answers['k_rom_flex'];
        const row = ROM_TABLE[extId];
        if (row && typeof row === 'object') {
          let cell = row[flexId];
          if (cell === undefined && (flexId === 'flex_20_50' || flexId === 'flex_lt20') && row.flex_lt51 !== undefined) cell = row.flex_lt51;
          if (cell === undefined && (flexId === 'flex_51_90' || flexId === 'flex_20_50' || flexId === 'flex_lt20') && row.flex_lt90 !== undefined) cell = row.flex_lt90;
          if (cell === undefined && flexId !== 'flex_gt120' && row.flex_lt121 !== undefined) cell = row.flex_lt121;
          if (typeof cell === 'number') {
            romPercent = cell;
            breakdown.push({ label: `ROM: ${extId} / ${flexId}`, percent: cell, citation: `${CITE} subp. 4`, category: 'rom' });
          }
        }
      }
    }

  const allPercents = [...combinablePercents, romPercent].filter((p) => p > 0);
  const preCap = allPercents.length === 0 ? 0 : allPercents.length === 1 ? allPercents[0] : combinePercents(allPercents);
  const postCap = Math.min(preCap, CAP_PERCENT);

  const notes = [];
  if (postCap < preCap) notes.push(`Knee schedule capped at ${CAP_PERCENT}% (5223.0510 subp. 1).`);
  if (mode === 'combinable_rom' && answers['k_combinable']?.['men_mixed_2010'] && !isOnOrAfter(doi, 2010, 8, 9)) {
    notes.push('The “mixed meniscus” 5% option requires DOI ≥ 8/9/2010; not applied.');
  }

  return {
    title: 'Knee & lower leg rating',
    percent: round(clamp(postCap, 0, 100), 1),
    preCapPercent: preCap,
    postCapPercent: postCap,
    breakdown,
    notes: [...notes, 'Verify against current Minn. R. 5223.0510 and medical records.'],
  };
}

export function calcKnee(answers, ctx) {
  return computeKneeResult(answers, ctx);
}
