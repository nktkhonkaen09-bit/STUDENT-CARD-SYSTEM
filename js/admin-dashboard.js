/*******************************************************
 * STUDENT CARD SYSTEM
 * ADMIN DASHBOARD
 *
 * FILE:
 *   js/admin-dashboard.js
 *
 * ใช้ร่วมกับ:
 *   - config.js
 *   - admin-dashboard.html
 *   - Code.gs
 *
 * รองรับ:
 *
 * STUDENT
 *   - adminGetStudents
 *   - adminAddStudent
 *   - adminUpdateStudent
 *   - adminDirectResetStudentPassword
 *
 * PASSWORD RESET
 *   - adminGetResetRequests
 *   - adminApproveReset
 *   - adminRejectReset
 *   - adminResetPassword
 *
 * STAFF
 *   - adminGetStaff
 *   - adminAddStaff
 *   - adminUpdateStaff
 *   - adminDeleteStaff
 *
 * SYSTEM
 *   - adminLogout
 *******************************************************/

"use strict";


/* =====================================================
   GLOBAL STATE
===================================================== */

let studentsCache = [];
let staffCache = [];
let resetRequestsCache = [];

let currentSection = "dashboard";

let currentEditStudentId = "";
let currentEditStaffId = "";

let currentResetMode = "direct";
let currentResetRequestId = "";

let isInitializing = false;


/* =====================================================
   DOM READY
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "ADMIN DASHBOARD JS READY"
        );

        /*
         * ตรวจ CONFIG
         */

        if (
            typeof CONFIG === "undefined"
        ) {

            console.error(
                "CONFIG NOT FOUND"
            );

            showMessage(
                "ไม่พบ CONFIG กรุณาตรวจสอบ js/config.js",
                "error"
            );

            return;
        }


        /*
         * ตรวจ API
         */

        if (
            !CONFIG.API_URL
        ) {

            console.error(
                "CONFIG.API_URL NOT FOUND"
            );

            showMessage(
                "ไม่พบ API_URL",
                "error"
            );

            return;
        }


        /*
         * ผูก Event
         */

        bindAllEvents();


        /*
         * ตรวจ Session
         */

        checkAdminSession();

    }
);


/* =====================================================
   BIND ALL EVENTS
===================================================== */

function bindAllEvents() {

    console.log(
        "BIND ADMIN DASHBOARD EVENTS"
    );


    /*
     * Sidebar
     */

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const section =
                            button.getAttribute(
                                "data-section"
                            );

                        if (section) {

                            switchSection(
                                section
                            );

                        }

                    }
                );

            }
        );


    /*
     * Quick Action
     */

    document
        .querySelectorAll(
            ".quick-action"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const section =
                            button.getAttribute(
                                "data-section"
                            );

                        if (section) {

                            switchSection(
                                section
                            );

                        }

                    }
                );

            }
        );


    /*
     * Mobile Sidebar
     */

    const sidebarToggle =
        document.getElementById(
            "sidebarToggle"
        );


    if (sidebarToggle) {

        sidebarToggle.addEventListener(
            "click",
            function () {

                const sidebar =
                    document.getElementById(
                        "adminSidebar"
                    );

                const overlay =
                    document.getElementById(
                        "sidebarOverlay"
                    );


                if (sidebar) {

                    sidebar.classList.toggle(
                        "open"
                    );

                }


                if (overlay) {

                    overlay.classList.toggle(
                        "show"
                    );

                }

            }
        );

    }


    const sidebarOverlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (sidebarOverlay) {

        sidebarOverlay.addEventListener(
            "click",
            closeMobileSidebar
        );

    }


    /*
     * Logout
     */

    bindClick(
        "logoutBtn",
        handleLogout
    );


    /*
     * Student Search
     */

    const studentSearch =
        document.getElementById(
            "studentSearch"
        );


    if (studentSearch) {

        studentSearch.addEventListener(
            "input",
            function () {

                renderStudents(
                    studentSearch.value
                );

            }
        );

    }


    /*
     * Refresh Students
     */

    bindClick(
        "refreshStudentsBtn",
        loadStudents
    );


    /*
     * Add Student Button
     */

    bindClick(
        "addStudentBtn",
        function () {

            switchSection(
                "add-student"
            );

            resetStudentAddForm();

        }
    );


    /*
     * Student Add Form
     */

    const studentForm =
        document.getElementById(
            "studentForm"
        );


    if (studentForm) {

        studentForm.addEventListener(
            "submit",
            handleAddStudent
        );


        studentForm.addEventListener(
            "reset",
            function () {

                setTimeout(
                    function () {

                        resetStudentAddForm();

                    },
                    0
                );

            }
        );

    }


    /*
     * Refresh Reset Requests
     */

    bindClick(
        "refreshResetBtn",
        loadResetRequests
    );


    /*
     * Add Staff
     */

    bindClick(
        "addStaffBtn",
        function () {

            switchSection(
                "add-staff"
            );

            resetStaffAddForm();

        }
    );


    /*
     * Refresh Staff
     */

    bindClick(
        "refreshStaffBtn",
        loadStaff
    );


    /*
     * Staff Form
     */

    const staffForm =
        document.getElementById(
            "staffForm"
        );


    if (staffForm) {

        staffForm.addEventListener(
            "submit",
            handleAddStaff
        );


        staffForm.addEventListener(
            "reset",
            function () {

                setTimeout(
                    function () {

                        resetStaffAddForm();

                    },
                    0
                );

            }
        );

    }


    /*
     * Student Edit Modal
     */

    bindClick(
        "closeStudentEditModal",
        closeStudentEditModal
    );


    bindClick(
        "cancelStudentEdit",
        closeStudentEditModal
    );


    const studentEditForm =
        document.getElementById(
            "studentEditForm"
        );


    if (studentEditForm) {

        studentEditForm.addEventListener(
            "submit",
            handleUpdateStudent
        );

    }


    /*
     * Reset Password Modal
     */

    bindClick(
        "closeResetPasswordModal",
        closeResetPasswordModal
    );


    bindClick(
        "cancelResetPassword",
        closeResetPasswordModal
    );


    const resetPasswordForm =
        document.getElementById(
            "resetPasswordForm"
        );


    if (resetPasswordForm) {

        resetPasswordForm.addEventListener(
            "submit",
            handleResetPasswordSubmit
        );

    }


    /*
     * Staff Edit Modal
     */

    bindClick(
        "closeStaffEditModal",
        closeStaffEditModal
    );


    bindClick(
        "cancelStaffEdit",
        closeStaffEditModal
    );


    const staffEditForm =
        document.getElementById(
            "staffEditForm"
        );


    if (staffEditForm) {

        staffEditForm.addEventListener(
            "submit",
            handleUpdateStaff
        );

    }


    /*
     * Modal backdrop
     */

    [
        "studentEditModal",
        "resetPasswordModal",
        "staffEditModal"
    ]
    .forEach(
        function (modalId) {

            const modal =
                document.getElementById(
                    modalId
                );


            if (!modal) {

                return;

            }


            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        modal
                    ) {

                        modal.classList.remove(
                            "show"
                        );

                    }

                }
            );

        }
    );


    /*
     * Dynamic buttons
     *
     * นักศึกษา
     * Staff
     * Reset Request
     *
     * ใช้ Event Delegation
     */

    document.addEventListener(
        "click",
        handleDynamicButtonClick
    );

}


