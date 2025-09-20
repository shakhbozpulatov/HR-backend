export declare enum ExceptionType {
    OFF = "OFF",
    ALTERNATE_TEMPLATE = "ALTERNATE_TEMPLATE"
}
export declare class CreateExceptionDto {
    date?: string;
    start_date?: string;
    end_date?: string;
    template_id?: string;
    type: ExceptionType;
}
