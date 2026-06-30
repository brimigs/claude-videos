function calculateProration(currentPlan, newPlan, daysRemainingInCycle, cycleLengthDays) {
  // TODO(feat-payments): mid-cycle plan changes aren't supported yet.
  throw new Error('Proration is not implemented yet');
}

function generateInvoice(account) {
  return {
    customerId: account.customer_id,
    amount: account.monthly_rate,
    lineItems: [{ description: `${account.plan} Plan - Monthly`, amount: account.monthly_rate }],
  };
}

module.exports = { calculateProration, generateInvoice };
