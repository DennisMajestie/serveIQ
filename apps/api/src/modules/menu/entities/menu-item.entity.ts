import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  branch_id: string;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column({ type: 'integer' })
  price_kobo: number;

  @Column({ default: 'unit' })
  unit: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ default: true })
  is_available: boolean;

  @Column()
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
