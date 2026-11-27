import axios from './axios-customize';
import { IBackendRes } from '@/types/backend';

export const scheduleDays = [
    ['Monday', 'Thứ Hai'], ['Tuesday', 'Thứ Ba'], ['Wednesday', 'Thứ Tư'],
    ['Thursday', 'Thứ Năm'], ['Friday', 'Thứ Sáu'], ['Saturday', 'Thứ Bảy'], ['Sunday', 'Chủ nhật'],
] as const;
export type ScheduleDay = typeof scheduleDays[number][0];
export type ScheduleInput = {
    day_of_week: ScheduleDay;
    start_time: string;
    end_time: string;
    status: 'available' | 'busy';
    note?: string;
};
export type OwnSchedule = ScheduleInput & { _id: string };

export function scheduleValidation(value: ScheduleInput, slots: OwnSchedule[], editingId?: string): string {
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timePattern.test(value.start_time) || !timePattern.test(value.end_time)) return 'Nhập giờ theo định dạng HH:mm (ví dụ 08:00).';
    if (value.start_time >= value.end_time) return 'Giờ kết thúc phải sau giờ bắt đầu.';
    if (slots.some(slot => slot._id !== editingId && slot.day_of_week === value.day_of_week && slot.start_time < value.end_time && slot.end_time > value.start_time)) {
        return 'Khung giờ này trùng với lịch đã đăng ký của bạn.';
    }
    return '';
}

export function requireStaffResponse<T>(response: IBackendRes<T>): IBackendRes<T> {
    if (response.data == null || response.error || Number(response.statusCode) >= 400 || typeof response.data === 'string') {
        throw new Error(response.message || 'Không thể xử lý yêu cầu.');
    }
    return response;
}

// Authentication identifies the teacher; never submit another teacher's id.
export const fetchOwnSchedules = async () => requireStaffResponse(await axios.get<any, IBackendRes<OwnSchedule[]>>('/schedules/me'));
export const createOwnSchedule = async (value: ScheduleInput) => requireStaffResponse(await axios.post<any, IBackendRes<OwnSchedule>>('/schedules', value));
export const updateOwnSchedule = async (id: string, value: ScheduleInput) =>
    requireStaffResponse(await axios.patch<any, IBackendRes<{ matchedCount: number; modifiedCount: number }>>('/schedules/' + id, { ...value, _id: id }));
export const deleteOwnSchedule = async (id: string) => requireStaffResponse(await axios.delete<any, IBackendRes<unknown>>('/schedules/' + id));
