import axios from './axios-customize';
import { IBackendRes, IClassroomWithDetails, ICourse, IModelPaginate } from '@/types/backend';

export interface ManagerTeacher {
    _id: string;
    name: string;
    full_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    subject?: string;
    experience_years?: number;
    status?: string;
    createdAt?: string;
    role?: { _id: string; name: string };
}

export interface CreateManagerClassroom {
    course_id: string;
    teacher_id: string;
    room: string;
    class_name: string;
    max_student: string;
    start_time: string;
    end_time: string;
    status: 'OPEN';
}

const dataOf = <T>(response: IBackendRes<T>): T => {
    if (response.data === undefined || Number(response.statusCode) >= 400) {
        throw new Error(response.message || 'Không thể tải dữ liệu.');
    }
    return response.data;
};

const fetchPage = async <T>(path: string, page = 1, query: Record<string, string> = {}, pageSize = 20) => {
    const params = new URLSearchParams({ current: String(page), pageSize: String(pageSize), ...query });
    return dataOf(await axios.get<unknown, IBackendRes<IModelPaginate<T>>>(`${path}?${params}`));
};

export const fetchManagerClasses = (page = 1, status = '') =>
    fetchPage<IClassroomWithDetails>('/classrooms', page, status ? { status } : {});

export const fetchPendingTeachers = (page = 1, pageSize = 20) =>
    fetchPage<ManagerTeacher>('/users/pending-teachers', page, {}, pageSize);

// These three user endpoints deliberately skip permission checks in the backend.
// The manager route guard controls access to this workflow.
export const reviewManagerTeacher = async (id: string, decision: 'approve' | 'reject') =>
    dataOf(await axios.patch<unknown, IBackendRes<ManagerTeacher>>(`/users/${decision}-teacher/${encodeURIComponent(id)}`));

export const createManagerClass = async (payload: CreateManagerClassroom) =>
    dataOf(await axios.post<unknown, IBackendRes<IClassroomWithDetails>>('/classrooms', payload));

const allPages = async <T>(path: string, query: Record<string, string> = {}) => {
    const first = await fetchPage<T>(path, 1, query, 100);
    const result = [...first.result];
    for (let page = 2; page <= first.meta.pages; page += 1) {
        result.push(...(await fetchPage<T>(path, page, query, 100)).result);
    }
    return result;
};

export const fetchManagerClassOptions = async () => {
    const [courses, users] = await Promise.all([
        allPages<ICourse>('/courses'),
        allPages<ManagerTeacher>('/users'),
    ]);
    return {
        courses: courses.filter((course) => course._id && course.status?.toUpperCase() !== 'INACTIVE'),
        teachers: users.filter((user) => user.role?.name?.toUpperCase() === 'TEACHER' && user.status?.toUpperCase() === 'ACTIVE'),
    };
};

export const managerErrorMessage = (error: unknown, fallback = 'Không thể tải dữ liệu. Vui lòng thử lại.') => {
    const message = (error as { message?: unknown } | null)?.message;
    return Array.isArray(message) ? message.join('\n') : typeof message === 'string' ? message : fallback;
};
