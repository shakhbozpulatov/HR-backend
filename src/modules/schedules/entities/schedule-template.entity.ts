import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserScheduleAssignment } from './employee-schedule-assignment.entity';
import { IsBoolean, IsString } from 'class-validator';
import { Company } from '@/modules/company/entities/company.entity';

/**
 * BreakTime class - Tanaffus vaqtlarini ifodalaydi
 * Hodimlarning ish vaqti davomida oladigan tanaffuslarini belgilash uchun ishlatiladi
 */
export class BreakTime {
  /** Tanaffus boshlanish vaqti (masalan: "12:00") */
  @IsString()
  start_time: string;

  /** Tanaffus tugash vaqti (masalan: "13:00") */
  @IsString()
  end_time: string;

  /** Tanaffus pullik yoki pullikmasi (true bo'lsa - tanaffus ish vaqtiga kiritiladi) */
  @IsBoolean()
  paid: boolean;
}

/**
 * ScheduleTemplate - Ish jadvali shablonlari
 * Hodimlarning ish vaqtlarini, ish kunlarini va boshqa parametrlarini belgilovchi shablon
 */
@Entity('schedule_templates')
export class ScheduleTemplate {
  /** Shablon identifikatori - har bir shablonning yagona ID raqami */
  @PrimaryGeneratedColumn('uuid')
  template_id: string;

  /** Kompaniya identifikatori - ushbu shablon qaysi kompaniyaga tegishli ekanligi */
  @Column({ type: 'uuid', nullable: true })
  company_id: string;

  /** Shablon nomi - masalan: "Standart ish jadvali", "Smenali ish", va hokazo */
  @Column()
  name: string;

  /** Ish kunlari - hafta kunlari ro'yxati (masalan: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) */
  @Column({ type: 'json' })
  workdays: string[];

  /** Ish boshlanish vaqti - hodim soat nechida ishga kelishi kerak (masalan: "09:00") */
  @Column({ type: 'time' })
  start_time: string;

  /** Ish tugash vaqti - hodim soat nechida ishdan ketishi kerak (masalan: "18:00") */
  @Column({ type: 'time' })
  end_time: string;

  /** Tanaffuslar ro'yxati - hodimning ish vaqti davomidagi tanaffuslari (masalan: tushlik vaqti) */
  @Column({ type: 'jsonb', nullable: true })
  breaks?: BreakTime[];

  /** Kirish uchun kechikish vaqti (daqiqada) - hodim ish boshlanish vaqtidan necha daqiqa kechiksa hali kechikkan hisoblanmaydi (default: 5 daqiqa) */
  @Column({ type: 'integer', default: 5 })
  grace_in_min: number;

  /** Chiqish uchun kechikish vaqti (daqiqada) - hodim ish tugash vaqtidan necha daqiqa oldin ketsa hali erta ketgan hisoblanmaydi (default: 0 daqiqa) */
  @Column({ type: 'integer', default: 0 })
  grace_out_min: number;

  /** Vaqtni yaxlitlash qoidasi (daqiqada) - ish vaqtini hisoblashda qancha daqiqaga yaxlitlanadi (masalan: 5 daqiqaga - 09:03 da kelsa 09:05 hisoblanadi) */
  @Column({ type: 'integer', default: 1 })
  rounding_min: number;

  /** Shablon yaratilgan vaqt - bazaga qachon qo'shilganligi */
  @CreateDateColumn()
  created_at: Date;

  /** Shablon oxirgi o'zgartirilgan vaqt - qachon oxirgi marta tahrirlanganligi */
  @UpdateDateColumn()
  updated_at: Date;

  /** Ushbu shablonga biriktirilgan hodimlar ro'yxati (relationship) */
  @OneToMany(
    () => UserScheduleAssignment,
    (assignment) => assignment.default_template,
  )
  assignments: UserScheduleAssignment[];

  /** Kompaniya bilan bog'lanish (relationship) - shablon qaysi kompaniyaga tegishli */
  @ManyToOne(() => Company, (company) => company.schedule_templates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
