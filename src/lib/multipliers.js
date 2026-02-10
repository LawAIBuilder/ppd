import { round, clamp } from './combine.js';
import { getMultiplierTableId } from './doi.js';

// Source: MN DLI / Revisor; DOI windows per session law effective dates.
const TABLES = {
  t2023: {
    label: 'Effective DOI ≥ 10/01/2023',
    source: 'Minn. Stat. / DLI; effective 10/1/2023',
    doiWindow: '2023-10-01 onward',
    brackets: [
      { max: 5.5, maxExclusive: true, amount: 114260, label: '< 5.5%' },
      { min: 5.5, max: 10.5, maxExclusive: true, amount: 121800, label: '5.5%–<10.5%' },
      { min: 10.5, max: 15.5, maxExclusive: true, amount: 129485, label: '10.5%–<15.5%' },
      { min: 15.5, max: 20.5, maxExclusive: true, amount: 137025, label: '15.5%–<20.5%' },
      { min: 20.5, max: 25.5, maxExclusive: true, amount: 139720, label: '20.5%–<25.5%' },
      { min: 25.5, max: 30.5, maxExclusive: true, amount: 147000, label: '25.5%–<30.5%' },
      { min: 30.5, max: 35.5, maxExclusive: true, amount: 150150, label: '30.5%–<35.5%' },
      { min: 35.5, max: 40.5, maxExclusive: true, amount: 163800, label: '35.5%–<40.5%' },
      { min: 40.5, max: 45.5, maxExclusive: true, amount: 177450, label: '40.5%–<45.5%' },
      { min: 45.5, max: 50.5, maxExclusive: true, amount: 177870, label: '45.5%–<50.5%' },
      { min: 50.5, max: 55.5, maxExclusive: true, amount: 181965, label: '50.5%–<55.5%' },
      { min: 55.5, max: 60.5, maxExclusive: true, amount: 209475, label: '55.5%–<60.5%' },
      { min: 60.5, max: 65.5, maxExclusive: true, amount: 237090, label: '60.5%–<65.5%' },
      { min: 65.5, max: 70.5, maxExclusive: true, amount: 264600, label: '65.5%–<70.5%' },
      { min: 70.5, max: 75.5, maxExclusive: true, amount: 292215, label: '70.5%–<75.5%' },
      { min: 75.5, max: 80.5, maxExclusive: true, amount: 347340, label: '75.5%–<80.5%' },
      { min: 80.5, max: 85.5, maxExclusive: true, amount: 402465, label: '80.5%–<85.5%' },
      { min: 85.5, max: 90.5, maxExclusive: true, amount: 457590, label: '85.5%–<90.5%' },
      { min: 90.5, max: 95.5, maxExclusive: true, amount: 512715, label: '90.5%–<95.5%' },
      { min: 95.5, max: 100, maxExclusive: false, amount: 567840, label: '95.5%–100%' },
    ],
    rounding: { selector: 'tenth', digits: 1 },
  },
  t2018: {
    label: 'Effective DOI 10/01/2018–09/30/2023',
    source: 'Minn. Stat. / DLI; effective 10/1/2018',
    doiWindow: '2018-10-01 through 2023-09-30',
    brackets: [
      { max: 5.5, maxExclusive: true, amount: 78800, label: '< 5.5%' },
      { min: 5.5, max: 10.5, maxExclusive: true, amount: 84000, label: '5.5%–<10.5%' },
      { min: 10.5, max: 15.5, maxExclusive: true, amount: 89300, label: '10.5%–<15.5%' },
      { min: 15.5, max: 20.5, maxExclusive: true, amount: 94500, label: '15.5%–<20.5%' },
      { min: 20.5, max: 25.5, maxExclusive: true, amount: 99800, label: '20.5%–<25.5%' },
      { min: 25.5, max: 30.5, maxExclusive: true, amount: 105000, label: '25.5%–<30.5%' },
      { min: 30.5, max: 35.5, maxExclusive: true, amount: 115500, label: '30.5%–<35.5%' },
      { min: 35.5, max: 40.5, maxExclusive: true, amount: 126000, label: '35.5%–<40.5%' },
      { min: 40.5, max: 45.5, maxExclusive: true, amount: 136500, label: '40.5%–<45.5%' },
      { min: 45.5, max: 50.5, maxExclusive: true, amount: 147000, label: '45.5%–<50.5%' },
      { min: 50.5, max: 55.5, maxExclusive: true, amount: 173300, label: '50.5%–<55.5%' },
      { min: 55.5, max: 60.5, maxExclusive: true, amount: 199500, label: '55.5%–<60.5%' },
      { min: 60.5, max: 65.5, maxExclusive: true, amount: 225800, label: '60.5%–<65.5%' },
      { min: 65.5, max: 70.5, maxExclusive: true, amount: 252000, label: '65.5%–<70.5%' },
      { min: 70.5, max: 75.5, maxExclusive: true, amount: 278300, label: '70.5%–<75.5%' },
      { min: 75.5, max: 80.5, maxExclusive: true, amount: 330800, label: '75.5%–<80.5%' },
      { min: 80.5, max: 85.5, maxExclusive: true, amount: 383300, label: '80.5%–<85.5%' },
      { min: 85.5, max: 90.5, maxExclusive: true, amount: 435800, label: '85.5%–<90.5%' },
      { min: 90.5, max: 95.5, maxExclusive: true, amount: 488300, label: '90.5%–<95.5%' },
      { min: 95.5, max: 100, maxExclusive: false, amount: 540800, label: '95.5%–100%' },
    ],
    rounding: { selector: 'tenth', digits: 1 },
  },
  t2000: {
    label: 'Effective DOI 10/01/2000–09/30/2018',
    source: 'Minn. Stat. / DLI; effective 10/1/2000',
    doiWindow: '2000-10-01 through 2018-09-30',
    brackets: [
      { max: 5.5, maxExclusive: true, amount: 75000, label: '< 5.5%' },
      { min: 5.5, max: 10.5, maxExclusive: true, amount: 80000, label: '5.5%–<10.5%' },
      { min: 10.5, max: 15.5, maxExclusive: true, amount: 85000, label: '10.5%–<15.5%' },
      { min: 15.5, max: 20.5, maxExclusive: true, amount: 90000, label: '15.5%–<20.5%' },
      { min: 20.5, max: 25.5, maxExclusive: true, amount: 95000, label: '20.5%–<25.5%' },
      { min: 25.5, max: 30.5, maxExclusive: true, amount: 100000, label: '25.5%–<30.5%' },
      { min: 30.5, max: 35.5, maxExclusive: true, amount: 110000, label: '30.5%–<35.5%' },
      { min: 35.5, max: 40.5, maxExclusive: true, amount: 120000, label: '35.5%–<40.5%' },
      { min: 40.5, max: 45.5, maxExclusive: true, amount: 130000, label: '40.5%–<45.5%' },
      { min: 45.5, max: 50.5, maxExclusive: true, amount: 140000, label: '45.5%–<50.5%' },
      { min: 50.5, max: 55.5, maxExclusive: true, amount: 165000, label: '50.5%–<55.5%' },
      { min: 55.5, max: 60.5, maxExclusive: true, amount: 190000, label: '55.5%–<60.5%' },
      { min: 60.5, max: 65.5, maxExclusive: true, amount: 215000, label: '60.5%–<65.5%' },
      { min: 65.5, max: 70.5, maxExclusive: true, amount: 240000, label: '65.5%–<70.5%' },
      { min: 70.5, max: 75.5, maxExclusive: true, amount: 265000, label: '70.5%–<75.5%' },
      { min: 75.5, max: 80.5, maxExclusive: true, amount: 315000, label: '75.5%–<80.5%' },
      { min: 80.5, max: 85.5, maxExclusive: true, amount: 365000, label: '80.5%–<85.5%' },
      { min: 85.5, max: 90.5, maxExclusive: true, amount: 415000, label: '85.5%–<90.5%' },
      { min: 90.5, max: 95.5, maxExclusive: true, amount: 465000, label: '90.5%–<95.5%' },
      { min: 95.5, max: 100, maxExclusive: false, amount: 515000, label: '95.5%–100%' },
    ],
    rounding: { selector: 'tenth', digits: 1 },
  },
  t1995: {
    label: 'Effective DOI 10/01/1995–09/30/2000',
    source: 'Minn. Stat. / DLI; effective 10/1/1995',
    doiWindow: '1995-10-01 through 2000-09-30',
    brackets: [
      { min: 0, max: 25, amount: 75000, label: '0%–25%' },
      { min: 26, max: 30, amount: 80000, label: '26%–30%' },
      { min: 31, max: 35, amount: 85000, label: '31%–35%' },
      { min: 36, max: 40, amount: 90000, label: '36%–40%' },
      { min: 41, max: 45, amount: 95000, label: '41%–45%' },
      { min: 46, max: 50, amount: 100000, label: '46%–50%' },
      { min: 51, max: 55, amount: 120000, label: '51%–55%' },
      { min: 56, max: 60, amount: 140000, label: '56%–60%' },
      { min: 61, max: 65, amount: 160000, label: '61%–65%' },
      { min: 66, max: 70, amount: 180000, label: '66%–70%' },
      { min: 71, max: 75, amount: 200000, label: '71%–75%' },
      { min: 76, max: 80, amount: 240000, label: '76%–80%' },
      { min: 81, max: 85, amount: 280000, label: '81%–85%' },
      { min: 86, max: 90, amount: 320000, label: '86%–90%' },
      { min: 91, max: 95, amount: 360000, label: '91%–95%' },
      { min: 96, max: 100, amount: 400000, label: '96%–100%' },
    ],
    rounding: { selector: 'whole', digits: 0 },
  },
};

