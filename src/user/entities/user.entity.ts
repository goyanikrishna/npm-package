// User Entity for node-backend-toolkit
import bcrypt from 'bcryptjs';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../project/entities/project.entity';
import { UserProfile } from './user-profile.entity';
import { Session } from '../../session/entities/session.entity';

@Entity({ name: 'users' })
@Index('idx_users_project_email_unique_active', ['project_id', 'email'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_users_project_id')
  @Column({ type: 'uuid', name: 'project_id' })
  project_id: string;

  @ManyToOne(() => Project, (project) => project.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  first_name: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  last_name: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'text', nullable: true })
  avatar: string | null;

  @Column({ type: 'varchar', length: 50, default: 'user' })
  role: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  created_by: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  created_at: Date;

  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updated_by: string | null;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updated_at: Date;

  @Column({ type: 'uuid', nullable: true, name: 'deleted_by' })
  deleted_by: string | null;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true, name: 'deleted_at' })
  deleted_at: Date | null;

  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  profile: UserProfile;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async checkIfPasswordMatch(plainPassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(plainPassword, this.password);
  }
}
