// quick test for coerceNumericFields logic
function toNumber(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
function coerceNumericFields(data) {
  const copy = { ...data };
  copy.amountQuoted = toNumber(copy.amountQuoted);
  copy.budget = toNumber(copy.budget);
  copy.noOfSamples = toNumber(copy.noOfSamples);
  copy.age = toNumber(copy.age);
  copy.shippingAmount = toNumber(copy.shippingAmount);
  copy.phlebotomistCharges = toNumber(copy.phlebotomistCharges);
  copy.tat = toNumber(copy.tat);
  return copy;
}

const sample = {
  amountQuoted: '1200',
  budget: '',
  noOfSamples: '50',
  age: '45',
  shippingAmount: '200.5',
  phlebotomistCharges: '150.00',
  tat: '14'
};
console.log('input:', sample);
console.log('output:', coerceNumericFields(sample));
