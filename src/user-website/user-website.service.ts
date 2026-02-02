import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/domain/entities/user.entity';
import { Website } from 'src/domain/entities/website.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserWebsiteService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Website)
    private websiteRepo: Repository<Website>,
  ) {}

  async addWebsite(telegramId: string, url: string): Promise<Website> {
    // 1. Find or create user
    let user = await this.userRepo.findOne({ where: { id: telegramId } });
    if (!user) {
      user = this.userRepo.create({
        id: telegramId,
      });
      await this.userRepo.save(user);
    }

    // 2. Check if URL already exists (globally for now)
    let website = await this.websiteRepo.findOne({ where: { url } });
    if (!website) {
      website = this.websiteRepo.create({
        url,
        status: 'pending',
        isActive: true,
      });
      await this.websiteRepo.save(website);
    }

    // 3. Link them if not already linked
    if (!user.websites?.some((w) => w.id === website.id)) {
      user.websites = [...(user.websites || []), website];
      await this.userRepo.save(user); //save the relation
    }

    return website;
  }
}
