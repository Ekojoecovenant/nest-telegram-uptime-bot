import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/domain/user.entity';
import { Website, WebsiteStatus } from 'src/domain/website.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserWebsiteService {
  private readonly logger = new Logger(UserWebsiteService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Website)
    private readonly websiteRepo: Repository<Website>,
  ) {}

  async getOrCreateUser(telegramId: string, username?: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { id: telegramId } });
    if (!user) {
      user = this.userRepo.create({ id: telegramId, username });
      await this.userRepo.save(user);
    } else if (username && user.username !== username) {
      user.username = username;
      await this.userRepo.save(user);
    }

    return user;
  }

  async addWebsiteForUser(telegramId: string, url: string): Promise<Website> {
    const user = await this.getOrCreateUser(telegramId);

    // Check if already exists (by url, unique)
    let website = await this.websiteRepo.findOne({ where: { url } });

    if (!website) {
      website = this.websiteRepo.create({
        url,
        status: WebsiteStatus.PENDING,
        isActive: true,
      });

      await this.websiteRepo.save(website);
    }

    // Add relation
    await this.userRepo
      .createQueryBuilder()
      .relation(User, 'websites')
      .of(user)
      .add(website);

    return website;
  }

  async getUserWebsites(telegramId: string): Promise<Website[]> {
    const user = await this.userRepo.findOne({
      where: { id: telegramId },
      relations: ['websites'],
    });

    return user?.websites || [];
  }

  async removeWebsiteFromUser(
    telegramId: string,
    websiteId: string,
  ): Promise<void> {
    await this.userRepo
      .createQueryBuilder()
      .relation(User, 'websites')
      .of({ id: telegramId })
      .remove({ id: websiteId });

    // Optional: delete website entity if no users left (clean up)
    const usageCount = await this.websiteRepo
      .createQueryBuilder('website')
      .innerJoin('website.users', 'user')
      .where('website.id = :id', { id: websiteId })
      .getCount();

    if (usageCount === 0) {
      await this.websiteRepo.delete(websiteId);
    }
  }
}
