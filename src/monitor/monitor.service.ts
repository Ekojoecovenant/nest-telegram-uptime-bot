/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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

    try {
      const res = await axios.head(website.url, {
        timeout: 10000,
        validateStatus: () => true,
      });

      website.status =
        res.status >= 200 && res.status < 400
          ? WebsiteStatus.UP
          : WebsiteStatus.DOWN;
      website.lastResponseTimeMs = Date.now() - start;
      website.lastCheckedAt = new Date();
      website.lastErrorReason =
        website.status === WebsiteStatus.DOWN
          ? `${res.status} ${res.statusText}`
          : undefined;
    } catch (err: any) {
      website.status = WebsiteStatus.DOWN;
      website.lastResponseTimeMs = null;
      website.lastCheckedAt = new Date();

      // Capture meaningful reason
      if (err.response) {
        // response with error (4xx/5xx)
        website.lastErrorReason = `${err.response.status} ${err.response.statusText || 'unknown'}`;
      } else if (err.request) {
        // no response (timeout, dns fail, connection refused, etc.)
        website.lastErrorReason = err.code || err.message || 'Network failure';
        // common err.code: ECONNREFUSED, ETIMEDOUT, ENOTFOUND, EHOSTUNREACH
      } else {
        website.lastErrorReason = err.message || 'Unknown error';
      }
    }

    return this.websiteRepo.save(website);
  }
}
