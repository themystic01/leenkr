// Nigerian banks with their CBN codes, used for payout accounts. A payout
// provider (Paystack Transfers, Flutterwave Transfers, Monnify) is keyed by the
// same code, so this list is the bridge to a real payout rail.
export type Bank = { code: string; name: string }

export const NIGERIAN_BANKS: Bank[] = [
  { code: '044', name: 'Access Bank' },
  { code: '063', name: 'Access Bank (Diamond)' },
  { code: '035', name: 'ALAT by Wema' },
  { code: '565', name: 'Carbon' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '084', name: 'Enterprise Bank' },
  { code: '51318', name: 'FairMoney' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '50211', name: 'Kuda Bank' },
  { code: '50515', name: 'Moniepoint MFB' },
  { code: '999991', name: 'OPay' },
  { code: '999992', name: 'PalmPay' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '125', name: 'Rubies MFB' },
  { code: '51310', name: 'Sparkle Microfinance Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'Suntrust Bank' },
  { code: '102', name: 'Titan Trust Bank' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '566', name: 'VFD Microfinance Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '057', name: 'Zenith Bank' },
]

export function bankName(code: string) {
  return NIGERIAN_BANKS.find((bank) => bank.code === code)?.name ?? 'Bank'
}
