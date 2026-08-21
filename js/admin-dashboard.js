/************************************************************
 * ADMIN DASHBOARD
 * js/admin-dashboard.js
 *
 * VERSION: CLEAN / REBUILD
 *
 * รองรับ:
 *  1. Admin Session
 *  2. Dashboard
 *  3. Student
 *      - Load
 *      - Search
 *      - Add
 *      - Edit
 *      - Direct Reset Password
 *  4. Password Reset Requests
 *      - Load
 *      - Approve
 *      - Reject
 *      - Reset Password
 *  5. Staff
 *      - Load
 *      - Add
 *      - Edit
 *      - Delete
 *  6. Logout
 *
 * ใช้กับ:
 *  - config.js
 *  - admin-dashboard.html
 *  - code.gs ชุดปัจจุบัน
 ************************************************************/

"use strict";


/* =========================================================
   GLOBAL STATE
========================================================= */

let studentsCache = [];
let staffCache = [];
let resetRequestsCache = [];

let currentAdmin = null;

let currentEditingStudentId = "";
let currentEditingStaffId = "";

let busy = false;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("ADMIN DASHBOARD JS READY");

    try {

        if (typeof CONFIG === "undefined") {

            console.error("CONFIG NOT FOUND");

            alert("ไม่พบ config.js");

            return;
        }

        if (!CONFIG.API_URL) {

            alert("ไม่พบ CONFIG.API_URL");

            return;
        }

        bindEvents();

        restoreAdminDisplay();

        checkAdminSession();

    } catch (error) {

        console.error(
            "ADMIN DASHBOARD INIT ERROR",
            error
        );

        showMessage(
            "เกิดข้อผิดพลาดในการเริ่มต้นหน้า Admin",
            "error"
        );
    }

});


/* =========================================================
   EVENT BINDING
========================================================= */

function bindEvents() {

    /*
     * Logout
     */

    bindClick(
        "logoutBtn",
        handleLogout
    );


    /*
     * Sidebar
     */

    bindClick(
        "sidebarToggle",
        toggleSidebar
    );


    bindClick(
        "sidebarOverlay",
        closeSidebar
    );


    /*
     * Quick Actions
     */

    document.addEventListener(
        "click",
        handleSectionNavigation
    );


    /*
     * Student
     */

    bindClick(
        "addStudentBtn",
        openAddStudent
    );


    bindClick(
        "refreshStudentsBtn",
        function () {

            loadStudents();

        }
    );


    bindInput(
        "studentSearch",
        function (event) {

            renderStudents(
                event.target.value
            );

        }
    );


    bindSubmit(
        "studentForm",
        handleAddStudent
    );


    bindSubmit(
        "studentEditForm",
        handleUpdateStudent
    );


    bindClick(
        "closeStudentModal",
        closeStudentModal
    );


    bindClick(
        "closeStudentEditModal",
        closeStudentEditModal
    );


    bindClick(
        "cancelStudentEdit",
        closeStudentEditModal
    );


    /*
     * Staff
     */

    bindClick(
        "addStaffBtn",
        openAddStaff
    );


    bindClick(
        "refreshStaffBtn",
        function () {

            loadStaff();

        }
    );


    bindSubmit(
        "staffForm",
        handleAddStaff
    );


    bindSubmit(
        "staffEditForm",
        handleUpdateStaff
    );


    bindClick(
        "closeStaffModal",
        closeStaffModal
    );


    bindClick(
        "closeStaffEditModal",
        closeStaffEditModal
    );


    bindClick(
        "cancelStaffEdit",
        closeStaffEditModal
    );


    /*
     * Password Reset
     */

    bindSubmit(
        "resetPasswordForm",
        handleResetPasswordSubmit
    );


    bindClick(
        "closeResetPasswordModal",
        closeResetPasswordModal
    );


    bindClick(
        "cancelResetPassword",
        closeResetPasswordModal
    );


    bindClick(
        "refreshResetRequestsBtn",
        function () {

            loadResetRequests();

        }
    );


    /*
     * Global keyboard
     */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closeAllModals();

            }

        }
    );


    /*
     * Click outside modal
     */

    document.addEventListener(
        "click",
        function (event) {

            if (
                event.target.classList &&
                event.target.classList.contains("modal")
            ) {

                event.target.classList.remove(
                    "show"
                );

            }

        }
    );

}


/* =========================================================
   SAFE EVENT HELPERS
========================================================= */

function bindClick(id, handler) {

    const element =
        document.getElementById(id);

    if (!element) {

        return;

    }

    element.addEventListener(
        "click",
        handler
    );

}


function bindInput(id, handler) {

    const element =
        document.getElementById(id);

    if (!element) {

        return;

    }

    element.addEventListener(
        "input",
        handler
    );

}


function bindSubmit(id, handler) {

    const element =
        document.getElementById(id);

    if (!element) {

        return;

    }

    element.addEventListener(
        "submit",
        handler
    );

}


/* =========================================================
   API
========================================================= */

async function apiRequest(payload) {

    if (
        !payload ||
        !payload.action
    ) {

        throw new Error(
            "ไม่พบ API action"
        );

    }


    const body = {

        ...payload

    };


    console.log(
        "API REQUEST:",
        body.action
    );


    const response =
        await fetch(
            CONFIG.API_URL,
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"

                },

                body:
                    JSON.stringify(body)

            }
        );


    if (!response.ok) {

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
            JSON.parse(text);

    } catch (error) {

        console.error(
            "INVALID API JSON:",
            text
        );

        throw new Error(
            "API ส่งข้อมูลกลับมาไม่ถูกต้อง"
        );

    }


    console.log(
        "API RESPONSE:",
        body.action,
        result
    );


    return result;

}


