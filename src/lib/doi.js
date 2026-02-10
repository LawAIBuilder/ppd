export function parseDate(input) {
  if (!input) return null;
  // input expected: YYYY-MM-DD
  const [y, m, d] = String(input).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d); // local midnight, no UTC shift
}

export function isOnOrAfter(date, y, m, d) {
  if (!date) return false;
  const cmp = new Date(y, m - 1, d);
  cmp.setHours(0, 0, 0, 0);
  return date.getTime() >= cmp.getTime();
}

export function isBefore(date, y, m, d) {
  if (!date) return false;
  const cmp = new Date(y, m - 1, d);
  cmp.setHours(0, 0, 0, 0);
  return date.getTime() < cmp.getTime();
}

export function getScheduleSet(doi) {
  // MN DLI guidance:
  // - Injuries on/after 1993-07-01: use Minn. R. 5223.0300–5223.0650
  // - Injuries 1985-11-18 through 1993-06-30: use Minn. R. 5223.0010–5223.0250
  if (!doi) return { id: null, label: 'Unknown' };
  if (isOnOrAfter(doi, 1993, 7, 1)) {
    return { id: 'post1993', label: 'Rules 5223.0300–5223.0650 (DOI ≥ 7/1/1993)' };
  }
  if (isOnOrAfter(doi, 1985, 11, 18) && isBefore(doi, 1993, 7, 1)) {
    return { id: 'pre1993', label: 'Rules 5223.0010–5223.0250 (11/18/1985–6/30/1993)' };
  }
  return { id: 'pre1985', label: 'Earlier DOI (not fully implemented)' };
}

export function getMultiplierTableId(doi) {
  if (!doi) return null;
  if (isOnOrAfter(doi, 2023, 10, 1)) return 't2023';
  if (isOnOrAfter(doi, 2018, 10, 1)) return 't2018';
  if (isOnOrAfter(doi, 2000, 10, 1)) return 't2000';
  if (isOnOrAfter(doi, 1995, 10, 1)) return 't1995';
  return 'unsupported';
}

export function formatDateShort(date) {
  if (!date) return '';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yy = date.getFullYear();
  return `${mm}/${dd}/${yy}`;
}