/* =====================================================
   DYNAMIC BUTTON CLICK
===================================================== */

function handleDynamicButtonClick(
    event
) {

    /*
     * Student buttons
     */

    const studentButton =
        event.target.closest(
            "[data-action]"
        );


    if (studentButton) {

        const action =
            studentButton.getAttribute(
                "data-action"
            );


        const id =
            studentButton.getAttribute(
                "data-id"
            );


        if (
            action ===
            "edit-student"
        ) {

            event.preventDefault();

            openStudentEditModal(
                id
            );

            return;

        }


        if (
            action ===
            "direct-reset-student"
        ) {

            event.preventDefault();

            openDirectResetModal(
                id
            );

            return;

        }

    }


    /*
     * Staff buttons
     */

    const staffButton =
        event.target.closest(
            "[data-staff-action]"
        );


    if (staffButton) {

        const action =
            staffButton.getAttribute(
                "data-staff-action"
            );


        const adminId =
            staffButton.getAttribute(
                "data-staff-id"
            );


        const username =
            staffButton.getAttribute(
                "data-staff-username"
            );


        if (
            action ===
            "edit"
        ) {

            event.preventDefault();

            openStaffEditModal(
                adminId,
                username
            );

            return;

        }


        if (
            action ===
            "delete"
        ) {

            event.preventDefault();

            deleteStaff(
                adminId,
                username
            );

            return;

        }

    }


    /*
     * Password Reset Request
     */

    const resetButton =
        event.target.closest(
            "[data-reset-action]"
        );


    if (resetButton) {

        const action =
            resetButton.getAttribute(
                "data-reset-action"
            );


        const requestId =
            resetButton.getAttribute(
                "data-request-id"
            );


        event.preventDefault();


        handleResetRequestAction(
            action,
            requestId
        );

    }

}


/* =====================================================
   ADMIN SESSION
===================================================== */

async function checkAdminSession() {

    const token =
        getAdminToken();


    if (!token) {

        redirectToLogin();

        return;

    }


    loadAdminDisplay();


    if (isInitializing) {

        return;

    }


    isInitializing = true;


    setLoading(
        true
    );


    try {

        /*
         * โหลดนักศึกษา
         * ใช้ตรวจ Session ด้วย
         */

        const studentResult =
            await apiRequest({

                action:
                    "adminGetStudents",

                token:
                    token

            });


        if (
            !studentResult ||
            !studentResult.success
        ) {

            if (
                isSessionExpired(
                    studentResult
                )
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                studentResult &&
                studentResult.message
                    ? studentResult.message
                    : "ไม่สามารถตรวจสอบ Admin Session ได้"
            );

        }


        studentsCache =
            Array.isArray(
                studentResult.students
            )
                ? studentResult.students
                : [];


        renderStudents();


        /*
         * โหลด Staff
         */

        await loadStaff(
            true
        );


        /*
         * โหลด Reset Requests
         */

        await loadResetRequests(
            true
        );


        /*
         * Update Dashboard
         */

        updateDashboardStats();


    } catch (error) {

        console.error(
            "ADMIN DASHBOARD INIT ERROR",
            error
        );


        showMessage(
            error.message ||
            "ไม่สามารถโหลด Admin Dashboard ได้",
            "error"
        );

    } finally {

        setLoading(
            false
        );

        isInitializing =
            false;

    }

}


/* =====================================================
   ADMIN DISPLAY
===================================================== */

function loadAdminDisplay() {

    const raw =
        sessionStorage.getItem(
            CONFIG.ADMIN_KEY
        );


    if (!raw) {

        return;

    }


    try {

        const admin =
            JSON.parse(
                raw
            );


        const name =
            admin.name ||
            admin.username ||
            "Admin";


        const role =
            admin.role ||
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


    } catch (error) {

        console.error(
            "ADMIN DISPLAY ERROR",
            error
        );

    }

}


/* =====================================================
   API REQUEST
===================================================== */