/* =========================================================
   TOKEN
========================================================= */

function getAdminToken() {

    if (
        typeof CONFIG === "undefined"
    ) {

        return "";

    }


    return String(
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        ) || ""
    ).trim();

}


/* =========================================================
   SESSION
========================================================= */

async function checkAdminSession() {

    const token =
        getAdminToken();


    if (!token) {

        redirectToLogin();

        return;

    }


    restoreAdminDisplay();


    /*
     * ตรวจ Session โดยเรียก action ที่มีแน่นอน
     */

    try {

        const result =
            await apiRequest({

                action:
                    "adminGetStudents",

                token:
                    token

            });


        if (
            !result ||
            result.success !== true
        ) {

            if (
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;

            }


            showMessage(
                result &&
                result.message
                    ? result.message
                    : "ไม่สามารถตรวจสอบ Admin Session ได้",
                "error"
            );

            return;

        }


        /*
         * โหลดข้อมูลทั้งหมด
         */

        await Promise.allSettled([

            loadStudents(),

            loadStaff(),

            loadResetRequests()

        ]);


        updateDashboardCounters();

    } catch (error) {

        console.error(
            "CHECK ADMIN SESSION ERROR",
            error
        );

        showMessage(
            "ไม่สามารถเชื่อมต่อระบบ Admin ได้",
            "error"
        );

    }

}


/* =========================================================
   ADMIN DISPLAY
========================================================= */

function restoreAdminDisplay() {

    const raw =
        sessionStorage.getItem(
            CONFIG.ADMIN_KEY
        );


    if (!raw) {

        return;

    }


    try {

        currentAdmin =
            JSON.parse(raw);

    } catch (error) {

        console.warn(
            "ADMIN DATA PARSE ERROR",
            error
        );

        return;

    }


    const name =
        currentAdmin.name ||
        currentAdmin.username ||
        "Admin";


    const role =
        currentAdmin.role ||
        "ADMIN";


    setText(
        "adminName",
        name
    );


    setText(
        "adminRole",
        role
    );


    setText(
        "topbarAdminName",
        name
    );

}


/* =========================================================
   SESSION EXPIRED
========================================================= */

function isSessionExpired(result) {

    if (!result) {

        return false;

    }


    const code =
        String(
            result.code || ""
        )
        .trim()
        .toUpperCase();


    return (

        code ===
        "ADMIN_SESSION_EXPIRED"

        ||

        code ===
        "SESSION_EXPIRED"

    );

}


function handleSessionExpired() {

    sessionStorage.removeItem(
        CONFIG.ADMIN_SESSION_KEY
    );

    sessionStorage.removeItem(
        CONFIG.ADMIN_KEY
    );


    alert(
        "Session ของ Admin หมดอายุ กรุณาเข้าสู่ระบบใหม่"
    );


    redirectToLogin();

}


function redirectToLogin() {

    window.location.replace(
        "admin-login.html"
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function handleSectionNavigation(event) {

    const button =
        event.target.closest(
            "[data-section]"
        );


    if (!button) {

        return;

    }


    const sectionName =
        button.getAttribute(
            "data-section"
        );


    if (!sectionName) {

        return;

    }


    showSection(
        sectionName
    );

}


function showSection(sectionName) {

    let sectionId =
        sectionName;


    if (
        !sectionId.startsWith(
            "section-"
        )
    ) {

        sectionId =
            "section-" +
            sectionName;

    }


    const target =
        document.getElementById(
            sectionId
        );


    if (!target) {

        console.warn(
            "SECTION NOT FOUND:",
            sectionId
        );

        return;

    }


    document
        .querySelectorAll(
            ".admin-section"
        )
        .forEach(
            function (section) {

                section.classList.remove(
                    "active"
                );

                section.classList.remove(
                    "show"
                );

            }
        );


    target.classList.add(
        "active"
    );


    target.classList.add(
        "show"
    );


    /*
     * อัปเดต Title
     */

    const titleMap = {

        dashboard:
            [
                "Dashboard",
                "ภาพรวมระบบ"
            ],

        students:
            [
                "ข้อมูลนักศึกษา",
                "ค้นหา แก้ไข และจัดการข้อมูลนักศึกษา"
            ],

        "add-student":
            [
                "เพิ่มนักศึกษา",
                "สร้างบัญชีนักศึกษาใหม่เข้าสู่ระบบ"
            ],

        "reset-password":
            [
                "รีเซ็ตรหัสผ่าน",
                "จัดการคำร้องรีเซ็ตรหัสผ่านนักศึกษา"
            ],

        staff:
            [
                "จัดการ Staff",
                "จัดการบัญชีผู้ดูแลระบบและเจ้าหน้าที่"
            ],

        "add-staff":
            [
                "เพิ่ม Staff",
                "สร้างบัญชี Staff ใหม่เข้าสู่ระบบ"
            ]

    };


    const key =
        sectionName.replace(
            /^section-/,
            ""
        );


    if (
        titleMap[key]
    ) {

        setText(
            "pageTitle",
            titleMap[key][0]
        );

        setText(
            "pageSubtitle",
            titleMap[key][1]
        );

    }


    closeSidebar();

}


/* =========================================================
   SIDEBAR
========================================================= */

function toggleSidebar() {

    const sidebar =
        document.querySelector(
            ".admin-sidebar"
        );


    if (!sidebar) {

        return;

    }


    sidebar.classList.toggle(
        "open"
    );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (overlay) {

        overlay.classList.toggle(
            "show"
        );

    }

}


function closeSidebar() {

    const sidebar =
        document.querySelector(
            ".admin-sidebar"
        );


    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (overlay) {

        overlay.classList.remove(
            "show"
        );

    }

}


/* =========================================================
   STUDENTS
========================================================= */

async function loadStudents() {

    const tbody =
        document.getElementById(
            "studentsTableBody"
        );


    if (tbody) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="empty-cell"
                >
                    กำลังโหลดข้อมูลนักศึกษา...
                </td>

            </tr>

        `;

    }


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    try {

        const result =
            await apiRequest({

                action:
                    "adminGetStudents",

                token:
                    token

            });


        if (
            !result ||
            result.success !== true
        ) {

            if (
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;

            }


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


        renderStudents(
            getValue("studentSearch")
        );


        updateDashboardCounters();

    } catch (error) {

        console.error(
            "LOAD STUDENTS ERROR",
            error
        );


        studentsCache = [];


        if (tbody) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        class="empty-cell"
                    >
                        ${escapeHtml(
                            error.message ||
                            "โหลดข้อมูลนักศึกษาไม่สำเร็จ"
                        )}
                    </td>

                </tr>

            `;

        }


        showMessage(
            error.message ||
            "โหลดข้อมูลนักศึกษาไม่สำเร็จ",
            "error"
        );

    }

}


