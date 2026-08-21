/* ============================================================
 * STUDENT CARD SYSTEM
 * ADMIN DASHBOARD
 *
 * VERSION: 1.0 - CLEAN REBUILD
 *
 * ใช้กับ:
 *   admin-dashboard.html
 *   css/admin-dashboard.css
 *
 * ใช้กับ Backend code.gs ปัจจุบัน
 *
 * IMPORTANT:
 * ------------------------------------------------------------
 * Dashboard ไม่เรียก adminGetDashboard
 * เพราะ code.gs ปัจจุบันไม่ได้เปิด action นี้ใน doPost
 *
 * Staff เปิด/ปิดการใช้งาน:
 * ------------------------------------------------------------
 * ใช้ adminUpdateStaff
 * เพราะ code.gs ปัจจุบันยังไม่มี adminToggleStaff
 * ============================================================ */

"use strict";


/* ============================================================
 * GLOBAL STATE
 * ============================================================ */

let studentsCache = [];
let staffCache = [];
let resetRequestsCache = [];

let currentStudent = null;
let currentStaff = null;
let currentResetRequest = null;

let studentModalMode = "edit";
let staffModalMode = "add";

let actionBusy = false;

let messageTimer = null;


/* ============================================================
 * PAGE META
 * ============================================================ */

const SECTION_META = {

    dashboard: {

        title:
            "Dashboard",

        subtitle:
            "ภาพรวมระบบ Student Card System"

    },

    students: {

        title:
            "จัดการนักศึกษา",

        subtitle:
            "ค้นหา ดู แก้ไข และรีเซ็ตรหัสผ่านนักศึกษา"

    },

    "add-student": {

        title:
            "เพิ่มนักศึกษา",

        subtitle:
            "เพิ่มข้อมูลนักศึกษาใหม่เข้าสู่ระบบ"

    },

    staff: {

        title:
            "จัดการ Staff",

        subtitle:
            "เพิ่ม แก้ไข เปิด/ปิด และลบ Staff"

    },

    "reset-requests": {

        title:
            "Password Reset Requests",

        subtitle:
            "จัดการคำขอรีเซ็ตรหัสผ่านจากนักศึกษา"

    }

};


/* ============================================================
 * START
 * ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "ADMIN DASHBOARD JS READY"
        );

        initializeAdminDashboard();

    }
);


/* ============================================================
 * INITIALIZE
 * ============================================================ */

async function initializeAdminDashboard() {

    try {

        bindNavigation();

        bindButtons();

        bindForms();

        bindTableActions();

        bindSearch();

        bindModalBackdrops();

        loadAdminProfile();

        applyRoleVisibility();

        const token =
            getAdminToken();


        if (!token) {

            console.warn(
                "ADMIN TOKEN NOT FOUND"
            );

            redirectToLogin();

            return;

        }


        setConnection(
            "● กำลังตรวจสอบ Session...",
            true
        );


        const sessionResult =
            await apiRequest({

                action:
                    "adminSession",

                token:
                    token

            });


        if (
            !sessionResult ||
            !sessionResult.success
        ) {

            if (
                isSessionExpired(
                    sessionResult
                )
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                sessionResult &&
                sessionResult.message
                    ? sessionResult.message
                    : "ไม่สามารถตรวจสอบ Session ได้"
            );

        }


        saveAdminProfile(
            sessionResult.admin
        );


        loadAdminProfile();

        applyRoleVisibility();


        await loadInitialData();


    } catch (error) {

        console.error(
            "INITIALIZE ADMIN DASHBOARD ERROR",
            error
        );


        setConnection(
            "● ระบบเชื่อมต่อมีปัญหา",
            false
        );


        showMessage(
            error.message ||
            "ไม่สามารถเริ่มระบบ Admin ได้",
            "error"
        );

    }

}


/* ============================================================
 * SESSION
 * ============================================================ */

function getAdminToken() {

    try {

        if (
            typeof CONFIG !== "undefined" &&
            CONFIG.ADMIN_SESSION_KEY
        ) {

            const configuredToken =
                sessionStorage.getItem(
                    CONFIG.ADMIN_SESSION_KEY
                );


            if (configuredToken) {

                return configuredToken;

            }

        }

    } catch (error) {

        console.warn(
            "READ CONFIG ADMIN TOKEN ERROR",
            error
        );

    }


    const fallbackKeys = [

        "adminSessionId",
        "admin_session",
        "adminToken"

    ];


    for (
        const key of fallbackKeys
    ) {

        try {

            const value =
                sessionStorage.getItem(
                    key
                );


            if (value) {

                return value;

            }

        } catch (error) {

            console.warn(
                "READ TOKEN ERROR",
                key,
                error
            );

        }

    }


    return "";

}


function isSessionExpired(
    result
) {

    if (!result) {

        return false;

    }


    const code =
        String(
            result.code || ""
        ).toUpperCase();


    const message =
        String(
            result.message || ""
        ).toLowerCase();


    return (

        code.includes(
            "SESSION"
        )

        ||

        code.includes(
            "EXPIRED"
        )

        ||

        message.includes(
            "session"
        )

        ||

        message.includes(
            "หมดอายุ"
        )

    );

}


function handleSessionExpired() {

    clearAdminSession();


    showMessage(
        "Session ของ Admin หมดอายุ กรุณาเข้าสู่ระบบใหม่",
        "error"
    );


    setConnection(
        "● Session หมดอายุ",
        false
    );


    window.setTimeout(
        function () {

            redirectToLogin();

        },
        900
    );

}


function redirectToLogin() {

    window.location.replace(
        "admin-login.html"
    );

}


function clearAdminSession() {

    try {

        if (
            typeof CONFIG !== "undefined" &&
            CONFIG.ADMIN_SESSION_KEY
        ) {

            sessionStorage.removeItem(
                CONFIG.ADMIN_SESSION_KEY
            );

        }


        if (
            typeof CONFIG !== "undefined" &&
            CONFIG.ADMIN_KEY
        ) {

            sessionStorage.removeItem(
                CONFIG.ADMIN_KEY
            );

        }

    } catch (error) {

        console.warn(
            "CLEAR CONFIG SESSION ERROR",
            error
        );

    }


    const keys = [

        "adminSessionId",
        "admin_session",
        "adminToken",
        "admin"

    ];


    keys.forEach(
        function (key) {

            try {

                sessionStorage.removeItem(
                    key
                );

            } catch (error) {

                console.warn(
                    "CLEAR SESSION KEY ERROR",
                    key,
                    error
                );

            }

        }
    );

}


function saveAdminProfile(
    admin
) {

    if (
        !admin ||
        typeof admin !== "object"
    ) {

        return;

    }


    try {

        if (
            typeof CONFIG !== "undefined" &&
            CONFIG.ADMIN_KEY
        ) {

            sessionStorage.setItem(

                CONFIG.ADMIN_KEY,

                JSON.stringify(
                    admin
                )

            );

        }

    } catch (error) {

        console.warn(
            "SAVE CONFIG ADMIN PROFILE ERROR",
            error
        );

    }


    try {

        sessionStorage.setItem(
            "admin",
            JSON.stringify(
                admin
            )
        );

    } catch (error) {

        console.warn(
            "SAVE ADMIN PROFILE ERROR",
            error
        );

    }

}


/* ============================================================
 * API
 * ============================================================ */

async function apiRequest(
    data
) {

    if (
        typeof CONFIG === "undefined"
    ) {

        throw new Error(
            "ไม่พบ config.js"
        );

    }


    if (
        !CONFIG.API_URL
    ) {

        throw new Error(
            "ไม่พบ CONFIG.API_URL"
        );

    }


    const payload =
        Object.assign(
            {},
            data || {}
        );


    if (
        !payload.token
    ) {

        payload.token =
            getAdminToken();

    }


    if (
        !payload.token
    ) {

        throw new Error(
            "ไม่พบ Admin Session"
        );

    }


    console.log(
        "ADMIN API REQUEST:",
        payload.action,
        payload
    );


    let response;


    try {

        response =
            await fetch(
                CONFIG.API_URL,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "text/plain;charset=utf-8"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );

    } catch (error) {

        console.error(
            "FETCH ERROR",
            error
        );


        throw new Error(
            "ไม่สามารถเชื่อมต่อ Google Apps Script ได้"
        );

    }


    if (
        !response.ok
    ) {

        throw new Error(
            "HTTP " +
            response.status
        );

    }


    const text =
        await response.text();


    let result;


    try {

        result =
            JSON.parse(
                text
            );

    } catch (error) {

        console.error(
            "INVALID JSON RESPONSE:",
            text
        );


        throw new Error(
            "API ส่งข้อมูลกลับมาไม่ใช่ JSON"
        );

    }


    console.log(
        "ADMIN API RESPONSE:",
        payload.action,
        result
    );


    if (
        result &&
        !result.success &&
        isSessionExpired(
            result
        )
    ) {

        handleSessionExpired();

    }


    return result;

}


/* ============================================================
 * INITIAL DATA
 * ============================================================ */

async function loadInitialData() {

    setConnection(
        "● กำลังโหลดข้อมูล...",
        true
    );


    const tasks = [

        loadStudents(
            false
        ),

        loadStaff(
            false
        ),

        loadResetRequests(
            false
        )

    ];


    const results =
        await Promise.allSettled(
            tasks
        );


    const failed =
        results.filter(
            function (item) {

                return item.status ===
                    "rejected";

            }
        );


    updateDashboardStats();


    if (
        failed.length === 0
    ) {

        setConnection(
            "● ระบบพร้อมใช้งาน",
            true
        );


        switchSection(
            "dashboard",
            false
        );


        return;

    }


    setConnection(
        "● โหลดข้อมูลบางส่วนไม่สำเร็จ",
        false
    );


    const firstError =
        failed[0].reason;


    showMessage(
        firstError &&
        firstError.message

            ? firstError.message

            : "โหลดข้อมูลบางส่วนไม่สำเร็จ",

        "warning"
    );


    switchSection(
        "dashboard",
        false
    );

}


