import { z } from 'zod';
import { http } from '../client';

/**
 * 验证码相关 API
 */

/**
 * 验证码类型
 */
export type CaptchaType = 'math' | 'image';

/**
 * 验证码响应 Schema
 */
export const CaptchaDataSchema = z.object({
  id: z.string(),
  content: z.string(), // base64 图片
  type: z.string().optional(),
});
export type CaptchaData = z.infer<typeof CaptchaDataSchema>;

/**
 * 验证码验证请求 Schema
 */
export const VerifyCaptchaParamsSchema = z.object({
  id: z.string(),
  answer: z.string(),
});
export type VerifyCaptchaParams = z.infer<typeof VerifyCaptchaParamsSchema>;

/**
 * 获取验证码
 * @param type 验证码类型 (math | image)，默认 math
 */
export function getCaptcha(type: CaptchaType = 'math') {
  return http.get<CaptchaData>('/captcha', {
    params: { type },
  });
}

/**
 * 验证验证码
 */
export function verifyCaptcha(params: VerifyCaptchaParams) {
  return http.post<{ valid: boolean }>('/captcha/verify', params);
}
