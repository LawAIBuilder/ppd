import { parseDate, getScheduleSet, getMultiplierTableId, formatDateShort } from './lib/doi.js';
import { combinePercents, round } from './lib/combine.js';
import { calcPpdDollars, formatMoney } from './lib/multipliers.js';
import { FLOWS, getFlowById } from './flows/index.js';

const elCard = document.getElementById('card');
const btnReset = document.getElementById('btnReset');

const state = {
  step: 'doi',
  doi: null,
  scheduleSet: null,
  multiplierTableId: null,
  injuries: [],
  // flow state
  flowId: null,
  nodeId: null,
  answers: {},
  history: [],
};

btnReset.addEventListener('click', () => {
  if (!confirm('Reset the calculator and clear all answers?')) return;
  resetAll();
  render();
});

function resetAll() {
  state.step = 'doi';
  state.doi = null;
  state.scheduleSet = null;
  state.multiplierTableId = null;
  state.injuries = [];
  state.flowId = null;
  state.nodeId = null;
  state.answers = {};
  state.history = [];
}

function setStep(step) {
  state.step = step;
  render();
}

function html(strings, ...values) {
  // Simple tagged template to escape interpolations
  const escape = (s) => String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  let out = '';
  strings.forEach((str, i) => {
    out += str;
    if (i < values.length) out += escape(values[i]);
  });
  return out;
}

function render() {
  switch (state.step) {
    case 'doi': return renderDoi();
    case 'bodyPart': return renderBodyPart();
    case 'flow': return renderFlow();
    case 'summary': return renderSummary();
    default:
      elCard.innerHTML = `<p class="muted">Unknown step.</p>`;
  }
}

function renderDoi() {
  const currentVal = state.doi ? state.doi.toISOString().slice(0, 10) : '';
  elCard.innerHTML = `
    <h2 class="question">Date of Injury (DOI)</h2>
    <label class="label" for="doi">Enter DOI</label>
    <input id="doi" type="date" value="${currentVal}" />
    <p class="help">
      DOI determines (1) which Minnesota PPD rating rules apply and (2) which PPD benefit multiplier table applies.
    </p>
    <div class="row" style="margin-top: 14px;">
      <button class="primary" id="btnDoiContinue" type="button">Continue</button>
    </div>
  `;

  document.getElementById('btnDoiContinue').addEventListener('click', () => {
    const v = document.getElementById('doi').value;
    const d = parseDate(v);
    if (!d) {
      alert('Please enter a valid DOI.');
      return;
    }
    state.doi = d;
    state.scheduleSet = getScheduleSet(d);
    state.multiplierTableId = getMultiplierTableId(d);
    setStep('bodyPart');
  });
}

function renderBodyPart() {
  const doiLabel = state.doi ? formatDateShort(state.doi) : '—';
  const sched = state.scheduleSet?.label || '—';
  const mult = state.multiplierTableId || '—';

  const isPost1993 = state.scheduleSet?.id === 'post1993';
  const gatingMessage = `
    <div class="note" style="margin-top: 12px;">
      <strong>Your DOI falls under the pre-7/1/1993 schedule (Rules 5223.0010–5223.0250). This calculator currently supports the post-7/1/1993 schedule only.</strong>
    </div>
  `;

  const flowButtons = isPost1993
    ? FLOWS.map((f) => `
        <button class="primary" data-flow="${f.id}">
          <div><strong>${f.label}</strong></div>
          <div class="muted" style="margin-top:4px;">${f.description || ''}</div>
        </button>
      `).join('')
    : '';

  elCard.innerHTML = `
    <div class="badge">DOI: <strong>${doiLabel}</strong></div>
    <div class="help" style="margin-top:10px;">
      <div class="kv">
        <div class="k">Rating ruleset</div><div class="v">${sched}</div>
        <div class="k">Multiplier table</div><div class="v">${mult}</div>
      </div>
    </div>
    <hr/>
    <h2 class="question">Choose a body part/system to rate</h2>
    ${isPost1993 ? `
      <div class="grid two">
        ${flowButtons}
      </div>
    ` : gatingMessage}
    <hr/>
    <div class="row">
      <button class="secondary" id="btnToSummary" type="button">View summary / finish</button>
    </div>
  `;

  if (isPost1993) {
    document.querySelectorAll('[data-flow]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const flowId = btn.getAttribute('data-flow');
        startFlow(flowId);
      });
    });
  }

  document.getElementById('btnToSummary').addEventListener('click', () => {
    setStep('summary');
  });
}

function startFlow(flowId) {
  const flow = getFlowById(flowId);
  if (!flow) return;

  state.flowId = flowId;
  state.nodeId = flow.start;
  state.answers = {};
  state.history = [];
  state.step = 'flow';
  render();
}

function goNext(nextNodeId) {
  if (!nextNodeId) return;
  state.history.push(state.nodeId);
  state.nodeId = nextNodeId;
  render();
}

