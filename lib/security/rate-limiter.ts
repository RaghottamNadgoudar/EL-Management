interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = `rate_limit:${identifier}`;
    
    if (!store[key] || now > store[key].resetTime) {
      store[key] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: store[key].resetTime
      };
    }

    store[key].count++;
    
    const allowed = store[key].count <= this.maxRequests;
    const remaining = Math.max(0, this.maxRequests - store[key].count);
    
    return {
      allowed,
      remaining,
      resetTime: store[key].resetTime
    };
  }

  reset(identifier: string): void {
    const key = `rate_limit:${identifier}`;
    delete store[key];
  }
}

// Global rate limiter instances
export const apiRateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000')
);

export const loginRateLimiter = new RateLimiter(
  parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || '5'),
  parseInt(process.env.LOGIN_RATE_LIMIT_BLOCK_DURATION || '3600000')
);