/* ============================================================
 * LOAD STUDENTS
 * ============================================================ */

async function loadStudents(
    showLoading = true
) {

    ensureSession();


    if (
        showLoading
    ) {

        renderLoading(
            "studentsTableBody",
            9
        );

    }


    try {

        const result =
            await apiRequest({

                action:
                    "adminGetStudents"

            });


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result &&
                result.message

                    ? result.message

                    : "โหลดข้อมูลนักศึกษาไม่สำเร็จ"
            );

        }


        studentsCache =
            Array.isArray(
                result.students
            )

                ? result.students

                : [];


        renderStudents();

        updateDashboardStats();


        return result;

    } catch (error) {

        console.error(
            "LOAD STUDENTS ERROR",
            error
        );


        renderError(
            "studentsTableBody",
            9,
            error.message ||
            "โหลดข้อมูลนักศึกษาไม่สำเร็จ"
        );


        throw error;

    }

}


/* ============================================================
 * RENDER STUDENTS
 * ============================================================ */

function renderStudents() {

    const tbody =
        getElement(
            "studentsTableBody"
        );


    if (!tbody) {

        return;

    }


    const search =
        getValue(
            "studentSearch"
        ).toLowerCase();


    let list =
        studentsCache.slice();


    if (
        search
    ) {

        list =
            list.filter(
                function (student) {

                    const text = [

                        student.student_id,

                        student.prefix_th,

                        student.firstname_th,

                        student.lastname_th,

                        student.firstname_en,

                        student.lastname_en,

                        student.department,

                        student.phone,

                        student.status

                    ]
                    .join(" ")
                    .toLowerCase();


                    return text.includes(
                        search
                    );

                }
            );

    }


    if (
        list.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="empty-cell"
                >
                    ไม่พบข้อมูลนักศึกษา
                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        list
            .map(
                createStudentRow
            )
            .join("");

}


function createStudentRow(
    student
) {

    const studentId =
        safeString(
            student.student_id
        );


    const fullName =
        [

            student.prefix_th,

            student.firstname_th,

            student.lastname_th

        ]
        .filter(Boolean)
        .join(" ");


    const englishName =
        [

            student.firstname_en,

            student.lastname_en

        ]
        .filter(Boolean)
        .join(" ");


    const status =
        safeString(
            student.status ||
            "นักศึกษาปกติ"
        );


    return `

        <tr>

            <td>
                <strong>
                    ${escapeHtml(studentId || "-")}
                </strong>
            </td>

            <td>
                ${escapeHtml(
                    fullName || "-"
                )}
            </td>

            <td>
                ${escapeHtml(
                    englishName || "-"
                )}
            </td>

            <td>
                ${escapeHtml(
                    student.department || "-"
                )}
            </td>

            <td>
                ${escapeHtml(
                    student.phone || "-"
                )}
            </td>

            <td>

                <span
                    class="status-badge ${getStatusClass(status)}"
                >
                    ${escapeHtml(status)}
                </span>

            </td>

            <td>
                ${escapeHtml(
                    formatDisplayDate(
                        student.issue_date
                    )
                )}
            </td>

            <td>
                ${escapeHtml(
                    formatDisplayDate(
                        student.expire_date
                    )
                )}
            </td>

            <td>

                <div class="table-actions">

                    <button
                        type="button"
                        class="secondary-btn table-btn"
                        data-action="edit-student"
                        data-student-id="${escapeAttribute(studentId)}"
                    >
                        ✏️ แก้ไข
                    </button>

                    <button
                        type="button"
                        class="secondary-btn table-btn"
                        data-action="reset-student"
                        data-student-id="${escapeAttribute(studentId)}"
                    >
                        🔑 รีเซ็ต
                    </button>

                </div>

            </td>

        </tr>

    `;

}


/* ============================================================
 * ADD STUDENT FORM
 * ============================================================ */

async function handleAddStudent(
    event
) {

    event.preventDefault();


    if (
        actionBusy
    ) {

        return;

    }


    ensureSession();


    const data = {

        action:
            "adminAddStudent",

        student_id:
            getValue(
                "studentId"
            ),

        password:
            getRawValue(
                "studentPassword"
            ),

        prefix_th:
            getValue(
                "studentPrefix"
            ),

        firstname_th:
            getValue(
                "studentFirstnameTh"
            ),

        lastname_th:
            getValue(
                "studentLastnameTh"
            ),

        firstname_en:
            getValue(
                "studentFirstnameEn"
            ),

        lastname_en:
            getValue(
                "studentLastnameEn"
            ),

        status:
            getValue(
                "studentStatus"
            ) ||
            "นักศึกษาปกติ",

        photo_url:
            getValue(
                "studentPhoto"
            ),

        issue_date:
            getValue(
                "studentIssueDate"
            ),

        expire_date:
            getValue(
                "studentExpireDate"
            ),

        department:
            getValue(
                "studentDepartment"
            ),

        phone:
            getValue(
                "studentPhone"
            )

    };


    if (
        !data.student_id
    ) {

        showMessage(
            "กรุณากรอกรหัสนักศึกษา",
            "error"
        );

        focusElement(
            "studentId"
        );

        return;

    }


    if (
        !data.password
    ) {

        showMessage(
            "กรุณากรอกรหัสผ่านเริ่มต้น",
            "error"
        );

        focusElement(
            "studentPassword"
        );

        return;

    }


    if (
        data.password.length < 4
    ) {

        showMessage(
            "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร",
            "error"
        );

        focusElement(
            "studentPassword"
        );

        return;

    }


    if (
        !data.firstname_th
    ) {

        showMessage(
            "กรุณากรอกชื่อ",
            "error"
        );

        focusElement(
            "studentFirstnameTh"
        );

        return;

    }


    if (
        !data.lastname_th
    ) {

        showMessage(
            "กรุณากรอกนามสกุล",
            "error"
        );

        focusElement(
            "studentLastnameTh"
        );

        return;

    }


    const button =
        getElement(
            "saveStudentBtn"
        );


    setActionBusy(
        true
    );


    setButtonLoading(
        button,
        true,
        "กำลังบันทึก..."
    );


    try {

        const result =
            await apiRequest(
                data
            );


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result &&
                result.message

                    ? result.message

                    : "เพิ่มนักศึกษาไม่สำเร็จ"
            );

        }


        showMessage(
            result.message ||
            "เพิ่มนักศึกษาสำเร็จ",
            "success"
        );


        resetStudentAddForm();


        await loadStudents(
            false
        );


        updateDashboardStats();


        switchSection(
            "students"
        );


    } catch (error) {

        console.error(
            "ADD STUDENT ERROR",
            error
        );


        showMessage(
            error.message ||
            "เพิ่มนักศึกษาไม่สำเร็จ",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "💾 บันทึกนักศึกษา"
        );


        setActionBusy(
            false
        );

    }

}


/* ============================================================
 * STUDENT MODAL
 * ============================================================ */

function openStudentModal(
    student
) {

    const modal =
        getElement(
            "studentModal"
        );


    if (!modal) {

        showMessage(
            "ไม่พบหน้าต่างข้อมูลนักศึกษา",
            "error"
        );

        return;

    }


    currentStudent =
        student || null;


    studentModalMode =
        "edit";


    setText(
        "studentModalTitle",
        "แก้ไขข้อมูลนักศึกษา"
    );


    clearStudentModal();


    if (
        student
    ) {

        setValue(
            "modalStudentId",
            student.student_id
        );


        setValue(
            "modalStudentPrefix",
            student.prefix_th
        );


        setValue(
            "modalStudentFirstnameTh",
            student.firstname_th
        );


        setValue(
            "modalStudentLastnameTh",
            student.lastname_th
        );


        setValue(
            "modalStudentFirstnameEn",
            student.firstname_en
        );


        setValue(
            "modalStudentLastnameEn",
            student.lastname_en
        );


        setValue(
            "modalStudentDepartment",
            student.department
        );


        setValue(
            "modalStudentPhone",
            student.phone
        );


        setValue(
            "modalStudentStatus",
            student.status ||
            "นักศึกษาปกติ"
        );


        setValue(
            "modalStudentIssueDate",
            normalizeDateForInput(
                student.issue_date
            )
        );


        setValue(
            "modalStudentExpireDate",
            normalizeDateForInput(
                student.expire_date
            )
        );


        setValue(
            "modalStudentPhoto",
            student.photo_url
        );


        setValue(
            "modalStudentPassword",
            ""
        );

    }


    showModal(
        "studentModal"
    );

}


/* ============================================================
 * SAVE STUDENT MODAL
 * ============================================================ */