async function apiRequest(
    data
) {

    if (
        !CONFIG ||
        !CONFIG.API_URL
    ) {

        throw new Error(
            "ไม่พบ API_URL"
        );

    }


    console.log(
        "ADMIN API REQUEST:",
        data.action,
        data
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
                            data
                        )
                }
            );

    } catch (error) {

        console.error(
            "FETCH ERROR:",
            error
        );

        throw new Error(
            "ไม่สามารถเชื่อมต่อ Google Apps Script API ได้"
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


    if (!text) {

        throw new Error(
            "API ไม่ส่งข้อมูลกลับมา"
        );

    }


    let result;


    try {

        result =
            JSON.parse(
                text
            );

    } catch (error) {

        console.error(
            "INVALID API JSON:",
            text
        );

        throw new Error(
            "API ส่งข้อมูลกลับมาไม่ใช่ JSON"
        );

    }


    console.log(
        "ADMIN API:",
        data.action,
        result
    );


    return result;

}


/* =====================================================
   SESSION HELPERS
===================================================== */

function getAdminToken() {

    return sessionStorage.getItem(
        CONFIG.ADMIN_SESSION_KEY
    );

}


function isSessionExpired(
    result
) {

    if (!result) {

        return false;

    }


    return (
        result.code ===
        "ADMIN_SESSION_EXPIRED"
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


/* =====================================================
   SECTION NAVIGATION
===================================================== */

function switchSection(
    section
) {

    const validSections = [
        "dashboard",
        "students",
        "add-student",
        "reset-password",
        "staff",
        "add-staff"
    ];


    if (
        validSections.indexOf(
            section
        ) === -1
    ) {

        console.warn(
            "UNKNOWN SECTION:",
            section
        );

        return;

    }


    currentSection =
        section;


    document
        .querySelectorAll(
            ".admin-section"
        )
        .forEach(
            function (element) {

                element.classList.remove(
                    "active"
                );

            }
        );


    const target =
        document.getElementById(
            "section-" +
            section
        );


    if (target) {

        target.classList.add(
            "active"
        );

    }


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            function (button) {

                button.classList.toggle(
                    "active",
                    button.getAttribute(
                        "data-section"
                    ) === section
                );

            }
        );


    const info =
        getSectionInfo(
            section
        );


    setText(
        "pageTitle",
        info.title
    );


    setText(
        "pageSubtitle",
        info.subtitle
    );


    /*
     * โหลดข้อมูลตามเมนู
     */

    if (
        section ===
        "dashboard"
    ) {

        updateDashboardStats();

    }


    if (
        section ===
        "students"
    ) {

        loadStudents();

    }


    if (
        section ===
        "reset-password"
    ) {

        loadResetRequests();

    }


    if (
        section ===
        "staff"
    ) {

        loadStaff();

    }


    closeMobileSidebar();

}


function getSectionInfo(
    section
) {

    const map = {

        dashboard: {

            title:
                "Dashboard",

            subtitle:
                "ภาพรวมระบบ"

        },


        students: {

            title:
                "ข้อมูลนักศึกษา",

            subtitle:
                "ค้นหา แก้ไข และจัดการข้อมูลนักศึกษา"

        },


        "add-student": {

            title:
                "เพิ่มนักศึกษา",

            subtitle:
                "สร้างบัญชีนักศึกษาใหม่เข้าสู่ระบบ"

        },


        "reset-password": {

            title:
                "รีเซ็ตรหัสผ่าน",

            subtitle:
                "ตรวจสอบและจัดการคำร้องลืมรหัสผ่าน"

        },


        staff: {

            title:
                "จัดการ Staff",

            subtitle:
                "จัดการบัญชีผู้ดูแลระบบและเจ้าหน้าที่"

        },


        "add-staff": {

            title:
                "เพิ่ม Staff",

            subtitle:
                "สร้างบัญชี Staff ใหม่เข้าสู่ระบบ"

        }

    };


    return (
        map[section] ||
        map.dashboard
    );

}


/* =====================================================
   STUDENTS - LOAD
===================================================== */

async function loadStudents(
    silent
) {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    if (!silent) {

        renderStudentLoading();

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
            !result.success
        ) {

            if (
                isSessionExpired(
                    result
                )
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
            getValue(
                "studentSearch"
            )
        );


        updateDashboardStats();


    } catch (error) {

        console.error(
            "LOAD STUDENTS ERROR:",
            error
        );


        renderTableError(
            "studentsTableBody",
            9,
            error.message ||
            "ไม่สามารถโหลดข้อมูลนักศึกษาได้"
        );


        showMessage(
            error.message ||
            "ไม่สามารถโหลดข้อมูลนักศึกษาได้",
            "error"
        );

    }

}


/* =====================================================
   STUDENTS - RENDER
===================================================== */

function renderStudents(
    searchText
) {

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


                    return (
                        text.indexOf(
                            search
                        ) !== -1
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
        String(
            student.student_id || ""
        );


    const fullName =
        [

            student.prefix_th,

            student.firstname_th,

            student.lastname_th

        ]
        .filter(
            Boolean
        )
        .join(" ");


    const englishName =
        [

            student.firstname_en,

            student.lastname_en

        ]
        .filter(
            Boolean
        )
        .join(" ");


    const status =
        student.status ||
        "นักศึกษาปกติ";


    return `

        <tr>

            <td data-label="รหัสนักศึกษา">

                <strong>
                    ${escapeHtml(
                        studentId || "-"
                    )}
                </strong>

            </td>


            <td data-label="ชื่อ-นามสกุล">

                ${escapeHtml(
                    fullName || "-"
                )}

            </td>


            <td data-label="English Name">

                ${escapeHtml(
                    englishName || "-"
                )}

            </td>


            <td data-label="แผนก">

                ${escapeHtml(
                    student.department ||
                    "-"
                )}

            </td>


            <td data-label="โทรศัพท์">

                ${escapeHtml(
                    student.phone ||
                    "-"
                )}

            </td>


            <td data-label="สถานะ">

                <span
                    class="status-badge ${statusClass(status)}"
                >

                    ${escapeHtml(
                        status
                    )}

                </span>

            </td>


            <td data-label="วันออกบัตร">

                ${escapeHtml(
                    formatDate(
                        student.issue_date
                    )
                )}

            </td>


            <td data-label="วันหมดอายุ">

                ${escapeHtml(
                    formatDate(
                        student.expire_date
                    )
                )}

            </td>


            <td data-label="จัดการ">

                <div class="action-buttons">

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


/* =====================================================
   ADD STUDENT
===================================================== */

async function handleAddStudent(
    event
) {

    event.preventDefault();


    console.log(
        "HANDLE ADD STUDENT"
    );


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const data = {

        action:
            "adminAddStudent",

        token:
            token,

        student_id:
            getValue(
                "studentId"
            ),

        password:
            getValue(
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

        department:
            getValue(
                "studentDepartment"
            ),

        phone:
            getValue(
                "studentPhone"
            ),

        status:
            getValue(
                "studentStatus"
            ) ||
            "นักศึกษาปกติ",

        issue_date:
            getValue(
                "studentIssueDate"
            ),

        expire_date:
            getValue(
                "studentExpireDate"
            ),

        photo_url:
            getValue(
                "studentPhoto"
            )

    };


    /*
     * Validation
     */

    if (!data.student_id) {

        showMessage(
            "กรุณากรอกรหัสนักศึกษา",
            "error"
        );

        focusInput(
            "studentId"
        );

        return;

    }


    if (!data.password) {

        showMessage(
            "กรุณากรอกรหัสผ่านเริ่มต้น",
            "error"
        );

        focusInput(
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

        focusInput(
            "studentPassword"
        );

        return;

    }


    if (!data.firstname_th) {

        showMessage(
            "กรุณากรอกชื่อ",
            "error"
        );

        focusInput(
            "studentFirstnameTh"
        );

        return;

    }


    if (!data.lastname_th) {

        showMessage(
            "กรุณากรอกนามสกุล",
            "error"
        );

        focusInput(
            "studentLastnameTh"
        );

        return;

    }


    const button =
        document.getElementById(
            "saveStudentBtn"
        );


    setButtonLoading(
        button,
        true,
        "กำลังบันทึก..."
    );


    setLoading(
        true
    );


    try {

        console.log(
            "ADD STUDENT DATA:",
            data
        );


        const result =
            await apiRequest(
                data
            );


        if (
            !result ||
            !result.success
        ) {

            if (
                isSessionExpired(
                    result
                )
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
            result.message ||
            "เพิ่มนักศึกษาสำเร็จ",
            "success"
        );


        resetStudentAddForm();


        await loadStudents(
            true
        );


        switchSection(
            "students"
        );


    } catch (error) {

        console.error(
            "ADD STUDENT ERROR:",
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
            "บันทึกนักศึกษา"
        );


        setLoading(
            false
        );

    }

}


/* =====================================================
   RESET ADD STUDENT FORM
===================================================== */

function resetStudentAddForm() {

    const form =
        document.getElementById(
            "studentForm"
        );


    if (form) {

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


/* =====================================================
   EDIT STUDENT - OPEN
===================================================== */

function openStudentEditModal(
    studentId
) {

    console.log(
        "OPEN STUDENT EDIT:",
        studentId
    );


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
                ).trim()
                ===
                id;

            }
        );


    if (!student) {

        showMessage(
            "ไม่พบข้อมูลนักศึกษา " +
            id,
            "error"
        );

        /*
         * ลองโหลดใหม่แล้วค้นหาอีกครั้ง
         */

        loadStudents();

        return;

    }


    currentEditStudentId =
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
        toInputDate(
            student.issue_date
        )
    );


    setValue(
        "editStudentExpireDate",
        toInputDate(
            student.expire_date
        )
    );


    setValue(
        "editStudentPhoto",
        student.photo_url
    );


    showModal(
        "studentEditModal"
    );

}


/* =====================================================
   UPDATE STUDENT
===================================================== */

async function handleUpdateStudent(
    event
) {

    event.preventDefault();


    console.log(
        "HANDLE UPDATE STUDENT"
    );


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const studentId =
        String(
            currentEditStudentId ||
            getValue(
                "editStudentId"
            ) ||
            ""
        ).trim();


    if (!studentId) {

        showMessage(
            "ไม่พบรหัสนักศึกษาสำหรับแก้ไข",
            "error"
        );

        return;

    }


    const data = {

        action:
            "adminUpdateStudent",

        token:
            token,

        student_id:
            studentId,

        prefix_th:
            getValue(
                "editStudentPrefix"
            ),

        firstname_th:
            getValue(
                "editStudentFirstnameTh"
            ),

        lastname_th:
            getValue(
                "editStudentLastnameTh"
            ),

        firstname_en:
            getValue(
                "editStudentFirstnameEn"
            ),

        lastname_en:
            getValue(
                "editStudentLastnameEn"
            ),

        department:
            getValue(
                "editStudentDepartment"
            ),

        phone:
            getValue(
                "editStudentPhone"
            ),

        status:
            getValue(
                "editStudentStatus"
            ) ||
            "นักศึกษาปกติ",

        issue_date:
            getValue(
                "editStudentIssueDate"
            ),

        expire_date:
            getValue(
                "editStudentExpireDate"
            ),

        photo_url:
            getValue(
                "editStudentPhoto"
            )

    };


    if (!data.firstname_th) {

        showMessage(
            "กรุณากรอกชื่อ",
            "error"
        );

        focusInput(
            "editStudentFirstnameTh"
        );

        return;

    }


    if (!data.lastname_th) {

        showMessage(
            "กรุณากรอกนามสกุล",
            "error"
        );

        focusInput(
            "editStudentLastnameTh"
        );

        return;

    }


    const button =
        document.getElementById(
            "updateStudentBtn"
        );


    setButtonLoading(
        button,
        true,
        "กำลังบันทึก..."
    );


    setLoading(
        true
    );


    try {

        console.log(
            "UPDATE STUDENT DATA:",
            data
        );


        const result =
            await apiRequest(
                data
            );


        if (
            !result ||
            !result.success
        ) {

            if (
                isSessionExpired(
                    result
                )
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
            result.message ||
            "แก้ไขข้อมูลนักศึกษาสำเร็จ",
            "success"
        );


        closeStudentEditModal();


        await loadStudents(
            true
        );


    } catch (error) {

        console.error(
            "UPDATE STUDENT ERROR:",
            error
        );


        showMessage(
            error.message ||
            "แก้ไขข้อมูลนักศึกษาไม่สำเร็จ",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "บันทึกการแก้ไข"
        );


        setLoading(
            false
        );

    }

}


/* =====================================================
   CLOSE STUDENT EDIT
===================================================== */

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


    currentEditStudentId =
        "";

}


/* =====================================================
   DIRECT PASSWORD RESET
===================================================== */

function openDirectResetModal(
    studentId
) {

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


    currentResetMode =
        "direct";


    currentResetRequestId =
        "";


    setValue(
        "resetRequestId",
        ""
    );


    setValue(
        "resetStudentId",
        id
    );


    setValue(
        "newPassword",
        "123456"
    );


    setValue(
        "resetNote",
        "Admin รีเซ็ตรหัสผ่านโดยตรง"
    );


    showModal(
        "resetPasswordModal"
    );

}


/* =====================================================
   RESET REQUEST MODAL
===================================================== */

function openResetRequestModal(
    request
) {

    if (!request) {

        return;

    }


    currentResetMode =
        "request";


    currentResetRequestId =
        String(
            request.request_id || ""
        ).trim();


    setValue(
        "resetRequestId",
        currentResetRequestId
    );


    setValue(
        "resetStudentId",
        request.student_id || ""
    );


    setValue(
        "newPassword",
        "123456"
    );


    setValue(
        "resetNote",
        request.note ||
        "รีเซ็ตรหัสผ่านสำเร็จ"
    );


    showModal(
        "resetPasswordModal"
    );

}


/* =====================================================
   RESET PASSWORD SUBMIT
===================================================== */

async function handleResetPasswordSubmit(
    event
) {

    event.preventDefault();


    console.log(
        "HANDLE RESET PASSWORD:",
        currentResetMode
    );


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const studentId =
        getValue(
            "resetStudentId"
        );


    const newPassword =
        getValue(
            "newPassword"
        );


    const note =
        getValue(
            "resetNote"
        );


    if (!studentId) {

        showMessage(
            "ไม่พบรหัสนักศึกษา",
            "error"
        );

        return;

    }


    if (!newPassword) {

        showMessage(
            "กรุณากรอกรหัสผ่านใหม่",
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


    const data = {

        action:
            "adminDirectResetStudentPassword",

        token:
            token,

        student_id:
            studentId,

        newPassword:
            newPassword,

        note:
            note

    };


    /*
     * ถ้ามาจาก PasswordResetRequests
     */

    if (
        currentResetMode ===
        "request"
    ) {

        if (
            !currentResetRequestId
        ) {

            showMessage(
                "ไม่พบเลขที่คำร้อง",
                "error"
            );

            return;

        }


        data.action =
            "adminResetPassword";


        data.request_id =
            currentResetRequestId;

    }


    const button =
        document.getElementById(
            "confirmResetPassword"
        );


    setButtonLoading(
        button,
        true,
        "กำลังรีเซ็ต..."
    );


    setLoading(
        true
    );


    try {

        console.log(
            "RESET PASSWORD DATA:",
            data
        );


        const result =
            await apiRequest(
                data
            );


        if (
            !result ||
            !result.success
        ) {

            if (
                isSessionExpired(
                    result
                )
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
            result.message ||
            "รีเซ็ตรหัสผ่านสำเร็จ",
            "success"
        );


        closeResetPasswordModal();


        await loadStudents(
            true
        );


        await loadResetRequests(
            true
        );


    } catch (error) {

        console.error(
            "RESET PASSWORD ERROR:",
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
            "รีเซ็ตรหัสผ่าน"
        );


        setLoading(
            false
        );

    }

}


/* =====================================================
   CLOSE RESET MODAL
===================================================== */

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


    currentResetMode =
        "direct";


    currentResetRequestId =
        "";

}


/* =====================================================
   LOAD RESET REQUESTS
===================================================== */

async function loadResetRequests(
    silent
) {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const tbody =
        document.getElementById(
            "resetRequestsTableBody"
        );


    if (
        tbody &&
        !silent
    ) {

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
            !result.success
        ) {

            if (
                isSessionExpired(
                    result
                )
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


        updateDashboardStats();


    } catch (error) {

        console.error(
            "LOAD RESET REQUESTS ERROR:",
            error
        );


        renderTableError(
            "resetRequestsTableBody",
            6,
            error.message ||
            "ไม่สามารถโหลดคำร้องได้"
        );

    }

}


/* =====================================================
   RENDER RESET REQUESTS
===================================================== */

function renderResetRequests() {

    const tbody =
        document.getElementById(
            "resetRequestsTableBody"
        );


    if (!tbody) {

        return;

    }


    if (
        resetRequestsCache.length ===
        0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-cell"
                >

                    ไม่พบคำร้องรีเซ็ตรหัสผ่าน

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        resetRequestsCache
            .map(
                createResetRequestRow
            )
            .join("");

}


function createResetRequestRow(
    request
) {

    const status =
        String(
            request.status || ""
        )
        .trim()
        .toUpperCase();


    let actions = "";


    if (
        status ===
        "PENDING"
    ) {

        actions = `

            <button
                type="button"
                class="small-btn edit-btn"
                data-reset-action="approve"
                data-request-id="${escapeAttr(
                    request.request_id
                )}"
            >
                ✓ อนุมัติ
            </button>


            <button
                type="button"
                class="small-btn reset-btn"
                data-reset-action="reject"
                data-request-id="${escapeAttr(
                    request.request_id
                )}"
            >
                ✕ ปฏิเสธ
            </button>

        `;

    }


    else if (
        status ===
        "APPROVED"
    ) {

        actions = `

            <button
                type="button"
                class="small-btn reset-btn"
                data-reset-action="reset"
                data-request-id="${escapeAttr(
                    request.request_id
                )}"
            >
                🔑 รีเซ็ตรหัสผ่าน
            </button>

        `;

    }


    else if (
        status ===
        "RESET"
    ) {

        actions = `

            <span class="muted-text">
                ดำเนินการแล้ว
            </span>

        `;

    }


    else {

        actions = `

            <span class="muted-text">
                -
            </span>

        `;

    }


    return `

        <tr>

            <td data-label="เลขที่คำร้อง">

                <strong>
                    ${escapeHtml(
                        request.request_id ||
                        "-"
                    )}
                </strong>

            </td>


            <td data-label="รหัสนักศึกษา">

                ${escapeHtml(
                    request.student_id ||
                    "-"
                )}

            </td>


            <td data-label="เหตุผล">

                ${escapeHtml(
                    request.reason ||
                    request.note ||
                    "-"
                )}

            </td>


            <td data-label="วันที่ร้องขอ">

                ${escapeHtml(
                    formatDateTime(
                        request.requested_at
                    )
                )}

            </td>


            <td data-label="สถานะ">

                <span
                    class="status-badge ${statusClass(status)}"
                >

                    ${escapeHtml(
                        status ||
                        "-"
                    )}

                </span>

            </td>


            <td data-label="ดำเนินการ">

                <div class="action-buttons">

                    ${actions}

                </div>

            </td>

        </tr>

    `;

}


/* =====================================================
   HANDLE RESET REQUEST ACTION
===================================================== */

async function handleResetRequestAction(
    action,
    requestId
) {

    const id =
        String(
            requestId || ""
        ).trim();


    if (!id) {

        showMessage(
            "ไม่พบเลขที่คำร้อง",
            "error"
        );

        return;

    }


    const request =
        resetRequestsCache.find(
            function (item) {

                return String(
                    item.request_id || ""
                ).trim()
                ===
                id;

            }
        );


    if (!request) {

        showMessage(
            "ไม่พบคำร้อง",
            "error"
        );

        return;

    }


    /*
     * APPROVE
     */

    if (
        action ===
        "approve"
    ) {

        const ok =
            confirm(
                "ต้องการอนุมัติคำร้องนี้หรือไม่?\n\n" +
                "รหัสนักศึกษา: " +
                request.student_id
            );


        if (!ok) {

            return;

        }


        await processResetRequest(
            "adminApproveReset",
            id,
            "อนุมัติคำร้องสำเร็จ",
            ""
        );


        return;

    }


    /*
     * REJECT
     */

    if (
        action ===
        "reject"
    ) {

        const note =
            prompt(
                "ระบุเหตุผลที่ปฏิเสธคำร้อง (ไม่บังคับ)"
            );


        if (
            note === null
        ) {

            return;

        }


        await processResetRequest(
            "adminRejectReset",
            id,
            "ปฏิเสธคำร้องสำเร็จ",
            note
        );


        return;

    }


    /*
     * RESET
     */

    if (
        action ===
        "reset"
    ) {

        openResetRequestModal(
            request
        );

    }

}


/* =====================================================
   PROCESS RESET REQUEST
===================================================== */

async function processResetRequest(
    action,
    requestId,
    successText,
    note
) {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    setLoading(
        true
    );


    try {

        const result =
            await apiRequest({

                action:
                    action,

                token:
                    token,

                request_id:
                    requestId,

                note:
                    note || ""

            });


        if (
            !result ||
            !result.success
        ) {

            if (
                isSessionExpired(
                    result
                )
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "ดำเนินการไม่สำเร็จ"
            );

        }


        showMessage(
            result.message ||
            successText,
            "success"
        );


        await loadResetRequests(
            true
        );


        updateDashboardStats();


    } catch (error) {

        console.error(
            "RESET REQUEST ACTION ERROR:",
            error
        );


        showMessage(
            error.message ||
            "ดำเนินการไม่สำเร็จ",
            "error"
        );

    } finally {

        setLoading(
            false
        );

    }

}


/* =====================================================
   STAFF - LOAD
===================================================== */

async function loadStaff(
    silent
) {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const tbody =
        document.getElementById(
            "staffTableBody"
        );


    if (
        tbody &&
        !silent
    ) {

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
            !result.success
        ) {

            if (
                isSessionExpired(
                    result
                )
            ) {

                handleSessionExpired();

                return;

            }


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


    } catch (error) {

        console.error(
            "LOAD STAFF ERROR:",
            error
        );


        renderTableError(
            "staffTableBody",
            6,
            error.message ||
            "ไม่สามารถโหลดข้อมูล Staff ได้"
        );

    }

}


/* =====================================================
   STAFF - RENDER
===================================================== */

function renderStaff() {

    const tbody =
        document.getElementById(
            "staffTableBody"
        );


    if (!tbody) {

        return;

    }


    if (
        staffCache.length ===
        0
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
        staffCache
            .map(
                createStaffRow
            )
            .join("");

}


function createStaffRow(
    staff
) {

    const adminId =
        String(
            staff.admin_id ||
            staff.adminId ||
            ""
        ).trim();


    const username =
        String(
            staff.username ||
            ""
        ).trim();


    const name =
        staff.name ||
        "-";


    const role =
        staff.role ||
        "STAFF";


    const status =
        staff.status ||
        "ACTIVE";


    return `

        <tr>

            <td data-label="Admin ID">

                ${escapeHtml(
                    adminId ||
                    "-"
                )}

            </td>


            <td data-label="Username">

                <strong>

                    ${escapeHtml(
                        username ||
                        "-"
                    )}

                </strong>

            </td>


            <td data-label="ชื่อ">

                ${escapeHtml(
                    name
                )}

            </td>


            <td data-label="Role">

                <span
                    class="role-badge"
                >

                    ${escapeHtml(
                        role
                    )}

                </span>

            </td>


            <td data-label="Status">

                <span
                    class="status-badge ${statusClass(status)}"
                >

                    ${escapeHtml(
                        status
                    )}

                </span>

            </td>


            <td data-label="จัดการ">

                <div class="action-buttons">

                    <button
                        type="button"
                        class="small-btn edit-btn"
                        data-staff-action="edit"
                        data-staff-id="${escapeAttr(
                            adminId
                        )}"
                        data-staff-username="${escapeAttr(
                            username
                        )}"
                    >
                        ✏️ แก้ไข
                    </button>


                    <button
                        type="button"
                        class="small-btn reset-btn"
                        data-staff-action="delete"
                        data-staff-id="${escapeAttr(
                            adminId
                        )}"
                        data-staff-username="${escapeAttr(
                            username
                        )}"
                    >
                        🗑️ ลบ
                    </button>

                </div>

            </td>

        </tr>

    `;

}


/* =====================================================
   ADD STAFF
===================================================== */

async function handleAddStaff(
    event
) {

    event.preventDefault();


    console.log(
        "HANDLE ADD STAFF"
    );


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const data = {

        action:
            "adminAddStaff",

        token:
            token,

        username:
            getValue(
                "staffUsername"
            ),

        password:
            getValue(
                "staffPassword"
            ),

        name:
            getValue(
                "staffName"
            ),

        role:
            getValue(
                "staffRole"
            ) ||
            "STAFF",

        status:
            getValue(
                "staffStatus"
            ) ||
            "ACTIVE"

    };


    if (!data.username) {

        showMessage(
            "กรุณากรอก Username",
            "error"
        );

        focusInput(
            "staffUsername"
        );

        return;

    }


    if (!data.password) {

        showMessage(
            "กรุณากรอกรหัสผ่าน",
            "error"
        );

        focusInput(
            "staffPassword"
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

        focusInput(
            "staffPassword"
        );

        return;

    }


    if (!data.name) {

        showMessage(
            "กรุณากรอกชื่อ Staff",
            "error"
        );

        focusInput(
            "staffName"
        );

        return;

    }


    const button =
        document.getElementById(
            "saveStaffBtn"
        );


    setButtonLoading(
        button,
        true,
        "กำลังบันทึก..."
    );


    setLoading(
        true
    );


    try {

        console.log(
            "ADD STAFF DATA:",
            data
        );


        const result =
            await apiRequest(
                data
            );


        if (
            !result ||
            !result.success
        ) {

            if (
                isSessionExpired(
                    result
                )
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
            result.message ||
            "เพิ่ม Staff สำเร็จ",
            "success"
        );


        resetStaffAddForm();


        await loadStaff(
            true
        );


        switchSection(
            "staff"
        );


    } catch (error) {

        console.error(
            "ADD STAFF ERROR:",
            error
        );


        showMessage(
            error.message ||
            "เพิ่ม Staff ไม่สำเร็จ",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "บันทึก Staff"
        );


        setLoading(
            false
        );

    }

}


/* =====================================================
   RESET STAFF ADD FORM
===================================================== */

function resetStaffAddForm() {

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

}


/* =====================================================
   EDIT STAFF
===================================================== */

function openStaffEditModal(
    adminId,
    username
) {

    const id =
        String(
            adminId || ""
        ).trim();


    const user =
        String(
            username || ""
        ).trim();


    const staff =
        staffCache.find(
            function (item) {

                const itemId =
                    String(
                        item.admin_id ||
                        item.adminId ||
                        ""
                    ).trim();


                const itemUsername =
                    String(
                        item.username ||
                        ""
                    ).trim();


                return (
                    (
                        id &&
                        itemId === id
                    )
                    ||
                    (
                        user &&
                        itemUsername === user
                    )
                );

            }
        );


    if (!staff) {

        showMessage(
            "ไม่พบข้อมูล Staff",
            "error"
        );

        return;

    }


    currentEditStaffId =
        String(
            staff.admin_id ||
            staff.adminId ||
            ""
        ).trim();


    setValue(
        "editStaffId",
        currentEditStaffId
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


    showModal(
        "staffEditModal"
    );

}


/* =====================================================
   UPDATE STAFF
===================================================== */

async function handleUpdateStaff(
    event
) {

    event.preventDefault();


    console.log(
        "HANDLE UPDATE STAFF"
    );


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    /*
     * Code.gs ปัจจุบันค้นหา Staff
     * ด้วย username
     *
     * ดังนั้นต้องส่ง username ไปด้วย
     */

    const username =
        getValue(
            "editStaffUsername"
        );


    if (!username) {

        showMessage(
            "ไม่พบ Username ของ Staff",
            "error"
        );

        return;

    }


    const data = {

        action:
            "adminUpdateStaff",

        token:
            token,

        admin_id:
            currentEditStaffId,

        username:
            username,

        name:
            getValue(
                "editStaffName"
            ),

        role:
            getValue(
                "editStaffRole"
            ) ||
            "STAFF",

        status:
            getValue(
                "editStaffStatus"
            ) ||
            "ACTIVE"

    };


    if (!data.name) {

        showMessage(
            "กรุณากรอกชื่อ Staff",
            "error"
        );

        focusInput(
            "editStaffName"
        );

        return;

    }


    const button =
        document.getElementById(
            "updateStaffBtn"
        );


    setButtonLoading(
        button,
        true,
        "กำลังบันทึก..."
    );


    setLoading(
        true
    );


    try {

        console.log(
            "UPDATE STAFF DATA:",
            data
        );


        const result =
            await apiRequest(
                data
            );


        if (
            !result ||
            !result.success
        ) {

            if (
                isSessionExpired(
                    result
                )
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
            result.message ||
            "แก้ไข Staff สำเร็จ",
            "success"
        );


        closeStaffEditModal();


        await loadStaff(
            true
        );


    } catch (error) {

        console.error(
            "UPDATE STAFF ERROR:",
            error
        );


        showMessage(
            error.message ||
            "แก้ไข Staff ไม่สำเร็จ",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "บันทึกการแก้ไข"
        );


        setLoading(
            false
        );

    }

}


/* =====================================================
   CLOSE STAFF EDIT
===================================================== */

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


    currentEditStaffId =
        "";

}


/* =====================================================
   DELETE STAFF
===================================================== */

async function deleteStaff(
    adminId,
    username
) {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    let id =
        String(
            adminId || ""
        ).trim();


    /*
     * ถ้าไม่มี Admin ID
     * ลองค้นจาก cache
     */

    if (!id && username) {

        const staff =
            staffCache.find(
                function (item) {

                    return String(
                        item.username ||
                        ""
                    ).trim()
                    ===
                    String(
                        username
                    ).trim();

                }
            );


        if (staff) {

            id =
                String(
                    staff.admin_id ||
                    staff.adminId ||
                    ""
                ).trim();

        }

    }


    if (!id) {

        showMessage(
            "ไม่พบ Admin ID ของ Staff",
            "error"
        );

        return;

    }


    const displayName =
        username ||
        id;


    const ok =
        confirm(
            "ต้องการลบ Staff\n\n" +
            displayName +
            "\n\nหรือไม่?"
        );


    if (!ok) {

        return;

    }


    setLoading(
        true
    );


    try {

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
            !result.success
        ) {

            if (
                isSessionExpired(
                    result
                )
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
            result.message ||
            "ลบ Staff สำเร็จ",
            "success"
        );


        await loadStaff(
            true
        );


    } catch (error) {

        console.error(
            "DELETE STAFF ERROR:",
            error
        );


        showMessage(
            error.message ||
            "ลบ Staff ไม่สำเร็จ",
            "error"
        );

    } finally {

        setLoading(
            false
        );

    }

}


/* =====================================================
   DASHBOARD STATS
===================================================== */

function updateDashboardStats() {

    const total =
        studentsCache.length;


    const active =
        studentsCache.filter(
            function (student) {

                const status =
                    String(
                        student.status ||
                        ""
                    )
                    .trim()
                    .toUpperCase();


                return (
                    status ===
                    "ACTIVE"
                    ||
                    status ===
                    "นักศึกษาปกติ"
                );

            }
        ).length;


    const pending =
        resetRequestsCache.filter(
            function (request) {

                return (
                    String(
                        request.status ||
                        ""
                    )
                    .trim()
                    .toUpperCase()
                    ===
                    "PENDING"
                );

            }
        ).length;


    setText(
        "totalStudents",
        total
    );


    setText(
        "activeStudents",
        active
    );


    setText(
        "totalStaff",
        staffCache.length
    );


    /*
     * HTML ปัจจุบันใช้ pendingResets
     */

    setText(
        "pendingResets",
        pending
    );


    /*
     * รองรับชื่อเก่าด้วย
     */

    setText(
        "pendingRequests",
        pending
    );

}


/* =====================================================
   LOGOUT
===================================================== */

async function handleLogout() {

    const ok =
        confirm(
            "ต้องการออกจากระบบ Admin หรือไม่?"
        );


    if (!ok) {

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
            "ADMIN LOGOUT API ERROR:",
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


/* =====================================================
   UI HELPERS
===================================================== */

function bindClick(
    id,
    handler
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.addEventListener(
        "click",
        handler
    );

}


function getValue(
    id
) {

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
            : value;

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
            : value;

}


function focusInput(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        setTimeout(
            function () {

                element.focus();

            },
            50
        );

    }

}


function showModal(
    id
) {

    const modal =
        document.getElementById(
            id
        );


    if (!modal) {

        console.error(
            "MODAL NOT FOUND:",
            id
        );

        return;

    }


    modal.classList.add(
        "show"
    );

}


function setLoading(
    show
) {

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


function closeMobileSidebar() {

    const sidebar =
        document.getElementById(
            "adminSidebar"
        );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "show"
        );

    }

}


/* =====================================================
   BUTTON LOADING
===================================================== */

function setButtonLoading(
    button,
    loading,
    text
) {

    if (!button) {

        return;

    }


    if (loading) {

        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
                button.textContent;

        }


        button.disabled =
            true;


        button.textContent =
            text ||
            "กำลังดำเนินการ...";

    } else {

        button.disabled =
            false;


        button.textContent =
            button.dataset.originalText ||
            text ||
            "บันทึก";


        delete button.dataset.originalText;

    }

}


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
    text,
    type
) {

    const box =
        document.getElementById(
            "messageBox"
        );


    if (!box) {

        console.log(
            "ADMIN MESSAGE:",
            text
        );

        return;

    }


    box.textContent =
        text || "";


    box.className =
        "message-box";


    if (type) {

        box.classList.add(
            type
        );

    }


    if (text) {

        setTimeout(
            function () {

                if (
                    box.textContent ===
                    text
                ) {

                    box.textContent =
                        "";

                    box.className =
                        "message-box";

                }

            },
            5000
        );

    }

}


/* =====================================================
   TABLE HELPERS
===================================================== */

function renderStudentLoading() {

    const tbody =
        document.getElementById(
            "studentsTableBody"
        );


    if (!tbody) {

        return;

    }


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


function renderTableError(
    tbodyId,
    colspan,
    message
) {

    const tbody =
        document.getElementById(
            tbodyId
        );


    if (!tbody) {

        return;

    }


    tbody.innerHTML = `

        <tr>

            <td
                colspan="${colspan}"
                class="empty-cell"
            >

                ${escapeHtml(
                    message
                )}

            </td>

        </tr>

    `;

}


/* =====================================================
   DATE
===================================================== */

function formatDate(
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
        String(
            value
        ).trim();


    /*
     * dd/MM/yyyy
     */

    if (
        /^\d{2}\/\d{2}\/\d{4}/.test(
            text
        )
    ) {

        return text.substring(
            0,
            10
        );

    }


    /*
     * yyyy-MM-dd
     */

    if (
        /^\d{4}-\d{2}-\d{2}/.test(
            text
        )
    ) {

        const parts =
            text.substring(
                0,
                10
            ).split(
                "-"
            );


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


function formatDateTime(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";

    }


    return String(
        value
    );

}


function toInputDate(
    value
) {

    if (!value) {

        return "";

    }


    const text =
        String(
            value
        ).trim();


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
            /^(\d{2})\/(\d{2})\/(\d{4})/
        );


    if (match) {

        return (
            match[3] +
            "-" +
            match[2] +
            "-" +
            match[1]
        );

    }


    return "";

}


/* =====================================================
   STATUS
===================================================== */

function statusClass(
    status
) {

    const value =
        String(
            status || ""
        )
        .trim()
        .toUpperCase();


    if (
        value ===
        "ACTIVE"
        ||
        value ===
        "นักศึกษาปกติ"
        ||
        value ===
        "APPROVED"
    ) {

        return "status-active";

    }


    if (
        value ===
        "PENDING"
    ) {

        return "status-pending";

    }


    if (
        value ===
        "REJECTED"
        ||
        value ===
        "INACTIVE"
    ) {

        return "status-inactive";

    }


    if (
        value ===
        "SUSPENDED"
    ) {

        return "status-suspended";

    }


    if (
        value ===
        "RESET"
    ) {

        return "status-active";

    }


    return "status-default";

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(
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


function escapeAttr(
    value
) {

    return escapeHtml(
        value
    );

}


/* =====================================================
   DEBUG / GLOBAL API
===================================================== */

window.AdminDashboard = {

    loadStudents:
        loadStudents,

    loadStaff:
        loadStaff,

    loadResetRequests:
        loadResetRequests,

    switchSection:
        switchSection,

    editStudent:
        openStudentEditModal,

    resetStudentPassword:
        openDirectResetModal,

    addStudent:
        handleAddStudent,

    addStaff:
        handleAddStaff,

    updateStudent:
        handleUpdateStudent,

    updateStaff:
        handleUpdateStaff,

    deleteStaff:
        deleteStaff,

    resetPassword:
        handleResetPasswordSubmit

};


/*******************************************************
 * END ADMIN DASHBOARD JS
 *******************************************************/
