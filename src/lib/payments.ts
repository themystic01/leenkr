import type { Currency } from '../store'

// Nigerian gateways first: Stripe does not onboard Nigerian businesses, so the
// checkout is built around the local rails. Nothing is charged yet — every
// provider runs through the simulator until its keys are added.
export type GatewayKey = 'paystack' | 'flutterwave' | 'monnify'

export type Gateway = {
  key: GatewayKey
  label: string
  note: string
  channels: string
}

export const GATEWAYS: Gateway[] = [
  {
    key: 'paystack',
    label: 'Paystack',
    note: 'Cards, bank transfer, USSD and Apple Pay.',
    channels: 'Card · Transfer · USSD',
  },
  {
    key: 'flutterwave',
    label: 'Flutterwave',
    note: 'Cards, transfers, mobile money and POS.',
    channels: 'Card · Transfer · Mobile money',
  },
  {
    key: 'monnify',
    label: 'Monnify',
    note: 'Bank transfer and USSD, strong for Nigerian checkouts.',
    channels: 'Transfer · USSD',
  },
]

/** 5% of the sale, matching the platform fee the database records. */
export const PLATFORM_RATE = 0.05

/**
 * Local acquiring is cheap but not flat: 1.5% + ₦100, capped at ₦2,000. This is
 * the number a Nigerian creator expects to see, not the 2.9% + 30¢ of Stripe.
 */
export function gatewayFee(amount: number, currency: Currency): number {
  if (currency === 'NGN') {
    return Math.min(Math.round((amount * 0.015 + 100) * 100) / 100, 2000)
  }
  return Math.round((amount * 0.029 + 1) * 100) / 100
}

export type Split = { platform: number; gateway: number; net: number }

export function splitPayment(amount: number, currency: Currency): Split {
  const platform = Math.round(amount * PLATFORM_RATE * 100) / 100
  const gateway = Math.min(gatewayFee(amount, currency), Math.max(amount - platform, 0))
  return { platform, gateway, net: Math.max(Math.round((amount - platform - gateway) * 100) / 100, 0) }
}

const SYMBOLS: Record<Currency, string> = { USD: '$', EUR: '€', GBP: '£', NGN: '₦' }

export function money(amount: number, currency: Currency = 'NGN') {
  const symbol = SYMBOLS[currency] ?? '₦'
  return `${symbol}${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    Number.isFinite(amount) ? amount : 0,
  )}`
}
