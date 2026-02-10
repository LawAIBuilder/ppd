# MN PPD Calculator — Simple Wizard (Static Site)

This is a **very simple static** “choose-your-own-adventure” wizard that:
1) asks **Date of Injury (DOI)**,
2) lets the user pick a **body part** flow,
3) produces an estimated **whole body %**, and
4) estimates the **PPD dollar amount** using MN PPD multiplier tables.

## What’s implemented (demo scope)

✅ DOI → selects:
- Rating schedule set (pre/post 7/1/1993) *(display only for now)*
- PPD multiplier table (10/1/1995+ implemented)

✅ Benefit estimate:
- Uses MN DLI “Common benefit adjustments” PPD multiplier table (effective-date ranges).

✅ Body part flows:
- **Lumbar spine (radicular syndromes + fusion add-on)** – implements 5223.0390 subp. 4–5 (core logic).
- **Knee & lower leg** – implements common categories from 5223.0510, including DOI ≥ 8/9/2010 toggles.

⚠️ Notes:
- This is a **framework + demo**. Some body parts and subparts are not implemented yet.
- The knee ROM table is implemented using a standard reading; always confirm with the official rule text.

## Run locally

Because it’s static, you can run it with any static server. Example:

```bash
cd ppd-calculator-mn
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy

### GitHub Pages
- Put these files in a repo.
- In GitHub Pages settings, deploy from the repo root (or `/docs` if you move it).

### Vercel
- **Git:** Push to your repo; if Vercel Git integration is enabled for [mncompbuddy/ppd](https://vercel.com/mncompbuddy/ppd), pushes to `main` will deploy automatically.
- **CLI:** This repo is linked to the Vercel project **ppd** (mncompbuddy). From the project root run:
  ```bash
  vercel login   # once, if needed
  vercel deploy --prod
  ```
  Framework: **Other**; output: static (no build step required).

## Add more rules

See `src/flows/`:
- Add a new flow module that exports `{ id, label, start, nodes }`
- Add it to `src/flows/index.js`

Each flow ends with a `result` node that returns:

```js
{
  title: string,
  percent: number,
  breakdown: { label: string, percent: number }[],
  notes: string[]
}
```

## Disclaimer

This project is for **educational estimation** only and is not legal advice or a medical impairment rating.
Always verify with the Minnesota Statutes/Rules and the medical record.