async function handleStudentModalSubmit(
    event
) {

    event.preventDefault();


    if (
        actionBusy
    ) {

        return;

    }


    ensureSession();


    const studentId =
        getValue(
            "modalStudentId"
        );


    const firstname =
        getValue(
            "modalStudentFirstnameTh"
        );


    const lastname =
        getValue(
            "modalStudentLastnameTh"
        );


    if (
        !studentId
    ) {

        showMessage(
            "ไม่พบรหัสนักศึกษา",
            "error"
        );

        return;

    }


    if (
        !firstname
    ) {

        showMessage(
            "กรุณากรอกชื่อ",
            "error"
        );

        return;

    }


    if (
        !lastname
    ) {

        showMessage(
            "กรุณากรอกนามสกุล",
            "error"
        );

        return;

    }


    const password =
        getRawValue(
            "modalStudentPassword"
        );


    const data = {

        action:
            "adminUpdateStudent",

        student_id:
            studentId,

        prefix_th:
            getValue(
                "modalStudentPrefix"
            ),

        firstname_th:
            firstname,

        lastname_th:
            lastname,

        firstname_en:
            getValue(
                "modalStudentFirstnameEn"
            ),

        lastname_en:
            getValue(
                "modalStudentLastnameEn"
            ),

        status:
            getValue(
                "modalStudentStatus"
            ) ||
            "นักศึกษาปกติ",

        photo_url:
            getValue(
                "modalStudentPhoto"
            ),

        issue_date:
            getValue(
                "modalStudentIssueDate"
            ),

        expire_date:
            getValue(
                "modalStudentExpireDate"
            ),

        department:
            getValue(
                "modalStudentDepartment"
            ),

        phone:
            getValue(
                "modalStudentPhone"
            )

    };


    if (
        password
    ) {

        if (
            password.length < 4
        ) {

            showMessage(
                "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร",
                "error"
            );

            return;

        }


        data.password =
            password;

    }


    const button =
        getElement(
            "saveStudentModalBtn"
        );


    setActionBusy(
        true
    );


    setButtonLoading(
        button,
        true,
        "กำลังบันทึก..."
    );


    try {

        const result =
            await apiRequest(
                data
            );


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result &&
                result.message

                    ? result.message

                    : "แก้ไขข้อมูลนักศึกษาไม่สำเร็จ"
            );

        }


        showMessage(
            result.message ||
            "บันทึกข้อมูลนักศึกษาสำเร็จ",
            "success"
        );


        closeModal(
            "studentModal"
        );


        await loadStudents(
            false
        );


        updateDashboardStats();


    } catch (error) {

        console.error(
            "UPDATE STUDENT ERROR",
            error
        );


        showMessage(
            error.message ||
            "บันทึกข้อมูลนักศึกษาไม่สำเร็จ",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "💾 บันทึก"
        );


        setActionBusy(
            false
        );

    }

}


/* ============================================================
 * DIRECT STUDENT RESET
 * ============================================================ */

async function directResetStudentPassword(
    studentId
) {

    ensureSession();


    if (
        !studentId
    ) {

        showMessage(
            "ไม่พบรหัสนักศึกษา",
            "error"
        );

        return;

    }


    const student =
        findStudent(
            studentId
        );


    const displayName =
        student

            ? [
                student.firstname_th,
                student.lastname_th
              ]
              .filter(Boolean)
              .join(" ")

            : "";


    const newPassword =
        window.prompt(

            "รีเซ็ตรหัสผ่านนักศึกษา\n\n" +

            "รหัสนักศึกษา: " +
            studentId +

            (
                displayName
                    ? "\nชื่อ: " +
                      displayName
                    : ""
            ) +

            "\n\n" +

            "กรอกรหัสผ่านใหม่\n" +

            "เว้นว่างเพื่อใช้ 123456"

        );


    if (
        newPassword === null
    ) {

        return;

    }


    const password =
        newPassword ||
        "123456";


    if (
        password.length < 4
    ) {

        showMessage(
            "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(

            "ยืนยันรีเซ็ตรหัสผ่าน?\n\n" +

            "รหัสนักศึกษา: " +
            studentId +

            "\nรหัสผ่านใหม่: " +
            password

        );


    if (
        !confirmed
    ) {

        return;

    }


    setActionBusy(
        true
    );


    try {

        setConnection(
            "● กำลังรีเซ็ตรหัสผ่าน...",
            true
        );


        const result =
            await apiRequest({

                action:
                    "adminDirectResetStudentPassword",

                student_id:
                    studentId,

                newPassword:
                    password,

                note:
                    "รีเซ็ตรหัสผ่านจาก Admin Dashboard"

            });


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result &&
                result.message

                    ? result.message

                    : "รีเซ็ตรหัสผ่านไม่สำเร็จ"
            );

        }


        window.alert(

            "รีเซ็ตรหัสผ่านสำเร็จ\n\n" +

            "รหัสนักศึกษา: " +
            studentId +

            "\nรหัสผ่านใหม่: " +
            (
                result.password ||
                password
            )

        );


        showMessage(
            "รีเซ็ตรหัสผ่านนักศึกษาสำเร็จ",
            "success"
        );


        await loadResetRequests(
            false
        );


    } catch (error) {

        console.error(
            "DIRECT RESET ERROR",
            error
        );


        showMessage(
            error.message ||
            "รีเซ็ตรหัสผ่านไม่สำเร็จ",
            "error"
        );

    } finally {

        setConnection(
            "● ระบบพร้อมใช้งาน",
            true
        );


        setActionBusy(
            false
        );

    }

}


/* ============================================================
 * STAFF
 * ============================================================ */

async function loadStaff(
    showLoading = true
) {

    ensureSession();


    if (
        showLoading
    ) {

        renderLoading(
            "staffTableBody",
            6
        );

    }


    try {

        const result =
            await apiRequest({

                action:
                    "adminGetStaff"

            });


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result &&
                result.message

                    ? result.message

                    : "โหลดข้อมูล Staff ไม่สำเร็จ"
            );

        }


        staffCache =
            Array.isArray(
                result.staff
            )

                ? result.staff

                : [];


        renderStaff();

        updateDashboardStats();


        return result;

    } catch (error) {

        console.error(
            "LOAD STAFF ERROR",
            error
        );


        renderError(
            "staffTableBody",
            6,
            error.message ||
            "โหลดข้อมูล Staff ไม่สำเร็จ"
        );


        throw error;

    }

}


function renderStaff() {

    const tbody =
        getElement(
            "staffTableBody"
        );


    if (!tbody) {

        return;

    }


    const search =
        getValue(
            "staffSearch"
        ).toLowerCase();


    let list =
        staffCache.slice();


    if (
        search
    ) {

        list =
            list.filter(
                function (staff) {

                    const text = [

                        staff.admin_id,
                        staff.username,
                        staff.name,
                        staff.role,
                        staff.status

                    ]
                    .join(" ")
                    .toLowerCase();


                    return text.includes(
                        search
                    );

                }
            );

    }


    if (
        list.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-cell"
                >
                    ไม่พบข้อมูล Staff
                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        list
            .map(
                createStaffRow
            )
            .join("");

}


function createStaffRow(
    staff
) {

    const adminId =
        safeString(
            staff.admin_id
        );


    const username =
        safeString(
            staff.username
        );


    const role =
        safeString(
            staff.role ||
            "STAFF"
        ).toUpperCase();


    const status =
        normalizeAdminStatus(
            staff.status
        );


    const isCurrentUser =
        isCurrentAdmin(
            adminId
        );


    const toggleText =
        status === "ACTIVE"
            ? "⛔ ปิดใช้งาน"
            : "✅ เปิดใช้งาน";


    const toggleClass =
        status === "ACTIVE"
            ? "secondary-btn"
            : "primary-btn";


    let actionHtml = "";


    if (
        isAdminRole()
    ) {

        actionHtml += `

            <button
                type="button"
                class="secondary-btn table-btn"
                data-action="edit-staff"
                data-admin-id="${escapeAttribute(adminId)}"
            >
                ✏️ แก้ไข
            </button>

        `;


        if (
            !isCurrentUser
        ) {

            actionHtml += `

                <button
                    type="button"
                    class="${toggleClass} table-btn"
                    data-action="toggle-staff"
                    data-admin-id="${escapeAttribute(adminId)}"
                    data-username="${escapeAttribute(username)}"
                    data-status="${escapeAttribute(status)}"
                >
                    ${toggleText}
                </button>

            `;


            actionHtml += `

                <button
                    type="button"
                    class="danger-btn table-btn"
                    data-action="delete-staff"
                    data-admin-id="${escapeAttribute(adminId)}"
                    data-username="${escapeAttribute(username)}"
                >
                    🗑️ ลบ
                </button>

            `;

        }

    }


    return `

        <tr>

            <td>
                ${escapeHtml(
                    adminId || "-"
                )}
            </td>

            <td>
                <strong>
                    ${escapeHtml(
                        username || "-"
                    )}
                </strong>
            </td>

            <td>
                ${escapeHtml(
                    staff.name || "-"
                )}
            </td>

            <td>

                <span class="status-badge status-default">
                    ${escapeHtml(role)}
                </span>

            </td>

            <td>

                <span
                    class="status-badge ${getStatusClass(status)}"
                >
                    ${escapeHtml(
                        status
                    )}
                </span>

            </td>

            <td>

                <div class="table-actions">

                    ${actionHtml}

                </div>

            </td>

        </tr>

    `;

}


/* ============================================================
 * OPEN STAFF MODAL
 * ============================================================ */

function openStaffModal(
    staff = null
) {

    const modal =
        getElement(
            "staffModal"
        );


    if (!modal) {

        showMessage(
            "ไม่พบหน้าต่าง Staff",
            "error"
        );

        return;

    }


    if (
        !isAdminRole()
    ) {

        showMessage(
            "เฉพาะ ADMIN เท่านั้นที่จัดการ Staff ได้",
            "error"
        );

        return;

    }


    currentStaff =
        staff || null;


    staffModalMode =
        staff
            ? "edit"
            : "add";


    setText(
        "staffModalTitle",
        staff
            ? "แก้ไข Staff"
            : "เพิ่ม Staff"
    );


    clearStaffModal();


    if (
        staff
    ) {

        setValue(
            "staffAdminId",
            staff.admin_id
        );


        setValue(
            "staffUsername",
            staff.username
        );


        setValue(
            "staffName",
            staff.name
        );


        setValue(
            "staffRole",
            staff.role ||
            "STAFF"
        );


        setValue(
            "staffStatus",
            normalizeAdminStatus(
                staff.status
            ) === "ACTIVE"

                ? "Active"

                : "Inactive"
        );


        const usernameInput =
            getElement(
                "staffUsername"
            );


        if (
            usernameInput
        ) {

            usernameInput.readOnly =
                true;

        }


        const passwordInput =
            getElement(
                "staffPassword"
            );


        if (
            passwordInput
        ) {

            passwordInput.required =
                false;

            passwordInput.placeholder =
                "เว้นว่างหากไม่เปลี่ยน";

        }

    } else {

        setValue(
            "staffAdminId",
            ""
        );


        const usernameInput =
            getElement(
                "staffUsername"
            );


        if (
            usernameInput
        ) {

            usernameInput.readOnly =
                false;

        }


        const passwordInput =
            getElement(
                "staffPassword"
            );


        if (
            passwordInput
        ) {

            passwordInput.required =
                true;

            passwordInput.placeholder =
                "รหัสผ่าน";

        }

    }


    showModal(
        "staffModal"
    );

}


/* ============================================================
 * SAVE STAFF
 * ============================================================ */

async function handleStaffSubmit(
    event
) {

    event.preventDefault();


    if (
        actionBusy
    ) {

        return;

    }


    ensureSession();


    if (
        !isAdminRole()
    ) {

        showMessage(
            "เฉพาะ ADMIN เท่านั้นที่จัดการ Staff ได้",
            "error"
        );

        return;

    }


    const adminId =
        getValue(
            "staffAdminId"
        );


    const username =
        getValue(
            "staffUsername"
        );


    const password =
        getRawValue(
            "staffPassword"
        );


    const name =
        getValue(
            "staffName"
        );


    const role =
        getValue(
            "staffRole"
        ) || "STAFF";


    const status =
        getValue(
            "staffStatus"
        ) || "Active";


    if (
        !username
    ) {

        showMessage(
            "กรุณากรอก Username",
            "error"
        );

        return;

    }


    if (
        !name
    ) {

        showMessage(
            "กรุณากรอกชื่อ Staff",
            "error"
        );

        return;

    }


    if (
        staffModalMode === "add" &&
        !password
    ) {

        showMessage(
            "กรุณากรอกรหัสผ่าน",
            "error"
        );

        return;

    }


    if (
        password &&
        password.length < 4
    ) {

        showMessage(
            "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร",
            "error"
        );

        return;

    }


    const action =
        staffModalMode === "add"

            ? "adminAddStaff"

            : "adminUpdateStaff";


    const data = {

        action:
            action,

        username:
            username,

        name:
            name,

        role:
            role,

        status:
            normalizeAdminStatusForApi(
                status
            )

    };


    if (
        adminId
    ) {

        data.admin_id =
            adminId;

    }


    if (
        password
    ) {

        data.password =
            password;

    }


    const button =
        getElement(
            "saveStaffBtn"
        );


    setActionBusy(
        true
    );


    setButtonLoading(
        button,
        true,
        "กำลังบันทึก..."
    );


    try {

        const result =
            await apiRequest(
                data
            );


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result &&
                result.message

                    ? result.message

                    : "บันทึก Staff ไม่สำเร็จ"
            );

        }


        showMessage(
            result.message ||
            "บันทึก Staff สำเร็จ",
            "success"
        );


        closeModal(
            "staffModal"
        );


        await loadStaff(
            false
        );


        updateDashboardStats();


    } catch (error) {

        console.error(
            "SAVE STAFF ERROR",
            error
        );


        showMessage(
            error.message ||
            "บันทึก Staff ไม่สำเร็จ",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "💾 บันทึก Staff"
        );


        setActionBusy(
            false
        );

    }

}


