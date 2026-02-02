import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Website {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  url: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'up' | 'down';

  @Column({ type: 'float', nullable: true })
  lastResponseTimeMs?: number;

  @Column({ type: 'timestamp', nullable: true })
  lastCheckedAt?: Date;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => User, (user) => user.websites)
  users: User[];
}