function goBack() {
  if (state.history.length === 0) {
    setStep('bodyPart');
    return;
  }
  state.nodeId = state.history.pop();
  render();
}

function setAnswer(nodeId, value) {
  state.answers[nodeId] = value;
}

function renderFlow() {
  const flow = getFlowById(state.flowId);
  if (!flow) {
    elCard.innerHTML = `<p class="muted">No flow loaded.</p>`;
    return;
  }

  const node = flow.nodes[state.nodeId];
  if (!node) {
    elCard.innerHTML = `<p class="muted">Unknown node: ${state.nodeId}</p>`;
    return;
  }

  const top = `
    <div class="badge">${flow.label}</div>
    <div class="row" style="margin-top: 10px;">
      <button class="secondary small" id="btnBack" type="button">← Back</button>
      <button class="secondary small" id="btnCancel" type="button">Cancel</button>
    </div>
    <hr/>
  `;

  if (node.type === 'choice') {
    elCard.innerHTML = `
      ${top}
      <h2 class="question">${node.prompt}</h2>
      ${node.help ? `<p class="help">${node.help}</p>` : ''}
      <div class="grid">
        ${node.options.map((o) => `
          <button class="primary" data-opt="${o.value}">
            ${o.label}
          </button>
        `).join('')}
      </div>
    `;

    document.getElementById('btnBack').addEventListener('click', goBack);
    document.getElementById('btnCancel').addEventListener('click', () => setStep('bodyPart'));

    document.querySelectorAll('[data-opt]').forEach((b) => {
      b.addEventListener('click', () => {
        const v = b.getAttribute('data-opt');
        const opt = node.options.find((x) => String(x.value) === String(v));
        setAnswer(state.nodeId, opt.value);
        goNext(opt.next);
      });
    });
    return;
  }

  if (node.type === 'multi') {
    const prev = state.answers[state.nodeId] || {};
    elCard.innerHTML = `
      ${top}
      <h2 class="question">${node.prompt}</h2>
      ${node.help ? `<p class="help">${node.help}</p>` : ''}
      <div class="grid">
        ${node.options.map((o) => {
          const checked = prev[o.key] ? 'checked' : '';
          return `
            <label style="display:flex; gap:10px; align-items:flex-start; padding:10px; border:1px solid var(--border); border-radius:12px;">
              <input type="checkbox" data-key="${o.key}" ${checked} style="margin-top:4px;"/>
              <span>${o.label}</span>
            </label>
          `;
        }).join('')}
      </div>
      <div class="row" style="margin-top: 14px;">
        <button class="primary" id="btnContinue" type="button">Continue</button>
      </div>
    `;

    document.getElementById('btnBack').addEventListener('click', goBack);
    document.getElementById('btnCancel').addEventListener('click', () => setStep('bodyPart'));

    document.getElementById('btnContinue').addEventListener('click', () => {
      const flags = {};
      document.querySelectorAll('[data-key]').forEach((cb) => {
        flags[cb.getAttribute('data-key')] = cb.checked;
      });
      setAnswer(state.nodeId, flags);
      goNext(node.next);
    });

    return;
  }

  if (node.type === 'info') {
    elCard.innerHTML = `
      ${top}
      <h2 class="question">${node.title || 'Info'}</h2>
      <div class="muted">${node.body || ''}</div>
      <div class="row" style="margin-top: 14px;">
        <button class="primary" id="btnInfoNext" type="button">${node.nextLabel || 'Continue'}</button>
      </div>
    `;

    document.getElementById('btnBack').addEventListener('click', goBack);
    document.getElementById('btnCancel').addEventListener('click', () => setStep('bodyPart'));

    document.getElementById('btnInfoNext').addEventListener('click', () => {
      goNext(node.next);
    });
    return;
  }

  if (node.type === 'result') {
    const ctx = { doi: state.doi, scheduleSet: state.scheduleSet, multiplierTableId: state.multiplierTableId };
    const res = node.compute(state.answers, ctx);

    const breakdownRows = (res.breakdown || []).map((b) => {
      const cite = b.citation ? ` <span class="muted" style="font-size:0.85em;">${b.citation}</span>` : '';
      return `
      <div class="k">${b.label}${cite}</div>
      <div class="v">${round(b.percent, 1)}%</div>
    `;
    }).join('');

    const prePostCap =
      res.preCapPercent != null && res.postCapPercent != null && res.preCapPercent > res.postCapPercent
        ? `
      <div class="kv">
        <div class="k">Total before cap</div><div class="v">${round(res.preCapPercent, 1)}%</div>
      </div>
      <div class="kv">
        <div class="k">After 34% cap</div><div class="v">${round(res.postCapPercent, 1)}%</div>
      </div>
      `
        : '';

    const notes = (res.notes || []).map((t) => `<li>${t}</li>`).join('');

    elCard.innerHTML = `
      ${top}
      <div class="badge ok">Result</div>
      <h2 class="question" style="margin-top: 10px;">${res.title || 'Rating'}</h2>

      <div class="kv" style="margin-top: 12px;">
        <div class="k">Whole body %</div><div class="v">${res.percent}%</div>
      </div>
      ${prePostCap}
      ${breakdownRows ? `<div class="kv">${breakdownRows}</div>` : ''}

      ${notes ? `<p class="label" style="margin-top: 14px;">Notes</p><ul class="list">${notes}</ul>` : ''}

      <hr/>
      <div class="row">
        <button class="primary" id="btnAdd" type="button">Add this rating</button>
        <button class="secondary" id="btnDiscard" type="button">Discard</button>
      </div>
    `;

    document.getElementById('btnBack').addEventListener('click', goBack);
    document.getElementById('btnCancel').addEventListener('click', () => setStep('bodyPart'));

    document.getElementById('btnAdd').addEventListener('click', () => {
      state.injuries.push({
        id: crypto.randomUUID(),
        flowId: state.flowId,
        flowLabel: flow.label,
        title: res.title,
        percent: res.percent,
        breakdown: res.breakdown || [],
        notes: res.notes || [],
        answers: { ...state.answers },
      });
      setStep('bodyPart');
    });

    document.getElementById('btnDiscard').addEventListener('click', () => setStep('bodyPart'));
    return;
  }

  elCard.innerHTML = `${top}<p class="muted">Unsupported node type: ${node.type}</p>`;
  document.getElementById('btnBack').addEventListener('click', goBack);
  document.getElementById('btnCancel').addEventListener('click', () => setStep('bodyPart'));
}