/* ============================================================
 * TOGGLE STAFF
 *
 * Backend ไม่มี adminToggleStaff
 * ใช้ adminUpdateStaff แทน
 * ============================================================ */

async function toggleStaff(
    adminId,
    username,
    currentStatus
) {

    if (
        !isAdminRole()
    ) {

        showMessage(
            "เฉพาะ ADMIN เท่านั้น",
            "error"
        );

        return;

    }


    if (
        !adminId
    ) {

        showMessage(
            "ไม่พบ Admin ID",
            "error"
        );

        return;

    }


    if (
        isCurrentAdmin(
            adminId
        )
    ) {

        showMessage(
            "ไม่สามารถปิดบัญชีของตัวเองได้",
            "error"
        );

        return;

    }


    const normalized =
        normalizeAdminStatus(
            currentStatus
        );


    const newStatus =
        normalized === "ACTIVE"

            ? "Inactive"

            : "Active";


    const confirmed =
        window.confirm(

            (
                newStatus === "Active"

                    ? "ต้องการเปิดใช้งาน Staff "

                    : "ต้องการปิดการใช้งาน Staff "

            ) +

            (
                username ||
                adminId
            ) +

            " หรือไม่?"

        );


    if (
        !confirmed
    ) {

        return;

    }


    setActionBusy(
        true
    );


    try {

        setConnection(
            "● กำลังเปลี่ยนสถานะ Staff...",
            true
        );


        const result =
            await apiRequest({

                action:
                    "adminUpdateStaff",

                admin_id:
                    adminId,

                status:
                    newStatus

            });


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result &&
                result.message

                    ? result.message

                    : "เปลี่ยนสถานะ Staff ไม่สำเร็จ"
            );

        }


        showMessage(
            result.message ||
            "เปลี่ยนสถานะ Staff สำเร็จ",
            "success"
        );


        await loadStaff(
            false
        );


        updateDashboardStats();


    } catch (error) {

        console.error(
            "TOGGLE STAFF ERROR",
            error
        );


        showMessage(
            error.message ||
            "เปลี่ยนสถานะ Staff ไม่สำเร็จ",
            "error"
        );

    } finally {

        setConnection(
            "● ระบบพร้อมใช้งาน",
            true
        );


        setActionBusy(
            false
        );

    }

}


/* ============================================================
 * DELETE STAFF
 * ============================================================ */

async function deleteStaff(
    adminId,
    username
) {

    if (
        !isAdminRole()
    ) {

        showMessage(
            "เฉพาะ ADMIN เท่านั้น",
            "error"
        );

        return;

    }


    if (
        !adminId
    ) {

        showMessage(
            "ไม่พบ Admin ID",
            "error"
        );

        return;

    }


    if (
        isCurrentAdmin(
            adminId
        )
    ) {

        showMessage(
            "ไม่สามารถลบบัญชีของตัวเองได้",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(

            "ยืนยันการลบ Staff\n\n" +

            (
                username ||
                adminId
            ) +

            "\n\n" +

            "การลบจะไม่สามารถย้อนกลับได้"

        );


    if (
        !confirmed
    ) {

        return;

    }


    setActionBusy(
        true
    );


    try {

        setConnection(
            "● กำลังลบ Staff...",
            true
        );


        const result =
            await apiRequest({

                action:
                    "adminDeleteStaff",

                admin_id:
                    adminId

            });


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result &&
                result.message

                    ? result.message

                    : "ลบ Staff ไม่สำเร็จ"
            );

        }


        showMessage(
            result.message ||
            "ลบ Staff สำเร็จ",
            "success"
        );


        await loadStaff(
            false
        );


        updateDashboardStats();


    } catch (error) {

        console.error(
            "DELETE STAFF ERROR",
            error
        );


        showMessage(
            error.message ||
            "ลบ Staff ไม่สำเร็จ",
            "error"
        );

    } finally {

        setConnection(
            "● ระบบพร้อมใช้งาน",
            true
        );


        setActionBusy(
            false
        );

    }

}


/* ============================================================
 * PASSWORD RESET REQUESTS
 * ============================================================ */

async function loadResetRequests(
    showLoading = true
) {

    ensureSession();


    if (
        showLoading
    ) {

        renderLoading(
            "resetRequestsTableBody",
            9
        );

    }


    try {

        const result =
            await apiRequest({

                action:
                    "adminGetResetRequests"

            });


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result &&
                result.message

                    ? result.message

                    : "โหลดคำขอ Password Reset ไม่สำเร็จ"
            );

        }


        resetRequestsCache =
            Array.isArray(
                result.requests
            )

                ? result.requests

                : [];


        renderResetRequests();

        updateDashboardStats();


        return result;

    } catch (error) {

        console.error(
            "LOAD RESET REQUESTS ERROR",
            error
        );


        renderError(
            "resetRequestsTableBody",
            9,
            error.message ||
            "โหลดคำขอ Password Reset ไม่สำเร็จ"
        );


        throw error;

    }

}


