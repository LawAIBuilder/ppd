import { clamp, round } from '../lib/combine.js';

export const lumbarFlow = {
  id: 'lumbar',
  label: 'Lumbar spine (radicular syndrome)',
  description: 'MN Rules 5223.0390 subp. 4–5 (radicular syndromes + fusion add-on).',
  start: 'l1',
  nodes: {
    l1: {
      type: 'choice',
      prompt: 'Are you rating a lumbar radicular syndrome (pain/paresthesia into the leg)?',
      help: 'This wizard currently focuses on radicular syndromes (subp. 4) and fusion add-ons (subp. 5).',
      options: [
        { label: 'Yes', value: 'yes', next: 'l2' },
        { label: 'No / Not sure', value: 'no', next: 'l_not_supported' },
      ],
    },

    l_not_supported: {
      type: 'info',
      title: 'Not supported yet',
      body: `
        This version of the demo implements lumbar RADICULAR syndromes (5223.0390 subp. 4–5).
        Lumbar pain syndrome (subp. 3) and fractures (subp. 2) can be added using the same framework.
      `,
      nextLabel: 'Back',
      next: 'l1',
    },

    l2: {
      type: 'choice',
      prompt: 'Are there persistent objective clinical findings?',
      help: 'Objective findings are documented, reproducible findings (e.g., on exam or testing), not subjective pain alone. The rule includes: findings confined to the lumbar region (e.g., muscle tightness, decreased ROM), or objective radicular findings in the lower extremity (e.g., hyporeflexia, EMG abnormality, or nerve-root-specific muscle weakness).',
      options: [
        { label: 'No persistent objective clinical findings', value: 'none', next: 'l_result_A' },
        { label: 'Yes — but findings are confined to the lumbar region (no objective radicular findings in leg)', value: 'lumbar_only', next: 'l3' },
        { label: 'Yes — objective radicular findings in the lower extremity', value: 'objective_radicular', next: 'l4' },
      ],
    },

    l3: {
      type: 'choice',
      prompt: 'Is there a qualifying lumbar imaging abnormality (not otherwise addressed elsewhere in the schedule)?',
      options: [
        { label: 'No imaging findings (or not qualifying)', value: 'none', next: 'l_result_B' },
        { label: 'Yes — imaging abnormality present', value: 'imaging', next: 'l3b' },
      ],
    },

    l3b: {
      type: 'choice',
      prompt: 'How many vertebral levels are involved (per imaging abnormality)?',
      options: [
        { label: 'Single vertebral level', value: 'single', next: 'l3c' },
        { label: 'Multiple vertebral levels', value: 'multiple', next: 'l3c' },
      ],
    },

    l3c: {
      type: 'choice',
      prompt: 'Did you have lumbar surgery for this condition?',
      options: [
        { label: 'No surgery', value: 'none', next: 'l_result_C_nosurg' },
        { label: 'Yes — surgery (no fusion)', value: 'surgery_no_fusion', next: 'l3d' },
        { label: 'Yes — surgery included fusion', value: 'surgery_with_fusion', next: 'l5' },
      ],
    },

    l3d: {
      type: 'choice',
      prompt: 'Surgery levels (other than fusion)',
      help: 'Subp. 4C(3)–(4) distinguish one-level vs multi-level surgery other than fusion.',
      options: [
        { label: 'Surgery at one level (other than fusion)', value: 'one', next: 'l_result_C_surg_one' },
        { label: 'Surgery at more than one level (other than fusion)', value: 'multi', next: 'l_result_C_surg_multi' },
      ],
    },

    l4: {
      type: 'choice',
      prompt: 'Which imaging pattern matches the rule for the radicular syndrome?',
      help: 'Subp. 4D uses disc bulging/protrusion/herniation impinging nerve root; subp. 4E uses spinal stenosis impinging nerve root.',
      options: [
        { label: 'Disc bulge/protrusion/herniation impinging nerve root (Subp. 4D)', value: 'D', next: 'l4_correlation' },
        { label: 'Spinal stenosis impinging nerve root (Subp. 4E)', value: 'E', next: 'l4_correlation' },
        { label: 'Not sure / neither', value: 'unknown', next: 'l_not_supported' },
      ],
    },

    l4_correlation: {
      type: 'choice',
      prompt: 'Does the imaging correlate with the objective neurological findings?',
      help: 'Subp. 4D and 4E require that the imaging (disc or stenosis impinging nerve root) correlate with the objective radicular findings (e.g., nerve root distribution, EMG, or exam). If there is no such correlation, these categories may not apply.',
      options: [
        { label: 'Yes — imaging correlates with objective neuro findings', value: 'yes', next: 'l4_addons' },
        { label: 'No / Not sure', value: 'no', next: 'l_not_supported' },
      ],
    },

    l4_addons: {
      type: 'multi',
      prompt: 'Which additional features apply?',
      help: 'These are add-ons within Subp. 4D or 4E. This wizard will prevent “surgery other than fusion” add-ons if you indicate fusion.',
      options: [
        { key: 'persist', label: 'Chronic radicular pain/paresthesia persists despite treatment (add 3%)' },
        { key: 'additional_lesion', label: 'Additional concurrent lesion meeting criteria (add 9%)' },
      ],
      next: 'l4_surg',
    },

    l4_surg: {
      type: 'choice',
      prompt: 'Was surgery performed for this condition?',
      options: [
        { label: 'No surgery', value: 'none', next: 'l_result_DE' },
        { label: 'Yes — surgery other than fusion', value: 'no_fusion', next: 'l4_surg2' },
        { label: 'Yes — surgery included fusion', value: 'with_fusion', next: 'l5' },
      ],
    },

    l4_surg2: {
      type: 'multi',
      prompt: 'Surgery detail (other than fusion)',
      help: 'Select what applies. For Subp. 4D, surgery add-on is +2% (each time); for Subp. 4E, surgery add-on is +5% (first surgery) and +3% (additional surgery).',
      options: [
        { key: 'surg1', label: 'At least one surgery other than fusion' },
        { key: 'surg_addl', label: 'Additional surgery other than fusion' },
      ],
      next: 'l_result_DE',
    },

    l5: {
      type: 'choice',
      prompt: 'If fusion was performed, how many vertebral levels were fused?',
      help: 'Subp. 5 adds +5% for fusion at one level, +10% for fusion at multiple levels, added to the otherwise appropriate Subp. 3 or 4 category.',
      options: [
        { label: 'One vertebral level fused (+5%)', value: 'one', next: 'l_result_with_fusion' },
        { label: 'Multiple vertebral levels fused (+10%)', value: 'multiple', next: 'l_result_with_fusion' },
      ],
    },

    // ---- Results (computed)
    l_result_A: { type: 'result', compute: (a) => calcLumbar(a, { mode: 'A' }) },
    l_result_B: { type: 'result', compute: (a) => calcLumbar(a, { mode: 'B' }) },
    l_result_C_nosurg: { type: 'result', compute: (a) => calcLumbar(a, { mode: 'C_nosurg' }) },
    l_result_C_surg_one: { type: 'result', compute: (a) => calcLumbar(a, { mode: 'C_surg_one' }) },
    l_result_C_surg_multi: { type: 'result', compute: (a) => calcLumbar(a, { mode: 'C_surg_multi' }) },
    l_result_DE: { type: 'result', compute: (a) => calcLumbar(a, { mode: 'DE' }) },
    l_result_with_fusion: { type: 'result', compute: (a) => calcLumbar(a, { mode: 'WITH_FUSION' }) },
  },
};

