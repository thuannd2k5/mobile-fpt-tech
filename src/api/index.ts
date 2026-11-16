import axios from './axios-customize';
import {
    IAccount,
    IBackendRes,
    IClassroom,
    IClassroomWithDetails,
    IConversation,
    ICourse,
    IEnrollment,
    IGetAccount,
    IInvoice,
    ILead,
    IMessage,
    IModelPaginate,
    IPayment,
    IPortalEnrollment,
    IPortalInvoice,
    IPortalPayment,
    IUser,
} from '@/types/backend';
import { getUserId } from '@/utils/storage';

const list = <T>(resource: string, query = '') =>
    axios.get<any, IBackendRes<IModelPaginate<T>>>(`/${resource}${query ? `?${query}` : ''}`);

const findById = <T>(resource: string, id: string) =>
    axios.get<any, IBackendRes<T>>(`/${resource}/${id}`);

const create = <T>(resource: string, payload: unknown) =>
    axios.post<any, IBackendRes<T>>(`/${resource}`, payload);

const update = <T>(resource: string, id: string, payload: unknown) =>
    axios.patch<any, IBackendRes<T>>(`/${resource}/${id}`, payload);

const remove = <T>(resource: string, id: string) =>
    axios.delete<any, IBackendRes<T>>(`/${resource}/${id}`);

// --- AUTH APIS ---
export const callLogin = (username: string, password: string) =>
    axios.post<any, IBackendRes<IAccount>>('/auth/login', { username, password });

export const callRegister = (
    name: string,
    email: string,
    password: string,
    age: number,
    gender: string,
    address: string
) =>
    axios.post<any, IBackendRes<IUser>>('/auth/register', {
        name,
        email,
        password,
        age,
        gender,
        address,
    });

export const callFetchAccount = () =>
    axios.get<any, IBackendRes<IGetAccount>>('/auth/account');

export const callRefreshToken = () =>
    axios.get<any, IBackendRes<{ access_token: string }>>('/auth/refresh');

export const callLogout = () =>
    axios.post<any, IBackendRes<string>>('/auth/logout');

export const callUpdateMyProfile = async (value: {
    name?: string;
    phone?: string;
    address?: string;
    age?: number;
    gender?: string;
    currentPassword?: string;
    newPassword?: string;
}) => {
    const id = await getUserId();
    if (!id) throw new Error('Không xác định được tài khoản người dùng.');
    return update<IUser>('users', id, value);
};

// --- COURSES APIS ---
export const callFetchCourse = (query = '') => list<ICourse>('courses', query);
export const callFetchCourseById = (id: string) => findById<ICourse>('courses', id);

// --- CLASSROOMS APIS ---
export const callFetchClassroom = (query = '') => list<IClassroom>('classrooms', query);
export const callFetchClassroomById = (id: string) => findById<IClassroom>('classrooms', id);
export const callFetchOpenClassroomsForCourse = (courseId: string) =>
    axios.get<any, IBackendRes<IClassroom[]>>(`/classrooms/course/${courseId}/open`);
export const callFetchMyTeachingClassrooms = async (teacherId?: string) => {
    const id = teacherId || (await getUserId());
    if (id) {
        return list<IClassroomWithDetails>(
            'classrooms',
            `teacher_id=${id}&populate=course_id,teacher_id&pageSize=1000`
        );
    }
    return list<IClassroomWithDetails>('classrooms', 'populate=course_id,teacher_id&pageSize=1000');
};

// --- ENROLLMENTS APIS ---
export const callFetchMyEnrollments = () =>
    axios.get<any, IBackendRes<IPortalEnrollment[]>>('/enrollments/me');
export const callRegisterForCourse = (value: { student_id: string; class_id: string }) =>
    axios.post<any, IBackendRes<IEnrollment>>('/enrollments/register', value);
export const callCancelMyEnrollment = (id: string) =>
    axios.patch<any, IBackendRes<{ matchedCount: number; modifiedCount: number }>>(
        `/enrollments/me/${id}/cancel`
    );
export const callFetchMyStudents = (classId?: string) => {
    const query = classId
        ? `class_id=${classId}&populate=student_id,class_id&pageSize=1000`
        : `populate=student_id,class_id&pageSize=1000`;
    return list<IPortalEnrollment>('enrollments', query);
};

// --- INVOICES & PAYMENTS APIS ---
export const callFetchMyInvoices = () =>
    axios.get<any, IBackendRes<IPortalInvoice[]>>('/invoices/me');
export const callFetchInvoiceById = (id: string) => findById<IInvoice>('invoices', id);
export const callFetchMyPayments = () =>
    axios.get<any, IBackendRes<IPortalPayment[]>>('/payments/me');

// --- LEADS APIS (CONSULTANT) ---
export const callCreateLead = (value: {
    full_name: string;
    phone: string;
    email: string;
    course_name: string;
    note?: string;
}) => axios.post<any, IBackendRes<ILead>>('/leads', value);
export const callFetchLeadsForConsultants = () =>
    axios.get<any, IBackendRes<ILead[]>>('/leads/consultant-inbox');
export const callUpdateLead = (id: string, value: Partial<ILead>) =>
    update<ILead>('leads', id, value);

// --- CONVERSATIONS & MESSAGES APIS ---
export const callFetchMyConversations = () =>
    axios.get<any, IBackendRes<IConversation[]>>('/conversations/my-conversations');
export const callFetchMessage = (query = '') => list<IMessage>('messages', query);
export const callCreateMessage = (value: { conversation_id: string; content: string }) =>
    create<IMessage>('messages', value);
