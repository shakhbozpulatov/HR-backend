import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ScheduleTemplate } from './schedule-template.entity';
import { User } from '@/modules/users/entities/user.entity';

/**
 * ScheduleException - Ish jadvali istisnolari
 * Hodimning standart ish jadvalidan chetga chiqishlarini ifodalaydi (dam olish kunlari, boshqa jadvalga o'tish)
 */
export interface ScheduleException {
  /** Bitta kun uchun istisno (masalan: "2024-01-15" - shu kun dam olish kuni) */
  date?: string;

  /** Istisno boshlanish sanasi - bir necha kunlik istisno uchun boshlanish (masalan: ta'til boshlangan kun) */
  start_date?: string;

  /** Istisno tugash sanasi - bir necha kunlik istisno uchun tugash (masalan: ta'til tugagan kun) */
  end_date?: string;

  /** Muqobil shablon ID - agar hodim boshqa jadvalga o'tsa, shu jadvalni ID raqami */
  template_id?: string;

  /** Istisno turi - OFF (dam olish) yoki ALTERNATE_TEMPLATE (boshqa jadval bo'yicha ishlash) */
  type: 'OFF' | 'ALTERNATE_TEMPLATE';
}

/**
 * UserScheduleAssignment - Hodimning ish jadvalini biriktirish
 * Hodimga qaysi ish jadvali shabloni biriktirilganligi va qachondan qachongacha amal qilishi haqida ma'lumot
 */
@Entity('user_schedule_assignments')
@Index(['user_id', 'effective_from'], { unique: true })
export class UserScheduleAssignment {
  /** Biriktirish identifikatori - har bir biriktirish uchun yagona ID raqami */
  @PrimaryGeneratedColumn('uuid')
  assignment_id: string;

  /** Hodim identifikatori - qaysi hodimga jadval biriktirilayotgani */
  @Column({ type: 'uuid' })
  user_id: string;

  /** Asosiy shablon identifikatori - hodimning odatiy (default) ish jadvali shabloni */
  @Column({ type: 'uuid' })
  default_template_id: string;

  /** Kuchga kirish sanasi - ushbu jadval qaysi kundan boshlab amal qilishi (masalan: yangi hodim yoki jadval o'zgarganda) */
  @Column({ type: 'date' })
  effective_from: Date;

  /** Tugash sanasi - ushbu jadval qaysi kungacha amal qilishi (masalan: hodim boshqa jadvalga o'tganda). null bo'lsa - hozirgi jadval) */
  @Column({ type: 'date', nullable: true })
  effective_to?: Date;

  /** Istisnolar ro'yxati - hodimning ushbu jadvaldan chetga chiqishlari (dam olish kunlari, boshqa jadvalga vaqtincha o'tish va hokazo) */
  @Column({ type: 'json', nullable: true })
  exceptions?: ScheduleException[];

  /** Biriktirish yaratilgan vaqt - bazaga qachon qo'shilganligi */
  @CreateDateColumn()
  created_at: Date;

  /** Biriktirish oxirgi o'zgartirilgan vaqt - qachon oxirgi marta tahrirlanganligi */
  @UpdateDateColumn()
  updated_at: Date;

  /** Hodim bilan bog'lanish (relationship) - qaysi hodimga tegishli */
  @ManyToOne(() => User, (user) => user.schedule_assignments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** Shablon bilan bog'lanish (relationship) - qaysi jadval shabloni ishlatilayotgani */
  @ManyToOne(() => ScheduleTemplate, (template) => template.assignments)
  @JoinColumn({ name: 'default_template_id' })
  default_template: ScheduleTemplate;
}