function renderResetRequests() {

    const tbody =
        getElement(
            "resetRequestsTableBody"
        );


    if (!tbody) {

        return;

    }


    const search =
        getValue(
            "resetRequestSearch"
        ).toLowerCase();


    const filter =
        getValue(
            "resetRequestStatusFilter"
        ).toUpperCase();


    let list =
        resetRequestsCache.slice();


    if (
        search
    ) {

        list =
            list.filter(
                function (request) {

                    const text = [

                        request.request_id,

                        request.student_id,

                        request.reason,

                        request.status,

                        request.processed_by,

                        request.note

                    ]
                    .join(" ")
                    .toLowerCase();


                    return text.includes(
                        search
                    );

                }
            );

    }


    if (
        filter
    ) {

        list =
            list.filter(
                function (request) {

                    return (

                        safeString(
                            request.status
                        )
                        .toUpperCase()

                        ===

                        filter

                    );

                }
            );

    }


    if (
        list.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="empty-cell"
                >
                    ไม่พบคำขอ Password Reset
                </td>

            </tr>

        `;


        updateResetBadge();

        return;

    }


    tbody.innerHTML =
        list
            .map(
                createResetRequestRow
            )
            .join("");


    updateResetBadge();

}


function createResetRequestRow(
    request
) {

    const requestId =
        safeString(
            request.request_id
        );


    const studentId =
        safeString(
            request.student_id
        );


    const status =
        safeString(
            request.status
        );


    const upperStatus =
        status.toUpperCase();


    let actionHtml =
        "";


    if (
        upperStatus ===
        "PENDING"
    ) {

        actionHtml = `

            <button
                type="button"
                class="primary-btn table-btn"
                data-action="process-reset"
                data-request-id="${escapeAttribute(requestId)}"
            >
                🔑 ดำเนินการ
            </button>

        `;

    } else if (
        upperStatus ===
        "APPROVED"
    ) {

        actionHtml = `

            <button
                type="button"
                class="primary-btn table-btn"
                data-action="reset-approved"
                data-request-id="${escapeAttribute(requestId)}"
            >
                🔑 รีเซ็ตรหัส
            </button>

        `;

    } else {

        actionHtml = `

            <button
                type="button"
                class="secondary-btn table-btn"
                data-action="view-reset"
                data-request-id="${escapeAttribute(requestId)}"
            >
                👁️ ดู
            </button>

        `;

    }


    return `

        <tr>

            <td>
                ${escapeHtml(
                    requestId || "-"
                )}
            </td>

            <td>
                ${escapeHtml(
                    studentId || "-"
                )}
            </td>

            <td>
                ${escapeHtml(
                    request.reason || "-"
                )}
            </td>

            <td>

                <span
                    class="status-badge ${getStatusClass(status)}"
                >
                    ${escapeHtml(
                        status || "-"
                    )}
                </span>

            </td>

            <td>
                ${escapeHtml(
                    formatDisplayDateTime(
                        request.requested_at
                    )
                )}
            </td>

            <td>
                ${escapeHtml(
                    formatDisplayDateTime(
                        request.processed_at
                    )
                )}
            </td>

            <td>
                ${escapeHtml(
                    request.processed_by || "-"
                )}
            </td>

            <td>
                ${escapeHtml(
                    request.note || "-"
                )}
            </td>

            <td>

                <div class="table-actions">

                    ${actionHtml}

                </div>

            </td>

        </tr>

    `;

}


/* ============================================================
 * RESET REQUEST MODAL
 * ============================================================ */

function openResetRequestModal(
    request
) {

    if (
        !request
    ) {

        showMessage(
            "ไม่พบข้อมูลคำร้อง",
            "error"
        );

        return;

    }


    currentResetRequest =
        request;


    const details =
        getElement(
            "resetRequestDetails"
        );


    if (
        details
    ) {

        details.innerHTML = `

            <div class="reset-detail-row">

                <strong>
                    Request ID
                </strong>

                <span>
                    ${escapeHtml(
                        request.request_id || "-"
                    )}
                </span>

            </div>


            <div class="reset-detail-row">

                <strong>
                    รหัสนักศึกษา
                </strong>

                <span>
                    ${escapeHtml(
                        request.student_id || "-"
                    )}
                </span>

            </div>


            <div class="reset-detail-row">

                <strong>
                    เหตุผล
                </strong>

                <span>
                    ${escapeHtml(
                        request.reason || "-"
                    )}
                </span>

            </div>


            <div class="reset-detail-row">

                <strong>
                    สถานะ
                </strong>

                <span>
                    ${escapeHtml(
                        request.status || "-"
                    )}
                </span>

            </div>


            <div class="reset-detail-row">

                <strong>
                    วันที่ร้องขอ
                </strong>

                <span>
                    ${escapeHtml(
                        formatDisplayDateTime(
                            request.requested_at
                        )
                    )}
                </span>

            </div>


            <div class="reset-detail-row">

                <strong>
                    วันที่ดำเนินการ
                </strong>

                <span>
                    ${escapeHtml(
                        formatDisplayDateTime(
                            request.processed_at
                        )
                    )}
                </span>

            </div>


            <div class="reset-detail-row">

                <strong>
                    ผู้ดำเนินการ
                </strong>

                <span>
                    ${escapeHtml(
                        request.processed_by || "-"
                    )}
                </span>

            </div>


            <div class="reset-detail-row">

                <strong>
                    หมายเหตุ
                </strong>

                <span>
                    ${escapeHtml(
                        request.note || "-"
                    )}
                </span>

            </div>

        `;

    }


    setValue(
        "resetRequestNote",
        ""
    );


    const status =
        safeString(
            request.status
        ).toUpperCase();


    const processButton =
        getElement(
            "processResetRequestBtn"
        );


    const rejectButton =
        getElement(
            "rejectResetRequestBtn"
        );


    if (
        processButton
    ) {

        if (
            status === "PENDING"
        ) {

            processButton.textContent =
                "✅ อนุมัติคำร้อง";

            processButton.disabled =
                false;

            processButton.classList.remove(
                "secondary-btn"
            );

            processButton.classList.add(
                "primary-btn"
            );

        } else if (
            status === "APPROVED"
        ) {

            processButton.textContent =
                "🔑 รีเซ็ตรหัสผ่าน";

            processButton.disabled =
                false;

        } else {

            processButton.textContent =
                "เสร็จสิ้น";

            processButton.disabled =
                true;

            processButton.classList.remove(
                "primary-btn"
            );

            processButton.classList.add(
                "secondary-btn"
            );

        }

    }


    if (
        rejectButton
    ) {

        rejectButton.style.display =
            status === "PENDING"
                ? "inline-flex"
                : "none";

        rejectButton.disabled =
            false;

    }


    showModal(
        "resetRequestModal"
    );

}


/* ============================================================
 * PROCESS RESET REQUEST
 * ============================================================ */

async function handleProcessResetRequest() {

    if (
        !currentResetRequest
    ) {

        showMessage(
            "ไม่พบคำร้องที่เลือก",
            "error"
        );

        return;

    }


    if (
        actionBusy
    ) {

        return;

    }


    const status =
        safeString(
            currentResetRequest.status
        ).toUpperCase();


    const requestId =
        currentResetRequest.request_id;


    const note =
        getValue(
            "resetRequestNote"
        );


    if (
        status === "PENDING"
    ) {

        await approveResetRequest(
            requestId,
            note
        );

        return;

    }


    if (
        status === "APPROVED"
    ) {

        await resetApprovedRequest(
            requestId,
            note
        );

        return;

    }


    showMessage(
        "คำร้องนี้ไม่สามารถดำเนินการต่อได้",
        "error"
    );

}


/* ============================================================
 * APPROVE RESET
 * ============================================================ */

async function approveResetRequest(
    requestId,
    note
) {

    ensureSession();


    const button =
        getElement(
            "processResetRequestBtn"
        );


    setActionBusy(
        true
    );


    setButtonLoading(
        button,
        true,
        "กำลังอนุมัติ..."
    );


    try {

        const result =
            await apiRequest({

                action:
                    "adminApproveReset",

                request_id:
                    requestId,

                note:
                    note || ""

            });


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result &&
                result.message

                    ? result.message

                    : "อนุมัติคำร้องไม่สำเร็จ"
            );

        }


        showMessage(
            result.message ||
            "อนุมัติคำร้องสำเร็จ",
            "success"
        );


        closeModal(
            "resetRequestModal"
        );


        await loadResetRequests(
            false
        );


        updateDashboardStats();


    } catch (error) {

        console.error(
            "APPROVE RESET ERROR",
            error
        );


        showMessage(
            error.message ||
            "อนุมัติคำร้องไม่สำเร็จ",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "✅ อนุมัติคำร้อง"
        );


        setActionBusy(
            false
        );

    }

}


/* ============================================================
 * REJECT RESET
 * ============================================================ */

async function rejectCurrentReset() {

    if (
        !currentResetRequest
    ) {

        showMessage(
            "ไม่พบคำร้องที่เลือก",
            "error"
        );

        return;

    }


    if (
        actionBusy
    ) {

        return;

    }


    const status =
        safeString(
            currentResetRequest.status
        ).toUpperCase();


    if (
        status !== "PENDING"
    ) {

        showMessage(
            "คำร้องนี้ไม่อยู่ในสถานะ PENDING",
            "error"
        );

        return;

    }


    const note =
        getValue(
            "resetRequestNote"
        );


    const confirmed =
        window.confirm(
            "ยืนยันการปฏิเสธคำขอ Password Reset นี้หรือไม่?"
        );


    if (
        !confirmed
    ) {

        return;

    }


    const button =
        getElement(
            "rejectResetRequestBtn"
        );


    setActionBusy(
        true
    );


    setButtonLoading(
        button,
        true,
        "กำลังปฏิเสธ..."
    );


    try {

        const result =
            await apiRequest({

                action:
                    "adminRejectReset",

                request_id:
                    currentResetRequest.request_id,

                note:
                    note || ""

            });


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result &&
                result.message

                    ? result.message

                    : "ปฏิเสธคำร้องไม่สำเร็จ"
            );

        }


        showMessage(
            result.message ||
            "ปฏิเสธคำร้องสำเร็จ",
            "success"
        );


        closeModal(
            "resetRequestModal"
        );


        await loadResetRequests(
            false
        );


        updateDashboardStats();


    } catch (error) {

        console.error(
            "REJECT RESET ERROR",
            error
        );


        showMessage(
            error.message ||
            "ปฏิเสธคำร้องไม่สำเร็จ",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "❌ ปฏิเสธ"
        );


        setActionBusy(
            false
        );

    }

}


/* ============================================================
 * RESET APPROVED REQUEST
 * ============================================================ */

async function resetApprovedRequest(
    requestId,
    note
) {

    ensureSession();


    const newPasswordInput =
        window.prompt(

            "กรอกรหัสผ่านใหม่\n\n" +

            "เว้นว่างเพื่อใช้รหัสผ่านเริ่มต้น 123456"

        );


    if (
        newPasswordInput === null
    ) {

        return;

    }


    const newPassword =
        newPasswordInput ||
        "123456";


    if (
        newPassword.length < 4
    ) {

        showMessage(
            "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(

            "ยืนยันการรีเซ็ตรหัสผ่าน\n\n" +

            "Request ID: " +
            requestId +

            "\nรหัสผ่านใหม่: " +
            newPassword

        );


    if (
        !confirmed
    ) {

        return;

    }


    const button =
        getElement(
            "processResetRequestBtn"
        );


    setActionBusy(
        true
    );


    setButtonLoading(
        button,
        true,
        "กำลังรีเซ็ต..."
    );


    try {

        const result =
            await apiRequest({

                action:
                    "adminResetPassword",

                request_id:
                    requestId,

                newPassword:
                    newPassword,

                note:
                    note || ""

            });


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result &&
                result.message

                    ? result.message

                    : "รีเซ็ตรหัสผ่านไม่สำเร็จ"
            );

        }


        window.alert(

            "รีเซ็ตรหัสผ่านสำเร็จ\n\n" +

            "รหัสนักศึกษา: " +
            (
                result.student_id ||
                currentResetRequest.student_id ||
                "-"
            ) +

            "\nรหัสผ่านใหม่: " +
            (
                result.password ||
                newPassword
            )

        );


        showMessage(
            "รีเซ็ตรหัสผ่านสำเร็จ",
            "success"
        );


        closeModal(
            "resetRequestModal"
        );


        await loadResetRequests(
            false
        );


        updateDashboardStats();


    } catch (error) {

        console.error(
            "RESET PASSWORD ERROR",
            error
        );


        showMessage(
            error.message ||
            "รีเซ็ตรหัสผ่านไม่สำเร็จ",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "🔑 รีเซ็ตรหัสผ่าน"
        );


        setActionBusy(
            false
        );

    }

}


/* ============================================================
 * NAVIGATION
 * ============================================================ */

function bindNavigation() {

    document
        .querySelectorAll(
            "[data-section]"
        )
        .forEach(
            function (element) {

                element.addEventListener(
                    "click",
                    function () {

                        const section =
                            element.dataset.section;


                        if (
                            !section
                        ) {

                            return;

                        }


                        switchSection(
                            section
                        );

                    }
                );

            }
        );

}


function switchSection(
    section,
    updateData = true
) {

    const target =
        getElement(
            "section-" +
            section
        );


    if (
        !target
    ) {

        showMessage(
            "ไม่พบเมนู " +
            section,
            "error"
        );

        console.error(
            "SECTION NOT FOUND:",
            "section-" + section
        );

        return;

    }


    document
        .querySelectorAll(
            ".admin-section"
        )
        .forEach(
            function (item) {

                item.classList.remove(
                    "active"
                );

            }
        );


    target.classList.add(
        "active"
    );


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            function (item) {

                item.classList.toggle(

                    "active",

                    item.dataset.section ===
                    section

                );

            }
        );


    updatePageTitle(
        section
    );


    if (
        updateData
    ) {

        if (
            section === "students"
        ) {

            loadStudents(
                true
            )
            .catch(
                console.error
            );

        }


        if (
            section === "staff"
        ) {

            loadStaff(
                true
            )
            .catch(
                console.error
            );

        }


        if (
            section === "reset-requests"
        ) {

            loadResetRequests(
                true
            )
            .catch(
                console.error
            );

        }


        if (
            section === "dashboard"
        ) {

            updateDashboardStats();

        }

    }


    if (
        window.innerWidth <= 900
    ) {

        const sidebar =
            getElement(
                "adminSidebar"
            );


        if (
            sidebar
        ) {

            sidebar.classList.remove(
                "open"
            );

        }

    }

}


function updatePageTitle(
    section
) {

    const meta =
        SECTION_META[
            section
        ] ||
        SECTION_META.dashboard;


    setText(
        "pageTitle",
        meta.title
    );


    setText(
        "pageSubtitle",
        meta.subtitle
    );

}


/* ============================================================
 * BUTTON BINDINGS
 * ============================================================ */

function bindButtons() {

    bindClick(
        "addStudentBtn",
        function () {

            switchSection(
                "add-student"
            );


            resetStudentAddForm();

        }
    );


    bindClick(
        "cancelStudentBtn",
        function () {

            resetStudentAddForm();

            switchSection(
                "students"
            );

        }
    );


    bindClick(
        "refreshStudentsBtn",
        function () {

            loadStudents(
                true
            )
            .catch(
                function (error) {

                    showMessage(
                        error.message,
                        "error"
                    );

                }
            );

        }
    );


    bindClick(
        "addStaffBtn",
        function () {

            openStaffModal();

        }
    );


    bindClick(
        "refreshStaffBtn",
        function () {

            loadStaff(
                true
            )
            .catch(
                function (error) {

                    showMessage(
                        error.message,
                        "error"
                    );

                }
            );

        }
    );


    bindClick(
        "refreshResetRequestsBtn",
        function () {

            loadResetRequests(
                true
            )
            .catch(
                function (error) {

                    showMessage(
                        error.message,
                        "error"
                    );

                }
            );

        }
    );


    bindClick(
        "closeStudentModal",
        function () {

            closeModal(
                "studentModal"
            );

        }
    );


    bindClick(
        "closeStudentModal2",
        function () {

            closeModal(
                "studentModal"
            );

        }
    );


    bindClick(
        "closeStaffModal",
        function () {

            closeModal(
                "staffModal"
            );

        }
    );


    bindClick(
        "closeStaffModal2",
        function () {

            closeModal(
                "staffModal"
            );

        }
    );


    bindClick(
        "closeResetRequestModal",
        function () {

            closeModal(
                "resetRequestModal"
            );

        }
    );


    bindClick(
        "closeResetRequestModal2",
        function () {

            closeModal(
                "resetRequestModal"
            );

        }
    );


    bindClick(
        "processResetRequestBtn",
        handleProcessResetRequest
    );


    bindClick(
        "rejectResetRequestBtn",
        rejectCurrentReset
    );


    bindClick(
        "logoutBtn",
        handleLogout
    );


    bindClick(
        "sidebarToggle",
        toggleSidebar
    );


    bindClick(
        "closeConfirmModal",
        function () {

            closeModal(
                "confirmModal"
            );

        }
    );


    bindClick(
        "cancelConfirmBtn",
        function () {

            closeModal(
                "confirmModal"
            );

        }
    );

}


/* ============================================================
 * FORMS
 * ============================================================ */

function bindForms() {

    const studentForm =
        getElement(
            "studentForm"
        );


    if (
        studentForm
    ) {

        studentForm.addEventListener(
            "submit",
            handleAddStudent
        );

    }


    const studentModalForm =
        getElement(
            "studentModalForm"
        );


    if (
        studentModalForm
    ) {

        studentModalForm.addEventListener(
            "submit",
            handleStudentModalSubmit
        );

    }


    const staffForm =
        getElement(
            "staffForm"
        );


    if (
        staffForm
    ) {

        staffForm.addEventListener(
            "submit",
            handleStaffSubmit
        );

    }

}


/* ============================================================
 * TABLE ACTIONS
 * ============================================================ */

function bindTableActions() {

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (
                !button
            ) {

                return;

            }


            const action =
                button.dataset.action;


            switch (
                action
            ) {


                case "edit-student": {

                    const student =
                        findStudent(
                            button.dataset.studentId
                        );


                    if (
                        !student
                    ) {

                        showMessage(
                            "ไม่พบข้อมูลนักศึกษา",
                            "error"
                        );

                        return;

                    }


                    openStudentModal(
                        student
                    );


                    break;

                }


                case "reset-student": {

                    directResetStudentPassword(
                        button.dataset.studentId
                    );


                    break;

                }


                case "edit-staff": {

                    const staff =
                        findStaff(
                            button.dataset.adminId
                        );


                    if (
                        !staff
                    ) {

                        showMessage(
                            "ไม่พบข้อมูล Staff",
                            "error"
                        );

                        return;

                    }


                    openStaffModal(
                        staff
                    );


                    break;

                }


                case "toggle-staff": {

                    toggleStaff(

                        button.dataset.adminId,

                        button.dataset.username,

                        button.dataset.status

                    );


                    break;

                }


                case "delete-staff": {

                    deleteStaff(

                        button.dataset.adminId,

                        button.dataset.username

                    );


                    break;

                }


                case "process-reset": {

                    const request =
                        findResetRequest(
                            button.dataset.requestId
                        );


                    openResetRequestModal(
                        request
                    );


                    break;

                }


                case "reset-approved": {

                    const request =
                        findResetRequest(
                            button.dataset.requestId
                        );


                    openResetRequestModal(
                        request
                    );


                    break;

                }


                case "view-reset": {

                    const request =
                        findResetRequest(
                            button.dataset.requestId
                        );


                    openResetRequestModal(
                        request
                    );


                    break;

                }

            }

        }
    );

}


/* ============================================================
 * SEARCH
 * ============================================================ */

function bindSearch() {

    bindInput(
        "studentSearch",
        renderStudents
    );


    bindInput(
        "staffSearch",
        renderStaff
    );


    bindInput(
        "resetRequestSearch",
        renderResetRequests
    );


    bindChange(
        "resetRequestStatusFilter",
        renderResetRequests
    );

}


/* ============================================================
 * MODAL BACKDROPS
 * ============================================================ */

function bindModalBackdrops() {

    [

        "studentModal",
        "staffModal",
        "resetRequestModal",
        "confirmModal"

    ]
    .forEach(
        function (id) {

            const modal =
                getElement(
                    id
                );


            if (
                !modal
            ) {

                return;

            }


            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        modal
                    ) {

                        closeModal(
                            id
                        );

                    }

                }
            );

        }
    );

}


/* ============================================================
 * MODAL HELPERS
 * ============================================================ */

function showModal(
    id
) {

    const modal =
        getElement(
            id
        );


    if (
        !modal
    ) {

        console.error(
            "MODAL NOT FOUND:",
            id
        );

        return false;

    }


    modal.classList.add(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );


    return true;

}


function closeModal(
    id
) {

    const modal =
        getElement(
            id
        );


    if (
        !modal
    ) {

        return;

    }


    modal.classList.remove(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    if (
        !document.querySelector(
            ".modal.show"
        )
    ) {

        document.body.classList.remove(
            "modal-open"
        );

    }


    if (
        id === "studentModal"
    ) {

        currentStudent =
            null;

        studentModalMode =
            "edit";

    }


    if (
        id === "staffModal"
    ) {

        currentStaff =
            null;

        staffModalMode =
            "add";

    }


    if (
        id === "resetRequestModal"
    ) {

        currentResetRequest =
            null;

    }

}


/* ============================================================
 * CLEAR STUDENT MODAL
 * ============================================================ */

function clearStudentModal() {

    setValue(
        "modalStudentId",
        ""
    );


    setValue(
        "modalStudentPassword",
        ""
    );


    setValue(
        "modalStudentPrefix",
        ""
    );


    setValue(
        "modalStudentFirstnameTh",
        ""
    );


    setValue(
        "modalStudentLastnameTh",
        ""
    );


    setValue(
        "modalStudentFirstnameEn",
        ""
    );


    setValue(
        "modalStudentLastnameEn",
        ""
    );


    setValue(
        "modalStudentDepartment",
        ""
    );


    setValue(
        "modalStudentPhone",
        ""
    );


    setValue(
        "modalStudentStatus",
        "นักศึกษาปกติ"
    );


    setValue(
        "modalStudentIssueDate",
        ""
    );


    setValue(
        "modalStudentExpireDate",
        ""
    );


    setValue(
        "modalStudentPhoto",
        ""
    );

}


/* ============================================================
 * CLEAR STAFF MODAL
 * ============================================================ */

function clearStaffModal() {

    setValue(
        "staffAdminId",
        ""
    );


    setValue(
        "staffUsername",
        ""
    );


    setValue(
        "staffPassword",
        ""
    );


    setValue(
        "staffName",
        ""
    );


    setValue(
        "staffRole",
        "STAFF"
    );


    setValue(
        "staffStatus",
        "Active"
    );


    const usernameInput =
        getElement(
            "staffUsername"
        );


    if (
        usernameInput
    ) {

        usernameInput.readOnly =
            false;

    }


    const passwordInput =
        getElement(
            "staffPassword"
        );


    if (
        passwordInput
    ) {

        passwordInput.required =
            true;

        passwordInput.placeholder =
            "รหัสผ่าน";

    }

}


/* ============================================================
 * RESET ADD STUDENT FORM
 * ============================================================ */

function resetStudentAddForm() {

    const form =
        getElement(
            "studentForm"
        );


    if (
        form
    ) {

        form.reset();

    }


    setValue(
        "studentPassword",
        "123456"
    );


    setValue(
        "studentStatus",
        "นักศึกษาปกติ"
    );

}


/* ============================================================
 * FIND DATA
 * ============================================================ */

function findStudent(
    studentId
) {

    const value =
        safeString(
            studentId
        );


    return (
        studentsCache.find(
            function (student) {

                return (

                    safeString(
                        student.student_id
                    ) ===
                    value

                );

            }
        ) || null
    );

}


function findStaff(
    adminId
) {

    const value =
        safeString(
            adminId
        );


    return (
        staffCache.find(
            function (staff) {

                return (

                    safeString(
                        staff.admin_id
                    ) ===
                    value

                );

            }
        ) || null
    );

}


function findResetRequest(
    requestId
) {

    const value =
        safeString(
            requestId
        );


    return (
        resetRequestsCache.find(
            function (request) {

                return (

                    safeString(
                        request.request_id
                    ) ===
                    value

                );

            }
        ) || null
    );

}


/* ============================================================
 * DASHBOARD STATS
 * ============================================================ */

function updateDashboardStats() {

    const totalStudents =
        studentsCache.length;


    const activeStudents =
        studentsCache.filter(
            function (student) {

                const status =
                    safeString(
                        student.status
                    ).toUpperCase();


                return (

                    status ===
                    "ACTIVE"

                    ||

                    status ===
                    "นักศึกษาปกติ".toUpperCase()

                );

            }
        ).length;


    const totalStaff =
        staffCache.filter(
            function (staff) {

                return (
                    safeString(
                        staff.role
                    ).toUpperCase()
                    ===
                    "STAFF"
                );

            }
        ).length;


    const pendingResetRequests =
        resetRequestsCache.filter(
            function (request) {

                return (

                    safeString(
                        request.status
                    ).toUpperCase()
                    ===
                    "PENDING"

                );

            }
        ).length;


    setText(
        "totalStudents",
        totalStudents
    );


    setText(
        "activeStudents",
        activeStudents
    );


    setText(
        "totalStaff",
        totalStaff
    );


    setText(
        "pendingResetRequests",
        pendingResetRequests
    );


    updateResetBadge();

}


/* ============================================================
 * RESET BADGE
 * ============================================================ */

function updateResetBadge() {

    const badge =
        getElement(
            "resetRequestBadge"
        );


    if (
        !badge
    ) {

        return;

    }


    const pending =
        resetRequestsCache.filter(
            function (request) {

                return (

                    safeString(
                        request.status
                    ).toUpperCase()
                    ===
                    "PENDING"

                );

            }
        ).length;


    badge.textContent =
        String(
            pending
        );


    if (
        pending > 0
    ) {

        badge.classList.remove(
            "hidden"
        );

    } else {

        badge.classList.add(
            "hidden"
        );

    }

}


/* ============================================================
 * ADMIN PROFILE
 * ============================================================ */

function loadAdminProfile() {

    let raw =
        "";


    try {

        if (
            typeof CONFIG !== "undefined" &&
            CONFIG.ADMIN_KEY
        ) {

            raw =
                sessionStorage.getItem(
                    CONFIG.ADMIN_KEY
                );

        }

    } catch (error) {

        console.warn(
            "LOAD ADMIN PROFILE ERROR",
            error
        );

    }


    if (
        !raw
    ) {

        try {

            raw =
                sessionStorage.getItem(
                    "admin"
                );

        } catch (error) {

            console.warn(
                "LOAD FALLBACK ADMIN PROFILE ERROR",
                error
            );

        }

    }


    if (
        !raw
    ) {

        return;

    }


    try {

        const admin =
            JSON.parse(
                raw
            );


        setText(
            "adminName",
            admin.name ||
            admin.username ||
            "Admin"
        );


        setText(
            "adminRole",
            admin.role ||
            "ADMIN"
        );

    } catch (error) {

        console.warn(
            "ADMIN PROFILE JSON ERROR",
            error
        );

    }

}


/* ============================================================
 * ROLE
 * ============================================================ */

function getCurrentAdmin() {

    let raw =
        "";


    try {

        if (
            typeof CONFIG !== "undefined" &&
            CONFIG.ADMIN_KEY
        ) {

            raw =
                sessionStorage.getItem(
                    CONFIG.ADMIN_KEY
                );

        }

    } catch (error) {

        console.warn(
            error
        );

    }


    if (
        !raw
    ) {

        try {

            raw =
                sessionStorage.getItem(
                    "admin"
                );

        } catch (error) {

            console.warn(
                error
            );

        }

    }


    if (
        !raw
    ) {

        return null;

    }


    try {

        return JSON.parse(
            raw
        );

    } catch (error) {

        return null;

    }

}


function getCurrentAdminRole() {

    const admin =
        getCurrentAdmin();


    return safeString(
        admin &&
        admin.role
            ? admin.role
            : ""
    ).toUpperCase();

}


function isAdminRole() {

    return (
        getCurrentAdminRole()
        ===
        "ADMIN"
    );

}


function isCurrentAdmin(
    adminId
) {

    const admin =
        getCurrentAdmin();


    return (

        safeString(
            adminId
        ) !== ""

        &&

        safeString(
            admin &&
            admin.admin_id
        ) ===
        safeString(
            adminId
        )

    );

}


function applyRoleVisibility() {

    const admin =
        getCurrentAdmin();


    if (
        admin
    ) {

        setText(
            "adminName",
            admin.name ||
            admin.username ||
            "Admin"
        );


        setText(
            "adminRole",
            admin.role ||
            "ADMIN"
        );

    }


    const adminOnly =
        [

            "addStaffBtn"

        ];


    adminOnly.forEach(
        function (id) {

            const element =
                getElement(
                    id
                );


            if (
                element
            ) {

                element.style.display =
                    isAdminRole()
                        ? ""
                        : "none";

            }

        }
    );


    if (
        !isAdminRole()
    ) {

        const navStaff =
            getElement(
                "navStaff"
            );


        if (
            navStaff
        ) {

            navStaff.title =
                "Staff สามารถดูข้อมูลได้ แต่ไม่มีสิทธิ์แก้ไขบัญชี Staff";

        }

    }

}


/* ============================================================
 * LOGOUT
 * ============================================================ */

async function handleLogout() {

    const confirmed =
        window.confirm(
            "ต้องการออกจากระบบ Admin หรือไม่?"
        );


    if (
        !confirmed
    ) {

        return;

    }


    const token =
        getAdminToken();


    try {

        if (
            token
        ) {

            await apiRequest({

                action:
                    "adminLogout",

                token:
                    token

            });

        }

    } catch (error) {

        console.warn(
            "ADMIN LOGOUT API ERROR",
            error
        );

    } finally {

        clearAdminSession();

        window.location.replace(
            "admin-login.html"
        );

    }

}


/* ============================================================
 * SIDEBAR
 * ============================================================ */

function toggleSidebar() {

    const sidebar =
        getElement(
            "adminSidebar"
        );


    if (
        !sidebar
    ) {

        return;

    }


    sidebar.classList.toggle(
        "open"
    );

}


/* ============================================================
 * ACTION BUSY
 * ============================================================ */

function setActionBusy(
    value
) {

    actionBusy =
        Boolean(
            value
        );

}


/* ============================================================
 * ENSURE SESSION
 * ============================================================ */

function ensureSession() {

    const token =
        getAdminToken();


    if (
        !token
    ) {

        handleSessionExpired();

        throw new Error(
            "ADMIN_SESSION_EXPIRED"
        );

    }


    return token;

}


/* ============================================================
 * BUTTON LOADING
 * ============================================================ */

function setButtonLoading(
    button,
    loading,
    text
) {

    if (
        !button
    ) {

        return;

    }


    if (
        loading
    ) {

        if (
            !button.dataset.originalHtml
        ) {

            button.dataset.originalHtml =
                button.innerHTML;

        }


        button.disabled =
            true;


        button.textContent =
            text ||
            "กำลังดำเนินการ...";

    } else {

        button.disabled =
            false;


        button.innerHTML =
            text ||
            button.dataset.originalHtml ||
            "บันทึก";

    }

}


/* ============================================================
 * CONNECTION STATUS
 * ============================================================ */

function setConnection(
    text,
    good = true
) {

    const element =
        getElement(
            "connectionStatus"
        );


    if (
        !element
    ) {

        return;

    }


    element.textContent =
        text;


    element.classList.toggle(
        "error",
        !good
    );

}


/* ============================================================
 * MESSAGE
 * ============================================================ */

function showMessage(
    message,
    type = "info"
) {

    const box =
        getElement(
            "messageBox"
        );


    if (
        !box
    ) {

        console.log(
            type.toUpperCase(),
            message
        );

        return;

    }


    box.textContent =
        safeString(
            message
        );


    box.className =
        "message-box " +
        type +
        " show";


    clearTimeout(
        messageTimer
    );


    messageTimer =
        window.setTimeout(
            function () {

                box.classList.remove(
                    "show"
                );

            },
            4500
        );

}


/* ============================================================
 * ELEMENT HELPERS
 * ============================================================ */

function getElement(
    id
) {

    return document.getElementById(
        id
    );

}


function bindClick(
    id,
    handler
) {

    const element =
        getElement(
            id
        );


    if (
        !element
    ) {

        console.warn(
            "CLICK ELEMENT NOT FOUND:",
            id
        );

        return;

    }


    element.addEventListener(
        "click",
        handler
    );

}


function bindInput(
    id,
    handler
) {

    const element =
        getElement(
            id
        );


    if (
        !element
    ) {

        return;

    }


    element.addEventListener(
        "input",
        handler
    );

}


function bindChange(
    id,
    handler
) {

    const element =
        getElement(
            id
        );


    if (
        !element
    ) {

        return;

    }


    element.addEventListener(
        "change",
        handler
    );

}


function focusElement(
    id
) {

    const element =
        getElement(
            id
        );


    if (
        element
    ) {

        element.focus();

    }

}


/* ============================================================
 * VALUE HELPERS
 * ============================================================ */

function safeString(
    value
) {

    return String(
        value == null
            ? ""
            : value
    ).trim();

}


function getValue(
    id
) {

    const element =
        getElement(
            id
        );


    if (
        !element
    ) {

        return "";

    }


    return safeString(
        element.value
    );

}


function getRawValue(
    id
) {

    const element =
        getElement(
            id
        );


    if (
        !element
    ) {

        return "";

    }


    return String(
        element.value == null
            ? ""
            : element.value
    );

}


function setValue(
    id,
    value
) {

    const element =
        getElement(
            id
        );


    if (
        !element
    ) {

        return;

    }


    element.value =
        value == null
            ? ""
            : value;

}


function setText(
    id,
    value
) {

    const element =
        getElement(
            id
        );


    if (
        !element
    ) {

        return;

    }


    element.textContent =
        value == null
            ? ""
            : value;

}


/* ============================================================
 * STATUS HELPERS
 * ============================================================ */

function normalizeAdminStatus(
    value
) {

    const status =
        safeString(
            value
        ).toUpperCase();


    if (
        status === "ACTIVE"
    ) {

        return "ACTIVE";

    }


    if (
        status === "INACTIVE"
    ) {

        return "INACTIVE";

    }


    if (
        status === "เปิดใช้งาน"
    ) {

        return "ACTIVE";

    }


    if (
        status === "ปิดการใช้งาน"
    ) {

        return "INACTIVE";

    }


    return status || "ACTIVE";

}


function normalizeAdminStatusForApi(
    value
) {

    return (
        normalizeAdminStatus(
            value
        )
        ===
        "ACTIVE"

            ? "ACTIVE"

            : "INACTIVE"
    );

}


function getStatusClass(
    status
) {

    const value =
        safeString(
            status
        ).toUpperCase();


    if (

        value ===
        "ACTIVE"

        ||

        value ===
        "นักศึกษาปกติ".toUpperCase()

        ||

        value ===
        "APPROVED"

        ||

        value ===
        "RESET"

    ) {

        return "status-active";

    }


    if (

        value ===
        "PENDING"

        ||

        value ===
        "PROCESSING"

    ) {

        return "status-pending";

    }


    if (

        value ===
        "INACTIVE"

        ||

        value ===
        "REJECTED"

        ||

        value ===
        "พักการศึกษา".toUpperCase()

        ||

        value ===
        "พ้นสภาพ".toUpperCase()

        ||

        value ===
        "สำเร็จการศึกษา".toUpperCase()

    ) {

        return "status-inactive";

    }


    return "status-default";

}


/* ============================================================
 * DATE HELPERS
 * ============================================================ */

function formatDisplayDate(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";

    }


    const text =
        safeString(
            value
        );


    /*
     * ถ้าเป็นรูปแบบ dd/MM/yyyy อยู่แล้ว
     */
    if (
        /^\d{1,2}\/\d{1,2}\/\d{4}/.test(
            text
        )
    ) {

        return text.split(" ")[0];

    }


    /*
     * yyyy-MM-dd
     */
    if (
        /^\d{4}-\d{2}-\d{2}/.test(
            text
        )
    ) {

        const datePart =
            text.substring(
                0,
                10
            );


        const parts =
            datePart.split("-");


        return (

            parts[2] +
            "/" +
            parts[1] +
            "/" +
            parts[0]

        );

    }


    return text;

}


function formatDisplayDateTime(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";

    }


    const text =
        safeString(
            value
        );


    const match =
        text.match(

            /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/

        );


    if (
        match
    ) {

        return (

            String(
                match[1]
            ).padStart(
                2,
                "0"
            ) +

            "/" +

            String(
                match[2]
            ).padStart(
                2,
                "0"
            ) +

            "/" +

            match[3] +

            " " +

            String(
                match[4]
            ).padStart(
                2,
                "0"
            ) +

            ":" +

            match[5]

        );

    }


    const date =
        new Date(
            value
        );


    if (
        !Number.isNaN(
            date.getTime()
        )
    ) {

        return (

            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            ) +

            "/" +

            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            ) +

            "/" +

            date.getFullYear() +

            " " +

            String(
                date.getHours()
            ).padStart(
                2,
                "0"
            ) +

            ":" +

            String(
                date.getMinutes()
            ).padStart(
                2,
                "0"
            )

        );

    }


    return text;

}


function normalizeDateForInput(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "";

    }


    const text =
        safeString(
            value
        );


    /*
     * yyyy-MM-dd
     */
    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            text
        )
    ) {

        return text;

    }


    /*
     * dd/MM/yyyy
     */
    const match =
        text.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
        );


    if (
        match
    ) {

        let year =
            Number(
                match[3]
            );


        /*
         * รองรับ พ.ศ.
         */
        if (
            year > 2400
        ) {

            year -= 543;

        }


        return (

            String(
                year
            ) +

            "-" +

            String(
                match[2]
            ).padStart(
                2,
                "0"
            ) +

            "-" +

            String(
                match[1]
            ).padStart(
                2,
                "0"
            )

        );

    }


    return "";

}


/* ============================================================
 * TABLE HELPERS
 * ============================================================ */

function renderLoading(
    tbodyId,
    colspan
) {

    const tbody =
        getElement(
            tbodyId
        );


    if (
        !tbody
    ) {

        return;

    }


    tbody.innerHTML = `

        <tr>

            <td
                colspan="${colspan}"
                class="loading-row"
            >
                กำลังโหลดข้อมูล...
            </td>

        </tr>

    `;

}


function renderError(
    tbodyId,
    colspan,
    message
) {

    const tbody =
        getElement(
            tbodyId
        );


    if (
        !tbody
    ) {

        return;

    }


    tbody.innerHTML = `

        <tr>

            <td
                colspan="${colspan}"
                class="empty-cell"
            >
                ${escapeHtml(
                    message ||
                    "เกิดข้อผิดพลาด"
                )}
            </td>

        </tr>

    `;

}


/* ============================================================
 * HTML ESCAPE
 * ============================================================ */

function escapeHtml(
    value
) {

    return safeString(
        value
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


/* ============================================================
 * END
 * ============================================================ */

console.log(
    "ADMIN DASHBOARD JS CLEAN REBUILD READY"
);