function renderSummary() {
  const doiLabel = state.doi ? formatDateShort(state.doi) : '—';

  const percents = state.injuries.map((x) => Number(x.percent) || 0).filter((n) => n > 0);
  const combined = combinePercents(percents);
  const combinedRounded = round(combined, 1);

  // Full-precision combined % for bracket selection and dollar calc; round for display only
  const dollars = calcPpdDollars(state.doi, combined);
  const dollarsStr = dollars.supported ? formatMoney(dollars.dollars) : 'Not supported';

  const list = state.injuries.length
    ? state.injuries.map((inj) => `
        <div style="border:1px solid var(--border); border-radius: 12px; padding: 12px; margin-bottom: 10px;">
          <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
            <div>
              <strong>${inj.flowLabel}</strong>
              <div class="muted" style="margin-top:4px;">${inj.title || ''}</div>
            </div>
            <div class="badge ok">${inj.percent}%</div>
          </div>
          <div class="row" style="margin-top: 10px;">
            <button class="secondary small" data-remove="${inj.id}">Remove</button>
          </div>
        </div>
      `).join('')
    : `<p class="muted">No body-part ratings added yet.</p>`;

  const dollarsPanel = dollars.supported
    ? `
      <div class="kv" style="margin-top: 10px;">
        <div class="k">Multiplier table</div><div class="v">${dollars.tableLabel}</div>
        <div class="k">Bracket used</div><div class="v">${dollars.bracketLabel} (selection pct: ${dollars.selectionPercent}%)</div>
        <div class="k">Base amount</div><div class="v">${formatMoney(dollars.amountBase)}</div>
        <div class="k">Estimated PPD amount</div><div class="v">${dollarsStr}</div>
      </div>
    `
    : `
      <div class="note" style="margin-top: 10px;">
        <strong>Benefit estimate unavailable for this DOI.</strong>
        <div class="muted" style="margin-top:6px;">${dollars.reason || ''}</div>
      </div>
    `;

  elCard.innerHTML = `
    <div class="badge">DOI: <strong>${doiLabel}</strong></div>
    <h2 class="question" style="margin-top: 12px;">Summary</h2>

    <div class="kv" style="margin-top: 10px;">
      <div class="k">Ratings added</div><div class="v">${state.injuries.length}</div>
      <div class="k">Combined whole-body %</div><div class="v">${combinedRounded}%</div>
    </div>

    ${dollarsPanel}

    <hr/>

    <h3 style="margin: 0 0 10px 0;">Body-part ratings</h3>
    ${list}

    <div class="row" style="margin-top: 14px;">
      <button class="primary" id="btnAddMore" type="button">Add another body part</button>
      <button class="secondary" id="btnBackToDoi" type="button">Change DOI</button>
    </div>
  `;

  document.getElementById('btnAddMore').addEventListener('click', () => setStep('bodyPart'));
  document.getElementById('btnBackToDoi').addEventListener('click', () => {
    // keep injuries but allow DOI change (warn)
    if (state.injuries.length > 0) {
      const ok = confirm('Changing DOI changes which rules/multipliers apply. Continue?');
      if (!ok) return;
    }
    setStep('doi');
  });

  document.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-remove');
      state.injuries = state.injuries.filter((x) => x.id !== id);
      render();
    });
  });
}

// initial render
render();
