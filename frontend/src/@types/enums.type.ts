export const Roles = {
  Admin: "Admin",
  Member: "Member",
  Merchant: "Merchant",
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export const OrderStatuses = {
  Pending: "Pending",
  Processing: "Processing",
  Shipping: "Shipping",
  Completed: "Completed",
  Cancelled: "Cancelled",
} as const;

export type OrderStatus = (typeof OrderStatuses)[keyof typeof OrderStatuses];

export const PaymentStatuses = {
  Pending: "Pending",
  Paid: "Paid",
  Failed: "Failed",
} as const;

export type PaymentStatus = (typeof PaymentStatuses)[keyof typeof PaymentStatuses];

export const PaymentMethods = {
  COD: "COD",
  VNPay: "VNPay",
} as const;

export type PaymentMethod = (typeof PaymentMethods)[keyof typeof PaymentMethods];

export const ReviewStatuses = {
  WaitingApproval: "WaitingApproval",
  Rejected: "Rejected",
  Approved: "Approved",
} as const;

export type ReviewStatus = (typeof ReviewStatuses)[keyof typeof ReviewStatuses];

export const Providers = {
  Local: "Local",
  Google: "Google",
} as const;

export type Provider = (typeof Providers)[keyof typeof Providers];

export const OtpPurposes = {
  ResetPassword: "ResetPassword",
  EmailVerification: "EmailVerification",
  PhoneVerification: "PhoneVerification",
  TwoFactorAuth: "TwoFactorAuth",
  LoginVerification: "LoginVerification",
} as const;

export type OtpPurpose = (typeof OtpPurposes)[keyof typeof OtpPurposes];