/* =========================================================
   RENDER STUDENTS
========================================================= */

function renderStudents(searchText) {

    const tbody =
        document.getElementById(
            "studentsTableBody"
        );


    if (!tbody) {

        return;

    }


    const search =
        String(
            searchText || ""
        )
        .trim()
        .toLowerCase();


    let list =
        studentsCache.slice();


    if (search) {

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
        list.map(
            createStudentRow
        ).join("");

}


/* =========================================================
   STUDENT ROW
========================================================= */

function createStudentRow(student) {

    const studentId =
        String(
            student.student_id || ""
        );


    const fullname =
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
        student.status ||
        "นักศึกษาปกติ";


    return `

        <tr>

            <td>

                <strong>
                    ${escapeHtml(studentId)}
                </strong>

            </td>

            <td>

                ${escapeHtml(
                    fullname || "-"
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

                <div
                    class="action-buttons"
                >

                    <button
                        type="button"
                        class="small-btn edit-btn"
                        data-action="edit-student"
                        data-id="${escapeAttr(studentId)}"
                    >
                        ✏️ แก้ไข
                    </button>

                    <button
                        type="button"
                        class="small-btn reset-btn"
                        data-action="direct-reset-student"
                        data-id="${escapeAttr(studentId)}"
                    >
                        🔑 รีเซ็ตรหัสผ่าน
                    </button>

                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   STUDENT TABLE EVENT DELEGATION
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if (!button) {

            return;

        }


        const action =
            button.getAttribute(
                "data-action"
            );


        const id =
            button.getAttribute(
                "data-id"
            );


        if (
            action ===
            "edit-student"
        ) {

            openEditStudent(
                id
            );

            return;

        }


        if (
            action ===
            "direct-reset-student"
        ) {

            directResetStudent(
                id
            );

            return;

        }


        if (
            action ===
            "edit-staff"
        ) {

            openEditStaff(
                id
            );

            return;

        }


        if (
            action ===
            "delete-staff"
        ) {

            deleteStaff(
                id
            );

            return;

        }


        if (
            action ===
            "reset-request"
        ) {

            openResetRequest(
                id
            );

            return;

        }

    }
);


/* =========================================================
   ADD STUDENT
========================================================= */

function openAddStudent() {

    const form =
        document.getElementById(
            "studentForm"
        );


    if (form) {

        form.reset();

    }


    setValue(
        "studentStatus",
        "นักศึกษาปกติ"
    );


    const modal =
        document.getElementById(
            "studentModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}


async function handleAddStudent(event) {

    event.preventDefault();


    if (busy) {

        return;

    }


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const studentId =
        getValue("studentId");


    const password =
        getValue("studentPassword");


    const firstnameTh =
        getValue("studentFirstnameTh");


    const lastnameTh =
        getValue("studentLastnameTh");


    if (!studentId) {

        showMessage(
            "กรุณากรอกรหัสนักศึกษา",
            "error"
        );

        return;

    }


    if (!password) {

        showMessage(
            "กรุณากรอกรหัสผ่าน",
            "error"
        );

        return;

    }


    if (!firstnameTh) {

        showMessage(
            "กรุณากรอกชื่อ",
            "error"
        );

        return;

    }


    if (!lastnameTh) {

        showMessage(
            "กรุณากรอกนามสกุล",
            "error"
        );

        return;

    }


    const payload = {

        action:
            "adminAddStudent",

        token:
            token,

        student_id:
            studentId,

        password:
            password,

        prefix_th:
            getValue("studentPrefix"),

        firstname_th:
            firstnameTh,

        lastname_th:
            lastnameTh,

        firstname_en:
            getValue("studentFirstnameEn"),

        lastname_en:
            getValue("studentLastnameEn"),

        department:
            getValue("studentDepartment"),

        phone:
            getValue("studentPhone"),

        status:
            getValue("studentStatus") ||
            "นักศึกษาปกติ",

        issue_date:
            getValue("studentIssueDate"),

        expire_date:
            getValue("studentExpireDate"),

        photo_url:
            getValue("studentPhoto")

    };


    const button =
        document.getElementById(
            "saveStudentBtn"
        );


    setBusy(
        true,
        button,
        "กำลังบันทึก..."
    );


    try {

        const result =
            await apiRequest(
                payload
            );


        if (
            !result ||
            result.success !== true
        ) {

            if (
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "เพิ่มนักศึกษาไม่สำเร็จ"
            );

        }


        showMessage(
            "เพิ่มนักศึกษาสำเร็จ",
            "success"
        );


        closeStudentModal();


        await loadStudents();


        showSection(
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

        setBusy(
            false,
            button,
            "บันทึกนักศึกษา"
        );

    }

}


/* =========================================================
   EDIT STUDENT
========================================================= */

function openEditStudent(studentId) {

    const id =
        String(
            studentId || ""
        ).trim();


    if (!id) {

        showMessage(
            "ไม่พบรหัสนักศึกษา",
            "error"
        );

        return;

    }


    const student =
        studentsCache.find(
            function (item) {

                return String(
                    item.student_id || ""
                ).trim() === id;

            }
        );


    if (!student) {

        showMessage(
            "ไม่พบข้อมูลนักศึกษา",
            "error"
        );

        return;

    }


    currentEditingStudentId =
        id;


    setValue(
        "editStudentId",
        id
    );


    setValue(
        "editStudentIdDisplay",
        id
    );


    setValue(
        "editStudentPrefix",
        student.prefix_th
    );


    setValue(
        "editStudentFirstnameTh",
        student.firstname_th
    );


    setValue(
        "editStudentLastnameTh",
        student.lastname_th
    );


    setValue(
        "editStudentFirstnameEn",
        student.firstname_en
    );


    setValue(
        "editStudentLastnameEn",
        student.lastname_en
    );


    setValue(
        "editStudentDepartment",
        student.department
    );


    setValue(
        "editStudentPhone",
        student.phone
    );


    setValue(
        "editStudentStatus",
        student.status ||
        "นักศึกษาปกติ"
    );


    setValue(
        "editStudentIssueDate",
        convertToInputDate(
            student.issue_date
        )
    );


    setValue(
        "editStudentExpireDate",
        convertToInputDate(
            student.expire_date
        )
    );


    setValue(
        "editStudentPhoto",
        student.photo_url
    );


    const modal =
        document.getElementById(
            "studentEditModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}


/* =========================================================
   UPDATE STUDENT
========================================================= */

async function handleUpdateStudent(event) {

    event.preventDefault();


    if (busy) {

        return;

    }


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const studentId =
        getValue("editStudentId") ||
        currentEditingStudentId;


    if (!studentId) {

        showMessage(
            "ไม่พบรหัสนักศึกษา",
            "error"
        );

        return;

    }


    const firstnameTh =
        getValue(
            "editStudentFirstnameTh"
        );


    const lastnameTh =
        getValue(
            "editStudentLastnameTh"
        );


    if (!firstnameTh) {

        showMessage(
            "กรุณากรอกชื่อ",
            "error"
        );

        return;

    }


    if (!lastnameTh) {

        showMessage(
            "กรุณากรอกนามสกุล",
            "error"
        );

        return;

    }


    const payload = {

        action:
            "adminUpdateStudent",

        token:
            token,

        student_id:
            studentId,

        prefix_th:
            getValue("editStudentPrefix"),

        firstname_th:
            firstnameTh,

        lastname_th:
            lastnameTh,

        firstname_en:
            getValue("editStudentFirstnameEn"),

        lastname_en:
            getValue("editStudentLastnameEn"),

        department:
            getValue("editStudentDepartment"),

        phone:
            getValue("editStudentPhone"),

        status:
            getValue("editStudentStatus") ||
            "นักศึกษาปกติ",

        issue_date:
            getValue("editStudentIssueDate"),

        expire_date:
            getValue("editStudentExpireDate"),

        photo_url:
            getValue("editStudentPhoto")

    };


    const button =
        document.getElementById(
            "updateStudentBtn"
        );


    setBusy(
        true,
        button,
        "กำลังบันทึก..."
    );


    try {

        const result =
            await apiRequest(
                payload
            );


        if (
            !result ||
            result.success !== true
        ) {

            if (
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "แก้ไขข้อมูลนักศึกษาไม่สำเร็จ"
            );

        }


        showMessage(
            "แก้ไขข้อมูลนักศึกษาสำเร็จ",
            "success"
        );


        closeStudentEditModal();


        await loadStudents();

    } catch (error) {

        console.error(
            "UPDATE STUDENT ERROR",
            error
        );


        showMessage(
            error.message ||
            "แก้ไขข้อมูลนักศึกษาไม่สำเร็จ",
            "error"
        );

    } finally {

        setBusy(
            false,
            button,
            "บันทึกการแก้ไข"
        );

    }

}


/* =========================================================
   DIRECT RESET STUDENT
========================================================= */

async function directResetStudent(studentId) {

    const id =
        String(
            studentId || ""
        ).trim();


    if (!id) {

        return;

    }


    const confirmed =
        window.confirm(
            "ต้องการรีเซ็ตรหัสผ่านนักศึกษา\n\n" +
            "รหัสนักศึกษา: " +
            id +
            "\n\n" +
            "ระบบจะใช้รหัสผ่านเริ่มต้นจาก CONFIG"
        );


    if (!confirmed) {

        return;

    }


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    try {

        showLoading(
            true
        );


        const result =
            await apiRequest({

                action:
                    "adminDirectResetStudentPassword",

                token:
                    token,

                student_id:
                    id,

                /*
                 * ถ้า Code.gs มี DEFAULT_RESET_PASSWORD
                 * และไม่ส่ง newPassword
                 * จะใช้ค่า Default จากฝั่ง Server
                 */

                newPassword:
                    ""

            });


        if (
            !result ||
            result.success !== true
        ) {

            if (
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "รีเซ็ตรหัสผ่านไม่สำเร็จ"
            );

        }


        const newPassword =
            result.password ||
            "";


        showMessage(
            newPassword
                ? (
                    "รีเซ็ตรหัสผ่านสำเร็จ\n" +
                    "รหัสผ่านใหม่: " +
                    newPassword
                )
                : "รีเซ็ตรหัสผ่านสำเร็จ",
            "success"
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

        showLoading(
            false
        );

    }

}


/* =========================================================
   MODAL STUDENT
========================================================= */

function closeStudentModal() {

    const modal =
        document.getElementById(
            "studentModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


function closeStudentEditModal() {

    const modal =
        document.getElementById(
            "studentEditModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    currentEditingStudentId =
        "";

}


/* =========================================================
   STAFF
========================================================= */

async function loadStaff() {

    const tbody =
        document.getElementById(
            "staffTableBody"
        );


    if (tbody) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-cell"
                >
                    กำลังโหลดข้อมูล Staff...
                </td>

            </tr>

        `;

    }


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    try {

        const result =
            await apiRequest({

                action:
                    "adminGetStaff",

                token:
                    token

            });


        if (
            !result ||
            result.success !== true
        ) {

            if (
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "โหลด Staff ไม่สำเร็จ"
            );

        }


        staffCache =
            Array.isArray(
                result.staff
            )
                ? result.staff
                : [];


        renderStaff();


        updateDashboardCounters();

    } catch (error) {

        console.error(
            "LOAD STAFF ERROR",
            error
        );


        staffCache = [];


        if (tbody) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="empty-cell"
                    >
                        ${escapeHtml(
                            error.message ||
                            "โหลด Staff ไม่สำเร็จ"
                        )}
                    </td>

                </tr>

            `;

        }


        showMessage(
            error.message ||
            "โหลด Staff ไม่สำเร็จ",
            "error"
        );

    }

}


/* =========================================================
   RENDER STAFF
========================================================= */

function renderStaff() {

    const tbody =
        document.getElementById(
            "staffTableBody"
        );


    if (!tbody) {

        return;

    }


    if (
        staffCache.length === 0
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
        staffCache.map(
            function (staff) {

                const id =
                    String(
                        staff.admin_id || ""
                    );


                const role =
                    String(
                        staff.role ||
                        "STAFF"
                    );


                const status =
                    String(
                        staff.status ||
                        "ACTIVE"
                    );


                return `

                    <tr>

                        <td>

                            ${escapeHtml(
                                id || "-"
                            )}

                        </td>

                        <td>

                            <strong>

                                ${escapeHtml(
                                    staff.username ||
                                    "-"
                                )}

                            </strong>

                        </td>

                        <td>

                            ${escapeHtml(
                                staff.name ||
                                "-"
                            )}

                        </td>

                        <td>

                            <span
                                class="role-badge"
                            >

                                ${escapeHtml(
                                    role
                                )}

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

                            <div
                                class="action-buttons"
                            >

                                <button
                                    type="button"
                                    class="small-btn edit-btn"
                                    data-action="edit-staff"
                                    data-id="${escapeAttr(id)}"
                                >
                                    ✏️ แก้ไข
                                </button>

                                <button
                                    type="button"
                                    class="small-btn delete-btn"
                                    data-action="delete-staff"
                                    data-id="${escapeAttr(id)}"
                                >
                                    🗑️ ลบ
                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            }
        )
        .join("");

}