function calcLumbar(answers, forced) {
  // NOTE: Percent values implemented from 5223.0390 subp. 4–5.
  const pick = forced?.mode || 'DE';
  const obj = answers['l2'] || null;
  const imagingLevels = answers['l3b'] || null;
  const surgeryC = answers['l3c'] || null;
  const surgeryLevelsC = answers['l3d'] || null;
  const deType = answers['l4'] || null;
  const addonFlags = answers['l4_addons'] || {};
  const surgChoice = answers['l4_surg'] || null;
  const surgFlags = answers['l4_surg2'] || {};
  const fusionLevels = answers['l5'] || null;

  let base = 0;
  let adds = [];
  let fusionAdd = 0;

  const add = (label, pct) => {
    if (pct && pct !== 0) adds.push({ label, percent: pct });
  };

  if (pick === 'A') {
    base = 0;
    return result('Lumbar radicular syndrome — Subp. 4A', base, adds);
  }

  if (pick === 'B') {
    base = 3.5;
    return result('Lumbar radicular syndrome — Subp. 4B', base, adds);
  }

  if (pick === 'C_nosurg') {
    base = (imagingLevels === 'multiple') ? 10 : 7;
    return result(`Lumbar radicular syndrome — Subp. 4C(${imagingLevels === 'multiple' ? '2' : '1'})`, base, adds);
  }

  if (pick === 'C_surg_one') {
    base = 10;
    return result('Lumbar radicular syndrome — Subp. 4C(3) (surgery one level, other than fusion)', base, adds);
  }

  if (pick === 'C_surg_multi') {
    base = 13;
    return result('Lumbar radicular syndrome — Subp. 4C(4) (surgery multiple levels, other than fusion)', base, adds);
  }

  if (pick === 'DE') {
    if (deType === 'D') base = 9;
    if (deType === 'E') base = 10;

    if (addonFlags?.persist) add('Chronic radicular pain/paresthesia persists despite treatment', 3);
    if (addonFlags?.additional_lesion) add('Additional concurrent lesion meeting criteria (Subp. 4D/E(4))', 9);

    // Surgery (other than fusion)
    if (surgChoice === 'no_fusion') {
      if (deType === 'D') {
        if (surgFlags?.surg1) add('Surgery other than fusion (Subp. 4D(2))', 2);
        if (surgFlags?.surg_addl) add('Additional surgery other than fusion (Subp. 4D(3))', 2);
      } else if (deType === 'E') {
        if (surgFlags?.surg1) add('Surgery other than fusion (Subp. 4E(2))', 5);
        if (surgFlags?.surg_addl) add('Additional surgery other than fusion (Subp. 4E(3))', 3);
      }
    }

    const total = base + adds.reduce((s, x) => s + x.percent, 0);
    return result(`Lumbar radicular syndrome — Subp. 4${deType}`, total, adds, base);
  }

  if (pick === 'WITH_FUSION') {
    // If fusion was selected, we compute the underlying category from the path taken
    // and then add the Subp. 5 fusion increment.
    if (obj === 'none') {
      base = 0;
    } else if (obj === 'lumbar_only') {
      const imaging = answers['l3'] || null;
      if (imaging === 'none') base = 3.5; // Subp. 4B
      else base = (imagingLevels === 'multiple') ? 10 : 7; // Subp. 4C(1)/(2) for imaging; C(3)/(4) are “other than fusion”
    } else if (obj === 'objective_radicular') {
      if (deType === 'D') base = 9;
      if (deType === 'E') base = 10;
      // include non-surgery add-ons only; surgery other-than-fusion add-ons are skipped because fusion applies instead
      if (addonFlags?.persist) add('Chronic radicular pain/paresthesia persists despite treatment', 3);
      if (addonFlags?.additional_lesion) add('Additional concurrent lesion meeting criteria (Subp. 4D/E(4))', 9);
    }

    if (fusionLevels === 'multiple') fusionAdd = 10;
    else fusionAdd = 5;
    add('Fusion add-on (Subp. 5)', fusionAdd);

    const total = base + adds.reduce((s, x) => s + x.percent, 0);
    return result('Lumbar radicular syndrome + fusion add-on', total, adds, base);
  }

  // fallback
  return result('Lumbar radicular syndrome (unhandled path)', 0, []);
}

function result(title, totalPercent, adds, base = null) {
  const t = clamp(totalPercent, 0, 100);
  const basePart = (base === null) ? [] : [{ label: 'Base', percent: base }];
  const addParts = (adds || []).map((x) => ({ label: x.label, percent: x.percent }));

  return {
    title,
    percent: round(t, 1),
    breakdown: [...basePart, ...addParts],
    notes: [
      'This is an estimation wizard. Always verify against Minn. R. 5223.0390 subp. 4–5 and the medical records.',
      'Subp. 4D/4E contain additional surgery rules; this wizard simplifies fusion vs non-fusion surgery handling.',
    ],
  };
}
