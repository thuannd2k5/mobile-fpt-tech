export interface IBackendRes<T> {
    error?: string | string[];
    message: string;
    statusCode: number | string;
    data?: T;
}

export interface IModelPaginate<T> {
    meta: {
        current: number;
        pageSize: number;
        pages: number;
        total: number;
    };
    result: T[];
}

export interface IAccount {
    access_token: string;
    user: {
        _id: string;
        email: string;
        name: string;
        phone?: string;
        age?: number;
        gender?: string;
        address?: string;
        role: {
            _id: string;
            name: string;
        };
        permissions: {
            _id: string;
            name: string;
            path: string;
            method: string;
            module: string;
        }[];
    };
}

export interface IGetAccount extends Omit<IAccount, 'access_token'> {}

export interface ICourse {
    _id?: string;
    name: string;
    description?: string;
    level?: string;
    duration?: string;
    price?: string | number;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IClassroom {
    _id?: string;
    course_id: string;
    teacher_id: string | null;
    room?: string;
    class_name?: string;
    max_student?: string | number;
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    status?: 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED' | string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IUserSummary {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
}

export interface IClassroomWithDetails extends Omit<IClassroom, 'course_id' | 'teacher_id'> {
    course_id?: Pick<ICourse, '_id' | 'name' | 'description' | 'level' | 'duration' | 'price'>;
    teacher_id?: IUserSummary;
}

export interface IEnrollment {
    _id?: string;
    student_id: string;
    class_id: string;
    register_date?: string;
    status?: 'STUDYING' | 'COMPLETED' | 'CANCELLED' | 'WAITING_PAYMENT' | string;
    createdBy?: { _id?: string; email?: string } | string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IPortalEnrollment extends Omit<IEnrollment, 'student_id' | 'class_id'> {
    student_id?: IUserSummary;
    class_id?: IClassroomWithDetails;
    createdBy?: { _id?: string; email?: string } | string;
}

export interface IInvoice {
    _id?: string;
    enrollment_id: string;
    amount: number;
    discount_amount?: number;
    final_amount?: number;
    status?: 'PAID' | 'PENDING' | 'CANCELLED' | string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IPortalInvoice extends Omit<IInvoice, 'enrollment_id'> {
    enrollment_id?: IPortalEnrollment;
}

export interface IPayment {
    _id?: string;
    invoice_id: string;
    payment_method?: string;
    payment_date?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IPortalPayment extends Omit<IPayment, 'invoice_id'> {
    invoice_id?: IPortalInvoice;
}

export interface ILead {
    _id?: string;
    full_name?: string;
    name?: string;
    email?: string;
    phone?: string;
    course_name?: string;
    consultant_id?: string | IUserSummary;
    status?: 'NEW' | 'CONTACTED' | 'ENROLLED' | 'CANCELLED' | string;
    note?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IConversation {
    _id?: string;
    participants?: (string | IUserSummary)[];
    lastMessage?: string;
    title?: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
}

export interface IMessage {
    _id?: string;
    conversation_id?: string;
    sender_id?: string | IUserSummary;
    content: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
}

export interface INotification {
    _id?: string;
    title?: string;
    message?: string;
    recipient_id?: string;
    isRead?: boolean;
    createdAt?: string;
    [key: string]: unknown;
}

export interface IUser {
    _id?: string;
    name: string;
    email: string;
    password?: string;
    age: number;
    gender: string;
    address: string;
    phone?: string;
    role?: {
        _id: string;
        name: string;
    };
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IPermission {
    _id?: string;
    name?: string;
    path?: string;
    method?: string;
    module?: string;
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IRole {
    _id?: string;
    name: string;
    description: string;
    isActive: boolean;
    permissions: IPermission[] | string[];
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}