/* =========================================================
   ADD STAFF
========================================================= */

function openAddStaff() {

    const form =
        document.getElementById(
            "staffForm"
        );


    if (form) {

        form.reset();

    }


    setValue(
        "staffRole",
        "STAFF"
    );


    setValue(
        "staffStatus",
        "ACTIVE"
    );


    const modal =
        document.getElementById(
            "staffModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}


async function handleAddStaff(event) {

    event.preventDefault();


    if (busy) {

        return;

    }


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const username =
        getValue("staffUsername");


    const password =
        getValue("staffPassword");


    const name =
        getValue("staffName");


    const role =
        getValue("staffRole") ||
        "STAFF";


    const status =
        getValue("staffStatus") ||
        "ACTIVE";


    if (!username) {

        showMessage(
            "กรุณากรอก Username",
            "error"
        );

        return;

    }


    if (!password) {

        showMessage(
            "กรุณากรอกรหัสผ่าน",
            "error"
        );

        return;

    }


    if (
        password.length < 4
    ) {

        showMessage(
            "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร",
            "error"
        );

        return;

    }


    if (!name) {

        showMessage(
            "กรุณากรอกชื่อ Staff",
            "error"
        );

        return;

    }


    const button =
        document.getElementById(
            "saveStaffBtn"
        );


    setBusy(
        true,
        button,
        "กำลังบันทึก..."
    );


    try {

        const result =
            await apiRequest({

                action:
                    "adminAddStaff",

                token:
                    token,

                username:
                    username,

                password:
                    password,

                name:
                    name,

                role:
                    role,

                status:
                    status

            });


        if (
            !result ||
            result.success !== true
        ) {

            if (
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "เพิ่ม Staff ไม่สำเร็จ"
            );

        }


        showMessage(
            "เพิ่ม Staff สำเร็จ",
            "success"
        );


        closeStaffModal();


        await loadStaff();


        showSection(
            "staff"
        );

    } catch (error) {

        console.error(
            "ADD STAFF ERROR",
            error
        );


        showMessage(
            error.message ||
            "เพิ่ม Staff ไม่สำเร็จ",
            "error"
        );

    } finally {

        setBusy(
            false,
            button,
            "บันทึก Staff"
        );

    }

}


/* =========================================================
   EDIT STAFF
========================================================= */

function openEditStaff(adminId) {

    const id =
        String(
            adminId || ""
        ).trim();


    if (!id) {

        showMessage(
            "ไม่พบรหัส Staff",
            "error"
        );

        return;

    }


    const staff =
        staffCache.find(
            function (item) {

                return String(
                    item.admin_id || ""
                ).trim() === id;

            }
        );


    if (!staff) {

        showMessage(
            "ไม่พบข้อมูล Staff",
            "error"
        );

        return;

    }


    currentEditingStaffId =
        id;


    setValue(
        "editStaffId",
        id
    );


    setValue(
        "editStaffUsername",
        staff.username
    );


    setValue(
        "editStaffName",
        staff.name
    );


    setValue(
        "editStaffRole",
        staff.role ||
        "STAFF"
    );


    setValue(
        "editStaffStatus",
        staff.status ||
        "ACTIVE"
    );


    const modal =
        document.getElementById(
            "staffEditModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}


/* =========================================================
   UPDATE STAFF
========================================================= */

async function handleUpdateStaff(event) {

    event.preventDefault();


    if (busy) {

        return;

    }


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const adminId =
        getValue("editStaffId") ||
        currentEditingStaffId;


    if (!adminId) {

        showMessage(
            "ไม่พบรหัส Staff",
            "error"
        );

        return;

    }


    const name =
        getValue("editStaffName");


    const role =
        getValue("editStaffRole") ||
        "STAFF";


    const status =
        getValue("editStaffStatus") ||
        "ACTIVE";


    if (!name) {

        showMessage(
            "กรุณากรอกชื่อ Staff",
            "error"
        );

        return;

    }


    const button =
        document.getElementById(
            "updateStaffBtn"
        );


    setBusy(
        true,
        button,
        "กำลังบันทึก..."
    );


    try {

        const result =
            await apiRequest({

                action:
                    "adminUpdateStaff",

                token:
                    token,

                admin_id:
                    adminId,

                name:
                    name,

                role:
                    role,

                status:
                    status

            });


        if (
            !result ||
            result.success !== true
        ) {

            if (
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "แก้ไข Staff ไม่สำเร็จ"
            );

        }


        showMessage(
            "แก้ไข Staff สำเร็จ",
            "success"
        );


        closeStaffEditModal();


        await loadStaff();

    } catch (error) {

        console.error(
            "UPDATE STAFF ERROR",
            error
        );


        showMessage(
            error.message ||
            "แก้ไข Staff ไม่สำเร็จ",
            "error"
        );

    } finally {

        setBusy(
            false,
            button,
            "บันทึกการแก้ไข"
        );

    }

}


/* =========================================================
   DELETE STAFF
========================================================= */

async function deleteStaff(adminId) {

    const id =
        String(
            adminId || ""
        ).trim();


    if (!id) {

        return;

    }


    const staff =
        staffCache.find(
            function (item) {

                return String(
                    item.admin_id || ""
                ).trim() === id;

            }
        );


    const username =
        staff
            ? staff.username || ""
            : "";


    const confirmed =
        window.confirm(
            "ต้องการลบ Staff นี้หรือไม่?\n\n" +
            "Admin ID: " +
            id +
            (
                username
                    ? "\nUsername: " + username
                    : ""
            )
        );


    if (!confirmed) {

        return;

    }


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    try {

        showLoading(
            true
        );


        const result =
            await apiRequest({

                action:
                    "adminDeleteStaff",

                token:
                    token,

                admin_id:
                    id

            });


        if (
            !result ||
            result.success !== true
        ) {

            if (
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "ลบ Staff ไม่สำเร็จ"
            );

        }


        showMessage(
            "ลบ Staff สำเร็จ",
            "success"
        );


        await loadStaff();

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

        showLoading(
            false
        );

    }

}


/* =========================================================
   STAFF MODAL
========================================================= */

function closeStaffModal() {

    const modal =
        document.getElementById(
            "staffModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


function closeStaffEditModal() {

    const modal =
        document.getElementById(
            "staffEditModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    currentEditingStaffId =
        "";

}


/* =========================================================
   PASSWORD RESET REQUESTS
========================================================= */

async function loadResetRequests() {

    const tbody =
        document.getElementById(
            "resetRequestsTableBody"
        );


    if (!tbody) {

        return;

    }


    tbody.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="empty-cell"
            >
                กำลังโหลดคำร้อง...
            </td>

        </tr>

    `;


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    try {

        const result =
            await apiRequest({

                action:
                    "adminGetResetRequests",

                token:
                    token

            });


        if (
            !result ||
            result.success !== true
        ) {

            if (
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "โหลดคำร้องไม่สำเร็จ"
            );

        }


        resetRequestsCache =
            Array.isArray(
                result.requests
            )
                ? result.requests
                : [];


        renderResetRequests();


        updateDashboardCounters();

    } catch (error) {

        console.error(
            "LOAD RESET REQUESTS ERROR",
            error
        );


        resetRequestsCache = [];


        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-cell"
                >
                    ${escapeHtml(
                        error.message ||
                        "โหลดคำร้องไม่สำเร็จ"
                    )}
                </td>

            </tr>

        `;

    }

}


/* =========================================================
   RENDER RESET REQUESTS
========================================================= */

function renderResetRequests() {

    const tbody =
        document.getElementById(
            "resetRequestsTableBody"
        );


    if (!tbody) {

        return;

    }


    if (
        resetRequestsCache.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-cell"
                >
                    ไม่มีคำร้องรีเซ็ตรหัสผ่าน
                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        resetRequestsCache.map(
            function (request) {

                const requestId =
                    String(
                        request.request_id || ""
                    );


                const studentId =
                    String(
                        request.student_id || ""
                    );


                const status =
                    String(
                        request.status || ""
                    )
                    .toUpperCase();


                let actions = "-";


                if (
                    status === "PENDING"
                ) {

                    actions = `

                        <div
                            class="action-buttons"
                        >

                            <button
                                type="button"
                                class="small-btn edit-btn"
                                data-action="reset-request"
                                data-id="${escapeAttr(requestId)}"
                            >
                                🔑 ดำเนินการ
                            </button>

                        </div>

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

                            <strong>

                                ${escapeHtml(
                                    studentId || "-"
                                )}

                            </strong>

                        </td>

                        <td>

                            ${escapeHtml(
                                request.reason ||
                                request.note ||
                                "-"
                            )}

                        </td>

                        <td>

                            ${escapeHtml(
                                formatDisplayDateTime(
                                    request.requested_at
                                )
                            )}

                        </td>

                        <td>

                            <span
                                class="status-badge ${getResetStatusClass(status)}"
                            >

                                ${escapeHtml(
                                    status || "-"
                                )}

                            </span>

                        </td>

                        <td>

                            ${actions}

                        </td>

                    </tr>

                `;

            }
        )
        .join("");

}


/* =========================================================
   OPEN RESET REQUEST
========================================================= */

function openResetRequest(requestId) {

    const id =
        String(
            requestId || ""
        ).trim();


    if (!id) {

        return;

    }


    const request =
        resetRequestsCache.find(
            function (item) {

                return String(
                    item.request_id || ""
                ).trim() === id;

            }
        );


    if (!request) {

        showMessage(
            "ไม่พบคำร้อง",
            "error"
        );

        return;

    }


    setValue(
        "resetRequestId",
        id
    );


    setValue(
        "resetStudentId",
        request.student_id
    );


    setValue(
        "newPassword",
        ""
    );


    setValue(
        "resetNote",
        ""
    );


    const modal =
        document.getElementById(
            "resetPasswordModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}


/* =========================================================
   RESET PASSWORD SUBMIT
========================================================= */

async function handleResetPasswordSubmit(event) {

    event.preventDefault();


    if (busy) {

        return;

    }


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const requestId =
        getValue("resetRequestId");


    const studentId =
        getValue("resetStudentId");


    const newPassword =
        getValue("newPassword");


    const note =
        getValue("resetNote");


    if (!requestId) {

        showMessage(
            "ไม่พบเลขที่คำร้อง",
            "error"
        );

        return;

    }


    if (!studentId) {

        showMessage(
            "ไม่พบรหัสนักศึกษา",
            "error"
        );

        return;

    }


    if (!newPassword) {

        showMessage(
            "กรุณากำหนดรหัสผ่านใหม่",
            "error"
        );

        return;

    }


    if (
        newPassword.length < 4
    ) {

        showMessage(
            "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร",
            "error"
        );

        return;

    }


    const button =
        document.getElementById(
            "confirmResetPassword"
        );


    setBusy(
        true,
        button,
        "กำลังรีเซ็ต..."
    );


    try {

        /*
         * ใช้ adminResetPassword
         * สำหรับคำร้อง PasswordResetRequests
         */

        const result =
            await apiRequest({

                action:
                    "adminResetPassword",

                token:
                    token,

                request_id:
                    requestId,

                student_id:
                    studentId,

                newPassword:
                    newPassword,

                note:
                    note

            });


        if (
            !result ||
            result.success !== true
        ) {

            if (
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "รีเซ็ตรหัสผ่านไม่สำเร็จ"
            );

        }


        showMessage(
            "รีเซ็ตรหัสผ่านสำเร็จ",
            "success"
        );


        closeResetPasswordModal();


        await Promise.allSettled([

            loadResetRequests(),

            loadStudents()

        ]);

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

        setBusy(
            false,
            button,
            "รีเซ็ตรหัสผ่าน"
        );

    }

}


/* =========================================================
   CLOSE RESET MODAL
========================================================= */

function closeResetPasswordModal() {

    const modal =
        document.getElementById(
            "resetPasswordModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


/* =========================================================
   CLOSE ALL MODALS
========================================================= */

function closeAllModals() {

    document
        .querySelectorAll(
            ".modal"
        )
        .forEach(
            function (modal) {

                modal.classList.remove(
                    "show"
                );

            }
        );

}


/* =========================================================
   LOGOUT
========================================================= */

async function handleLogout() {

    if (busy) {

        return;

    }


    const confirmed =
        window.confirm(
            "ต้องการออกจากระบบ Admin หรือไม่?"
        );


    if (!confirmed) {

        return;

    }


    const token =
        getAdminToken();


    try {

        if (token) {

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

        sessionStorage.removeItem(
            CONFIG.ADMIN_SESSION_KEY
        );

        sessionStorage.removeItem(
            CONFIG.ADMIN_KEY
        );


        window.location.replace(
            "admin-login.html"
        );

    }

}


/* =========================================================
   DASHBOARD COUNTERS
========================================================= */

function updateDashboardCounters() {

    /*
     * ไม่บังคับ เพราะ HTML แต่ละรุ่นอาจมี ID ไม่เหมือนกัน
     */

    const studentCount =
        studentsCache.length;


    const staffCount =
        staffCache.length;


    const pendingResetCount =
        resetRequestsCache.filter(
            function (item) {

                return String(
                    item.status || ""
                )
                .toUpperCase()
                ===
                "PENDING";

            }
        ).length;


    const possibleStudentIds = [

        "studentCount",
        "totalStudents",
        "dashboardStudentCount"

    ];


    const possibleStaffIds = [

        "staffCount",
        "totalStaff",
        "dashboardStaffCount"

    ];


    const possibleResetIds = [

        "pendingResetCount",
        "resetRequestCount",
        "dashboardResetCount"

    ];


    possibleStudentIds.forEach(
        function (id) {

            setText(
                id,
                studentCount
            );

        }
    );


    possibleStaffIds.forEach(
        function (id) {

            setText(
                id,
                staffCount
            );

        }
    );


    possibleResetIds.forEach(
        function (id) {

            setText(
                id,
                pendingResetCount
            );

        }
    );

}


/* =========================================================
   LOADING
========================================================= */

function showLoading(show) {

    const overlay =
        document.getElementById(
            "loadingOverlay"
        );


    if (!overlay) {

        return;

    }


    overlay.style.display =
        show
            ? "flex"
            : "none";

}


function setBusy(
    state,
    button,
    loadingText
) {

    busy =
        !!state;


    if (state) {

        showLoading(
            true
        );

    } else {

        showLoading(
            false
        );

    }


    if (!button) {

        return;

    }


    if (state) {

        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
                button.textContent;

        }


        button.disabled =
            true;


        button.textContent =
            loadingText ||
            "กำลังดำเนินการ...";

    } else {

        button.disabled =
            false;


        button.textContent =
            button.dataset.originalText ||
            button.textContent;


        delete button.dataset.originalText;

    }

}


/* =========================================================
   MESSAGE
========================================================= */

let messageTimer = null;


function showMessage(
    message,
    type
) {

    const box =
        document.getElementById(
            "messageBox"
        );


    if (!box) {

        console.log(
            "MESSAGE:",
            message
        );

        return;

    }


    if (messageTimer) {

        clearTimeout(
            messageTimer
        );

    }


    box.textContent =
        String(
            message || ""
        );


    box.className =
        "message-box";


    if (type) {

        box.classList.add(
            type
        );

    }


    if (message) {

        messageTimer =
            setTimeout(
                function () {

                    box.textContent =
                        "";

                    box.className =
                        "message-box";

                },
                6000
            );

    }

}


/* =========================================================
   DOM HELPERS
========================================================= */

function getValue(id) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return "";

    }


    return String(
        element.value || ""
    ).trim();

}


function setValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.value =
        value == null
            ? ""
            : String(value);

}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.textContent =
        value == null
            ? ""
            : String(value);

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

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


function escapeAttr(value) {

    return escapeHtml(
        value
    );

}


/* =========================================================
   DATE
========================================================= */

function convertToInputDate(value) {

    if (!value) {

        return "";

    }


    const text =
        String(value).trim();


    /*
     * yyyy-MM-dd
     */

    if (
        /^\d{4}-\d{2}-\d{2}/.test(
            text
        )
    ) {

        return text.substring(
            0,
            10
        );

    }


    /*
     * dd/MM/yyyy
     */

    const match =
        text.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
        );


    if (match) {

        const day =
            String(
                match[1]
            ).padStart(
                2,
                "0"
            );


        const month =
            String(
                match[2]
            ).padStart(
                2,
                "0"
            );


        let year =
            Number(
                match[3]
            );


        /*
         * รองรับปี พ.ศ.
         */

        if (
            year > 2400
        ) {

            year -= 543;

        }


        return (

            String(year) +
            "-" +
            month +
            "-" +
            day

        );

    }


    return "";

}


function formatDisplayDate(value) {

    if (!value) {

        return "-";

    }


    const text =
        String(value).trim();


    if (
        /^\d{4}-\d{2}-\d{2}/.test(
            text
        )
    ) {

        const parts =
            text
                .substring(
                    0,
                    10
                )
                .split("-");


        return (

            parts[2] +
            "/" +
            parts[1] +
            "/" +
            parts[0]

        );

    }


    if (
        /^\d{1,2}\/\d{1,2}\/\d{4}/.test(
            text
        )
    ) {

        return text.substring(
            0,
            10
        );

    }


    return text;

}


function formatDisplayDateTime(value) {

    if (!value) {

        return "-";

    }


    return String(
        value
    );

}


/* =========================================================
   STATUS
========================================================= */

function getStatusClass(status) {

    const value =
        String(
            status || ""
        )
        .trim()
        .toUpperCase();


    if (
        value === "ACTIVE"
        ||
        value === "นักศึกษาปกติ"
    ) {

        return "status-active";

    }


    if (
        value === "INACTIVE"
    ) {

        return "status-inactive";

    }


    if (
        value === "SUSPENDED"
    ) {

        return "status-suspended";

    }


    return "status-default";

}


function getResetStatusClass(status) {

    const value =
        String(
            status || ""
        )
        .trim()
        .toUpperCase();


    if (
        value === "PENDING"
    ) {

        return "status-pending";

    }


    if (
        value === "RESET"
        ||
        value === "APPROVED"
    ) {

        return "status-active";

    }


    if (
        value === "REJECTED"
    ) {

        return "status-inactive";

    }


    return "status-default";

}


/* =========================================================
   GLOBAL FUNCTIONS
   รองรับ HTML รุ่นเก่าที่อาจเรียกผ่าน onclick
========================================================= */

window.loadStudents =
    loadStudents;


window.loadStaff =
    loadStaff;


window.loadResetRequests =
    loadResetRequests;


window.openAddStudent =
    openAddStudent;


window.openEditStudent =
    openEditStudent;


window.openAddStaff =
    openAddStaff;


window.openEditStaff =
    openEditStaff;


window.directResetStudent =
    directResetStudent;


window.openResetRequest =
    openResetRequest;


window.closeStudentModal =
    closeStudentModal;


window.closeStudentEditModal =
    closeStudentEditModal;


window.closeStaffModal =
    closeStaffModal;


window.closeStaffEditModal =
    closeStaffEditModal;


window.closeResetPasswordModal =
    closeResetPasswordModal;


window.handleLogout =
    handleLogout;


/************************************************************
 * END ADMIN DASHBOARD JS
 ************************************************************/
