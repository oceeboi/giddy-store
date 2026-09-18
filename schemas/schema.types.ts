import z from 'zod';
import {
  forgotPasswordSchema,
  loginSchema,
  magicAuthSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyMagicSchema,
} from './auth.schemas';

// Auth types

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailBody = z.infer<typeof verifyEmailSchema>;
export type MagicAuthBody = z.infer<typeof magicAuthSchema>;
export type VerifyMagicBody = z.infer<typeof verifyMagicSchema>;
