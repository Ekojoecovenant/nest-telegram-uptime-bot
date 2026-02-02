import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';
import { Website } from './website.entity';

@Entity()
export class User {
  @PrimaryColumn('varchar')
  id: string; // Telegram user ID

  @Column({ nullable: true })
  username?: string; // optional

  @ManyToMany(() => Website, (website) => website.users, { cascade: true })
  @JoinTable()
  websites: Website[];
}
