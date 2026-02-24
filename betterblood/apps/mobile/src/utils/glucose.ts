export const MMOL_FACTOR = 18.0182;

/** mg/dL → mmol/L (1 decimal place) */
export const mgToMmol = (mg: number): number =>
  Math.round((mg / MMOL_FACTOR) * 10) / 10;

/** mmol/L → mg/dL (nearest integer) */
export const mmolToMg = (mmol: number): number =>
  Math.round(mmol * MMOL_FACTOR);

/** Format a stored mg/dL value for display in the user's chosen unit */
export const formatGlucose = (mgValue: number, unit: 'mg_dl' | 'mmol_l'): string =>
  unit === 'mmol_l' ? mgToMmol(mgValue).toFixed(1) : String(Math.round(mgValue));

/** Unit label string */
export const unitLabel = (unit: 'mg_dl' | 'mmol_l'): string =>
  unit === 'mmol_l' ? 'mmol/L' : 'mg/dL';

/** Parse a user-typed glucose string (in selected unit) back to mg/dL */
export const parseGlucoseInput = (value: string, unit: 'mg_dl' | 'mmol_l'): number => {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) return 0;
  return unit === 'mmol_l' ? mmolToMg(num) : num;
};

/** Format ISF for display — stored in mg/dL/u, converted if needed */
export const formatISF = (isf: number, unit: 'mg_dl' | 'mmol_l'): string =>
  unit === 'mmol_l'
    ? `${mgToMmol(isf).toFixed(1)} mmol/L/u`
    : `${isf} mg/dL/u`;
