const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(client) {
    const filename = path.resolve(__dirname, '../src/api/manager.ts');
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const loaded = new Module(filename, module);
    loaded.filename = filename;
    loaded.paths = Module._nodeModulePaths(path.dirname(filename));
    loaded.require = (id) => id === './axios-customize' ? { __esModule: true, default: client } : Module.prototype.require.call(loaded, id);
    loaded._compile(compiled.outputText, filename);
    return loaded.exports;
}

test('class selectors include later server pages and only active teachers and available courses', async () => {
    const calls = [];
    const api = load({ get: async (url) => {
        calls.push(url);
        const [resource, query] = url.split('?');
        const page = new URLSearchParams(query).get('current');
        const result = resource === '/courses'
            ? page === '1' ? [{ _id: 'inactive', name: 'Closed', status: 'INACTIVE' }] : [{ _id: 'course', name: 'React', status: 'ACTIVE' }]
            : page === '1' ? [{ _id: 'pending', role: { name: 'STUDENT' }, status: 'PENDING' }]
                : [{ _id: 'teacher', role: { name: 'TEACHER' }, status: 'ACTIVE' }, { _id: 'rejected', role: { name: 'TEACHER' }, status: 'REJECTED' }];
        return { statusCode: 200, data: { meta: { pages: 2 }, result } };
    } });
    const options = await api.fetchManagerClassOptions();
    assert.deepEqual(options.courses.map((course) => course._id), ['course']);
    assert.deepEqual(options.teachers.map((teacher) => teacher._id), ['teacher']);
    assert.equal(calls.length, 4);
});

test('teacher decisions use supported PATCH endpoints without an unsupported reason body', async () => {
    const calls = [];
    const api = load({ patch: async (...args) => { calls.push(args); return { statusCode: 200, data: { _id: 'teacher' } }; } });
    await api.reviewManagerTeacher('teacher', 'approve');
    await api.reviewManagerTeacher('teacher', 'reject');
    assert.deepEqual(calls, [['/users/approve-teacher/teacher'], ['/users/reject-teacher/teacher']]);
});

test('class filtering preserves backend pagination and OPEN filter', async () => {
    let requested;
    const api = load({ get: async (url) => { requested = url; return { statusCode: 200, data: { meta: { total: 42 }, result: [] } }; } });
    const data = await api.fetchManagerClasses(2, 'OPEN');
    const params = new URLSearchParams(requested.split('?')[1]);
    assert.equal(params.get('current'), '2');
    assert.equal(params.get('status'), 'OPEN');
    assert.equal(data.meta.total, 42);
});

test('failed and empty backend envelopes do not report mutation success', async () => {
    const api = load({ post: async () => ({ statusCode: 403, message: 'Forbidden' }) });
    await assert.rejects(api.createManagerClass({}), /Forbidden/);
    const missing = load({ patch: async () => ({ statusCode: 200, message: 'Missing data' }) });
    await assert.rejects(missing.reviewManagerTeacher('teacher', 'approve'), /Missing data/);
});

test('manager course and classroom updates send ids and preserve status changes', async () => {
    const calls = [];
    const api = load({
        patch: async (...args) => {
            calls.push(args);
            return { statusCode: 200, data: { matchedCount: 1 } };
        },
    });
    await api.updateManagerCourse('course-1', { status: 'INACTIVE' });
    await api.updateManagerClassroom({
        _id: 'class-1',
        course_id: 'course-1',
        teacher_id: 'teacher-1',
        class_name: 'React 01',
        room: 'A101',
        max_student: '20',
        start_time: '08:00',
        end_time: '10:00',
        status: 'CANCELLED',
    });
    assert.deepEqual(calls, [
        ['/courses/course-1', { status: 'INACTIVE', _id: 'course-1' }],
        ['/classrooms/class-1', {
            _id: 'class-1',
            course_id: 'course-1',
            teacher_id: 'teacher-1',
            class_name: 'React 01',
            room: 'A101',
            max_student: '20',
            start_time: '08:00',
            end_time: '10:00',
            status: 'CANCELLED',
        }],
    ]);
});

test('manager user directories filter by populated role and only update matching accounts', async () => {
    const api = load({
        get: async () => ({
            statusCode: 200,
            data: {
                meta: { pages: 1 },
                result: [
                    { _id: 'student', role: { name: 'STUDENT' } },
                    { _id: 'teacher', role: { name: 'TEACHER' } },
                ],
            },
        }),
        patch: async () => ({
            statusCode: 200,
            data: { matchedCount: 0 },
        }),
    });
    const students = await api.fetchManagerPeople('STUDENT');
    assert.deepEqual(students.map((person) => person._id), ['student']);
    await assert.rejects(
        api.updateManagerPerson(
            { _id: 'student', name: 'Student', role: { _id: 'student-role', name: 'STUDENT' } },
            { status: 'INACTIVE' },
        ),
        /Không tìm thấy tài khoản/,
    );
});
