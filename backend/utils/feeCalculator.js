// Calculate platform fee (10% by default)
export const calculatePlatformFee = (amount) => {
  const feePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 10;
  return Math.round((amount * feePercentage) / 100);
};

// Calculate net payout to freelancer (90%)
export const calculateNetPayout = (amount) => {
  const platformFee = calculatePlatformFee(amount);
  return amount - platformFee;
};

// Calculate gross amount from net (reverse calculation)
export const calculateGrossAmount = (netAmount) => {
  const feePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 10;
  return Math.round((netAmount * 100) / (100 - feePercentage));
};