function findBracket(table, percentForSelection) {
  for (const b of table.brackets) {
    const minOk = (b.min === undefined) ? true : percentForSelection >= b.min;
    let maxOk = true;
    if (b.max !== undefined) {
      maxOk = b.maxExclusive ? (percentForSelection < b.max) : (percentForSelection <= b.max);
    }
    if (minOk && maxOk) return b;
  }
  return null;
}

export function getMultiplierTable(doi) {
  const id = getMultiplierTableId(doi);
  if (!id || id === 'unsupported') return null;
  return { id, ...TABLES[id] };
}

export function calcPpdDollars(doi, combinedPercent, opts = {}) {
  const pct = clamp(Number(combinedPercent) || 0, 0, 100);

  const table = getMultiplierTable(doi);
  if (!table) {
    return {
      supported: false,
      reason: 'No multiplier table available for this DOI in this app.',
      percent: pct,
      selectionPercent: pct,
      amountBase: null,
      bracketLabel: null,
      dollars: null,
      tableId: getMultiplierTableId(doi),
    };
  }

  const roundingMode = opts.roundingMode ?? table.rounding?.selector;
  // Table-specific bracket selection: avoid gaps. Modern tables use raw percent (5.49 → <5.5%, 5.50 → 5.5–10.5%).
  // t1995 uses integer brackets, so round to whole number for selection only.
  const selectionPercent =
    roundingMode === 'whole' ? Math.round(pct) : pct;

  const bracket = findBracket(table, selectionPercent);

  if (!bracket) {
    return {
      supported: false,
      reason: 'Could not match a bracket for this percentage.',
      percent: pct,
      selectionPercent,
      amountBase: null,
      bracketLabel: null,
      dollars: null,
      tableId: table.id,
      tableLabel: table.label,
    };
  }

  // Full precision for dollar calculation; round only for display (formatMoney).
  const dollars = (pct / 100) * bracket.amount;

  return {
    supported: true,
    percent: pct,
    selectionPercent,
    amountBase: bracket.amount,
    bracketLabel: bracket.label,
    dollars,
    tableId: table.id,
    tableLabel: table.label,
    roundingMode,
  };
}

export function formatMoney(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '';
  return Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}
