import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Website, WebsiteStatus } from 'src/domain/website.entity';
import { Repository } from 'typeorm';
import axios from 'axios';

@Injectable()
export class MonitorService {
  private readonly logger = new Logger(MonitorService.name);

  constructor(
    @InjectRepository(Website)
    private websiteRepo: Repository<Website>,
  ) {}

  async checkWebsite(website: Website): Promise<Website> {
    const start = Date.now();
    let status: WebsiteStatus = WebsiteStatus.DOWN;
    let responseTimeMs: number | null = null;

    try {
      const res = await axios.head(website.url, {
        timeout: 10000,
        validateStatus: () => true,
      });

      if (res.status >= 200 && res.status < 400) {
        status = WebsiteStatus.UP;
      }
      responseTimeMs = Date.now() - start;
    } catch {
      // Network error, timeout, => DOWN
      status = WebsiteStatus.DOWN;
      responseTimeMs = null;
    }

    website.status = status;
    website.lastResponseTimeMs = responseTimeMs;
    website.lastCheckedAt = new Date();

    return this.websiteRepo.save(website);
  }
}
