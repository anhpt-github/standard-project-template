import { Injectable } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';
import { RedisService } from '../redis/redis.service';

require('dotenv').config();

@Injectable()
export class OtpService {
  constructor(
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
  ) { }

  async checkBeforeSend(email: string) {
    const currentTtl = await this.redisService.ttl(email); // thời gian tồn tại còn lại
    if (Number(process.env.OTP_TTL) - currentTtl > Number(process.env.OTP_TIME_TO_RESEND)) {
      return true;
    }
    return false;
  }

  async send(email: string, initValue: number) {
    const otp = (Math.trunc(Math.random() * initValue * 9) + initValue).toString(); // tạo otp
    await this.notificationService.sendOtp(email, otp);
    this.redisService.set(email, otp, 'EX', Number(process.env.OTP_TTL));
  }

  async verify(email: string, otp: string) {
    const storedOtp = await this.redisService.get(email);
    if (storedOtp === otp) {
      this.redisService.del(email);
      return true;
    }
    return false;
  }
}
