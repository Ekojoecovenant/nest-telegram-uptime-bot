import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';
import { Website } from './website.entity';

@Entity()
export class User {
  @PrimaryColumn('bigint')
  id: string;

  @Column({ nullable: true })
  username?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @ManyToMany(() => Website, (website) => website.users, { cascade: true })
  @JoinTable({
    name: 'user_websites',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'website_id', referencedColumnName: 'id' },
  })
  websites: Website[];
}
