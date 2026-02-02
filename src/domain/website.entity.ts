import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

export enum WebsiteStatus {
  UP = 'up',
  DOWN = 'down',
  PENDING = 'pending',
  UNKNOWN = 'unknown',
}

@Entity()
export class Website {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  url: string;

  @Column({
    type: 'enum',
    enum: WebsiteStatus,
    default: WebsiteStatus.UNKNOWN,
  })
  status: WebsiteStatus;

  @Column({ type: 'int', nullable: true })
  lastResponseTimeMs: number | null;

  @Column({ type: 'timestamp', nullable: true })
  lastCheckedAt: Date | null;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => User, (user) => user.websites)
  users: User[];
}
