import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  changePassword,
  forgetPassword,
  login,
  logout,
  refreshToken,
  resendOtp,
  resetPassword,
  signUp,
  socialLogin,
  verifyOtp,
} from './auth.controller.js';
import {
  changePasswordSchema,
  forgetPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  resendOtpSchema,
  resetPasswordSchema,
  signUpSchema,
  socialLoginSchema,
  verifyOtpSchema,
} from './auth.validation.js';

const router = Router();

// Public Authentication Endpoints
router.post('/sign-up', authLimiter, validate(signUpSchema), signUp);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', authLimiter, validate(resendOtpSchema), resendOtp);
router.post('/forget-password', authLimiter, validate(forgetPasswordSchema), forgetPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/social-login', authLimiter, validate(socialLoginSchema), socialLogin);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);

// Protected Authentication Endpoints
router.use(authenticate);

router.post('/change-password', validate(changePasswordSchema), changePassword);
router.post('/logout', logout);

export default router;
