import { User } from '@/modules/users/entities/user.entity';
import { TerminalDevice } from '@/modules/terminals/entities/terminal-device.entity';
export declare enum EnrollmentStatus {
    PENDING = "pending",
    PENDING_BIOMETRIC = "pending_biometric",
    COMPLETED = "completed",
    FAILED = "failed",
    DISABLED = "disabled"
}
export declare class UserDeviceMapping {
    mapping_id: string;
    user_id: string;
    terminal_user_id: string;
    device_id: string;
    enrollment_status: EnrollmentStatus;
    fingerprint_enrolled: boolean;
    fingerprint_count: number;
    face_enrolled: boolean;
    card_number?: string;
    pin_code?: string;
    is_active: boolean;
    enrolled_by?: string;
    enrolled_at?: Date;
    last_sync_at?: Date;
    sync_metadata?: any;
    created_at: Date;
    updated_at: Date;
    user: User;
    device: TerminalDevice;
}
