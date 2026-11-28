import axios from './axios-customize';
import { IBackendRes, IClassroomWithDetails, ICourse, IModelPaginate } from '@/types/backend';

export interface ManagerPerson {
    _id: string;
    name: string;
    full_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    age?: number;
    gender?: string;
    birthday?: string;
    subject?: string;
    experience_years?: number;
    status?: string;
    createdAt?: string;
    role?: { _id: string; name: string };
}

export type ManagerTeacher = ManagerPerson;

export interface ManagerCourseInput {
    name: string;
    description?: string;
    level?: string;
    duration?: string;
    price?: string;
    status?: string;
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

export interface UpdateManagerClassroom extends Omit<CreateManagerClassroom, 'status'> {
    _id: string;
    status: 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED';
}

const dataOf = <T>(response: IBackendRes<T>): T => {
    if (response.data === undefined || Number(response.statusCode) >= 400) {
        throw new Error(response.message || 'Không thể tải dữ liệu.');
    }
    return response.data;
};

const normalizeManagerRole = (value?: string) =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase();

const fetchPage = async <T>(path: string, page = 1, query: Record<string, string> = {}, pageSize = 20) => {
    const params = new URLSearchParams({ current: String(page), pageSize: String(pageSize), ...query });
    return dataOf(await axios.get<unknown, IBackendRes<IModelPaginate<T>>>(`${path}?${params}`));
};

export const fetchManagerClasses = (page = 1, status = '') =>
    fetchPage<IClassroomWithDetails>('/classrooms', page, status ? { status } : {});

export const fetchManagerCourses = (page = 1) =>
    fetchPage<ICourse>('/courses', page, {}, 100);

export const fetchManagerPeople = async (roleName: 'STUDENT' | 'TEACHER') => {
    const people = await allPages<ManagerPerson>('/users', { populate: 'role' });
    return people.filter(
        (person) => {
            const role = normalizeManagerRole(person.role?.name);
            return role === roleName ||
                (roleName === 'TEACHER' && role === 'GIANG VIEN') ||
                (roleName === 'STUDENT' && role === 'HOC VIEN');
        },
    );
};

export const fetchPendingTeachers = (page = 1, pageSize = 20) =>
    fetchPage<ManagerTeacher>('/users/pending-teachers', page, {}, pageSize);

export const reviewManagerTeacher = async (
    id: string,
    decision: 'approve' | 'reject',
) =>
    dataOf(
        await axios.patch<unknown, IBackendRes<ManagerTeacher>>(
            `/users/${decision}-teacher/${encodeURIComponent(id)}`,
        ),
    );

export const updateManagerPerson = async (
    person: ManagerPerson,
    payload: Partial<Omit<ManagerPerson, '_id' | 'role'>>,
) => {
    if (!person._id || !person.role?._id) {
        throw new Error('Không đủ thông tin vai trò để cập nhật tài khoản.');
    }
    const response = await axios.patch<
        unknown,
        IBackendRes<{ matchedCount?: number }>
    >(`/users/${person._id}`, {
        _id: person._id,
        name: payload.name ?? person.name,
        email: payload.email ?? person.email,
        role: person.role._id,
        ...payload,
    });
    const result = dataOf(response);
    if (typeof result.matchedCount !== 'number' || result.matchedCount === 0) {
        throw new Error('Không tìm thấy tài khoản cần cập nhật.');
    }
    return result;
};

export const createManagerCourse = async (payload: ManagerCourseInput) =>
    dataOf(await axios.post<unknown, IBackendRes<ICourse>>('/courses', payload));

export const updateManagerCourse = async (
    id: string,
    payload: Partial<ManagerCourseInput>,
) => {
    const response = await axios.patch<
        unknown,
        IBackendRes<{ matchedCount?: number }>
    >(`/courses/${id}`, { ...payload, _id: id });
    const result = dataOf(response);
    if (typeof result.matchedCount !== 'number' || result.matchedCount === 0) {
        throw new Error('Không tìm thấy khóa học cần cập nhật.');
    }
    return result;
};

export const createManagerClass = async (payload: CreateManagerClassroom) =>
    dataOf(await axios.post<unknown, IBackendRes<IClassroomWithDetails>>('/classrooms', payload));

export const updateManagerClassroom = async (payload: UpdateManagerClassroom) => {
    const response = await axios.patch<
        unknown,
        IBackendRes<{ matchedCount?: number }>
    >(`/classrooms/${payload._id}`, payload);
    const result = dataOf(response);
    if (typeof result.matchedCount !== 'number' || result.matchedCount === 0) {
        throw new Error('Không tìm thấy lớp học cần cập nhật.');
    }
    return result;
};

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
        allPages<ManagerPerson>('/users'),
    ]);
    return {
        courses: courses.filter((course) => course._id && course.status?.toUpperCase() !== 'INACTIVE'),
        teachers: users.filter((user) => {
            const role = normalizeManagerRole(user.role?.name);
            return (role === 'TEACHER' || role === 'GIANG VIEN') &&
                user.status?.toUpperCase() === 'ACTIVE';
        }),
    };
};

export const managerErrorMessage = (error: unknown, fallback = 'Không thể tải dữ liệu. Vui lòng thử lại.') => {
    const message = (error as { message?: unknown } | null)?.message;
    return Array.isArray(message) ? message.join('\n') : typeof message === 'string' ? message : fallback;
};
