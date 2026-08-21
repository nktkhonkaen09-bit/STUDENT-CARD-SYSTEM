/************************************************************
 * STUDENT CARD SYSTEM
 * ADMIN DASHBOARD
 *
 * File:
 *   js/admin-dashboard.js
 *
 * Part 1/3
 *
 * รองรับ:
 *   - Admin Session
 *   - Admin Profile
 *   - Dashboard
 *   - Sidebar
 *   - API Request
 *   - Students
 *   - Password Reset Requests
 *   - Staff
 ************************************************************/


"use strict";


/* =========================================================
   GLOBAL STATE
========================================================= */

let studentsCache = [];
let resetRequestsCache = [];
let staffCache = [];

let editingStudentId = null;
let editingStaffId = null;

let adminSessionChecked = false;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "[ADMIN] Dashboard JavaScript started"
        );


        /*
         * ตรวจ CONFIG
         */

        if (
            typeof CONFIG === "undefined"
        ) {

            console.error(
                "[ADMIN] CONFIG is undefined"
            );

            showMessage(
                "ไม่พบ config.js",
                "error"
            );

            return;

        }


        /*
         * ตรวจ API URL
         */

        if (
            !CONFIG.API_URL
        ) {

            console.error(
                "[ADMIN] API_URL is missing"
            );

            showMessage(
                "ไม่พบ API_URL",
                "error"
            );

            return;

        }


        /*
         * เริ่มระบบ
         */

        setupAdminDashboard();


    }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function setupAdminDashboard() {

    /*
     * ผูก Event ทั้งหมด
     */

    setupEvents();


    /*
     * ตั้งค่า Sidebar
     */

    setupSidebar();


    /*
     * ตรวจ Admin Session
     */

    const valid =
        await checkAdminSession();


    if (!valid) {

        return;

    }


    adminSessionChecked =
        true;


    /*
     * แสดงข้อมูล Admin
     */

    loadAdminDisplay();


    /*
     * โหลด Dashboard
     */

    await loadDashboard();


    /*
     * โหลดข้อมูลหลัก
     */

    await loadStudents();

    await loadResetRequests();

    await loadStaff();


    /*
     * แสดงหน้า Dashboard
     */

    showSection(
        "dashboardSection"
    );


}


/* =========================================================
   SETUP EVENTS
========================================================= */

function setupEvents() {


    /*
     * Logout
     */

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            handleLogout
        );

    }


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

    const refreshStudentsBtn =
        document.getElementById(
            "refreshStudentsBtn"
        );


    if (refreshStudentsBtn) {

        refreshStudentsBtn.addEventListener(
            "click",
            function () {

                loadStudents();

            }
        );

    }


    /*
     * Add Student
     */

    const addStudentBtn =
        document.getElementById(
            "addStudentBtn"
        );


    if (addStudentBtn) {

        addStudentBtn.addEventListener(
            "click",
            function () {

                openStudentModal();

            }
        );

    }


    /*
     * Close Student Modal
     */

    bindClick(
        "closeStudentModal",
        closeStudentModal
    );


    bindClick(
        "closeStudentModal2",
        closeStudentModal
    );


    /*
     * Student Form
     */

    const studentForm =
        document.getElementById(
            "studentForm"
        );


    if (studentForm) {

        studentForm.addEventListener(
            "submit",
            handleStudentSubmit
        );

    }


    /*
     * Refresh Reset Requests
     */

    const refreshResetBtn =
        document.getElementById(
            "refreshResetRequestsBtn"
        );


    if (refreshResetBtn) {

        refreshResetBtn.addEventListener(
            "click",
            function () {

                loadResetRequests();

            }
        );

    }


    /*
     * Add Staff
     */

    bindClick(
        "addStaffBtn",
        openStaffModal
    );


    /*
     * Close Staff Modal
     */

    bindClick(
        "closeStaffModal",
        closeStaffModal
    );


    bindClick(
        "closeStaffModal2",
        closeStaffModal
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
            handleStaffSubmit
        );

    }


    /*
     * Modal Background
     */

    const studentModal =
        document.getElementById(
            "studentModal"
        );


    if (studentModal) {

        studentModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    studentModal
                ) {

                    closeStudentModal();

                }

            }
        );

    }


    const staffModal =
        document.getElementById(
            "staffModal"
        );


    if (staffModal) {

        staffModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    staffModal
                ) {

                    closeStaffModal();

                }

            }
        );

    }


}


/* =========================================================
   HELPER - BIND CLICK
========================================================= */

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


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    /*
     * รองรับชื่อ ID หลายแบบ
     */

    const selectors = [

        "[data-section]",

        ".sidebar-menu button",

        ".sidebar-menu a",

        ".admin-menu button",

        ".admin-menu a"

    ];


    const elements =
        document.querySelectorAll(
            selectors.join(",")
        );


    elements.forEach(
        function (element) {

            element.addEventListener(
                "click",
                function (event) {

                    const target =
                        element.dataset.section ||
                        element.dataset.target ||
                        element.getAttribute(
                            "href"
                        );


                    if (!target) {

                        return;

                    }


                    /*
                     * ถ้าเป็น #
                     */

                    if (
                        target === "#"
                    ) {

                        event.preventDefault();

                        return;

                    }


                    /*
                     * ถ้าเป็น URL จริง
                     */

                    if (
                        target.indexOf(
                            ".html"
                        ) !== -1
                    ) {

                        return;

                    }


                    event.preventDefault();


                    showSection(
                        normalizeSectionId(
                            target
                        )
                    );

                }
            );

        }
    );


    /*
     * Sidebar Toggle
     */

    const sidebarToggle =
        document.getElementById(
            "sidebarToggle"
        );


    const sidebar =
        document.querySelector(
            ".admin-sidebar"
        );


    if (
        sidebarToggle &&
        sidebar
    ) {

        sidebarToggle.addEventListener(
            "click",
            function () {

                sidebar.classList.toggle(
                    "open"
                );

            }
        );

    }

}


/* =========================================================
   NORMALIZE SECTION ID
========================================================= */

function normalizeSectionId(
    value
) {

    let id =
        String(
            value || ""
        )
        .trim();


    id =
        id.replace(
            /^#/,
            ""
        );


    /*
     * ชื่อย่อที่อาจใช้ใน HTML
     */

    const map = {

        dashboard:
            "dashboardSection",

        students:
            "studentsSection",

        student:
            "studentsSection",

        reset:
            "resetRequestsSection",

        resetRequests:
            "resetRequestsSection",

        staff:
            "staffSection"

    };


    if (
        map[id]
    ) {

        return map[id];

    }


    return id;

}


/* =========================================================
   SHOW SECTION
========================================================= */

function showSection(
    sectionId
) {

    if (!sectionId) {

        return;

    }


    const sections =
        document.querySelectorAll(
            "[data-admin-section]"
        );


    /*
     * ถ้า HTML ใช้ data-admin-section
     */

    if (
        sections.length > 0
    ) {

        sections.forEach(
            function (section) {

                const active =
                    section.id ===
                    sectionId ||
                    section.dataset.adminSection ===
                    sectionId;


                section.classList.toggle(
                    "active",
                    active
                );

                section.hidden =
                    !active;

            }
        );

    } else {

        /*
         * Fallback:
         * หา section จาก ID
         */

        const knownIds = [

            "dashboardSection",

            "studentsSection",

            "resetRequestsSection",

            "staffSection"

        ];


        knownIds.forEach(
            function (id) {

                const section =
                    document.getElementById(
                        id
                    );


                if (!section) {

                    return;

                }


                const active =
                    id ===
                    sectionId;


                section.classList.toggle(
                    "active",
                    active
                );


                section.hidden =
                    !active;

            }
        );

    }


    /*
     * Active menu
     */

    const menuItems =
        document.querySelectorAll(
            "[data-section]"
        );


    menuItems.forEach(
        function (item) {

            const target =
                normalizeSectionId(
                    item.dataset.section
                );


            item.classList.toggle(
                "active",
                target ===
                sectionId
            );

        }
    );


    /*
     * ปิด Sidebar บนมือถือ
     */

    const sidebar =
        document.querySelector(
            ".admin-sidebar"
        );


    if (
        sidebar &&
        window.innerWidth <= 900
    ) {

        sidebar.classList.remove(
            "open"
        );

    }


    /*
     * Scroll ขึ้นด้านบน
     */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   CHECK ADMIN SESSION
========================================================= */

async function checkAdminSession() {

    const sessionKey =
        CONFIG.ADMIN_SESSION_KEY ||
        "admin_session";


    const token =
        sessionStorage.getItem(
            sessionKey
        );


    if (!token) {

        console.warn(
            "[ADMIN] No session token"
        );

        redirectToLogin();

        return false;

    }


    /*
     * ถ้ามีข้อมูล Admin ใน Session
     * ให้แสดงก่อน
     */

    loadAdminDisplay();


    /*
     * ตรวจ Token กับ API
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
            !result.success
        ) {

            if (
                isSessionExpired(
                    result
                )
            ) {

                handleSessionExpired();

                return false;

            }


            /*
             * บาง API อาจตอบ error
             * แต่ไม่ได้หมายถึง session หมดอายุ
             */

            console.warn(
                "[ADMIN] Session validation response:",
                result
            );

        }


        return true;


    } catch (error) {

        console.error(
            "[ADMIN] Session check error:",
            error
        );


        /*
         * อย่า redirect ทันทีเมื่อ network error
         * เพราะ Session อาจยังใช้ได้
         */

        showMessage(
            "ไม่สามารถตรวจสอบระบบได้ กรุณาตรวจสอบการเชื่อมต่อ",
            "error"
        );


        /*
         * ยังอนุญาตให้หน้า Dashboard เปิด
         * เพื่อป้องกันการเด้ง Login จาก network error
         */

        return true;

    }

}


/* =========================================================
   LOAD ADMIN DISPLAY
========================================================= */

function loadAdminDisplay() {

    const key =
        CONFIG.ADMIN_KEY ||
        "admin_data";


    const raw =
        sessionStorage.getItem(
            key
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
            admin.full_name ||
            admin.fullname ||
            admin.username ||
            "Admin";


        const role =
            admin.role ||
            "ADMIN";


        const nameElements =
            document.querySelectorAll(
                "#adminName, .admin-name"
            );


        nameElements.forEach(
            function (element) {

                element.textContent =
                    name;

            }
        );


        const roleElements =
            document.querySelectorAll(
                "#adminRole, .admin-role"
            );


        roleElements.forEach(
            function (element) {

                element.textContent =
                    role;

            }
        );


    } catch (error) {

        console.error(
            "[ADMIN] Admin data error:",
            error
        );

    }

}


/* =========================================================
   API REQUEST
========================================================= */

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


    const payload =
        Object.assign(
            {},
            data
        );


    console.log(
        "[ADMIN API REQUEST]",
        payload.action
    );


    const response =
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
            JSON.parse(
                text
            );

    } catch (error) {

        console.error(
            "[ADMIN API] Invalid JSON:",
            text
        );


        throw new Error(
            "API ส่งข้อมูลกลับมาไม่ถูกต้อง"
        );

    }


    console.log(
        "[ADMIN API RESPONSE]",
        payload.action,
        result
    );


    return result;

}


/* =========================================================
   SESSION EXPIRED
========================================================= */

function isSessionExpired(
    result
) {

    if (!result) {

        return false;

    }


    const code =
        String(
            result.code ||
            result.errorCode ||
            ""
        )
        .trim()
        .toUpperCase();


    const message =
        String(
            result.message ||
            result.error ||
            ""
        )
        .trim()
        .toLowerCase();


    if (
        code ===
        "ADMIN_SESSION_EXPIRED"
    ) {

        return true;

    }


    if (
        code ===
        "SESSION_EXPIRED"
    ) {

        return true;

    }


    if (
        message.includes(
            "session"
        ) &&
        (
            message.includes(
                "expired"
            ) ||
            message.includes(
                "หมดอายุ"
            )
        )
    ) {

        return true;

    }


    return false;

}


/* =========================================================
   HANDLE SESSION EXPIRED
========================================================= */

function handleSessionExpired() {

    const sessionKey =
        CONFIG.ADMIN_SESSION_KEY ||
        "admin_session";


    const adminKey =
        CONFIG.ADMIN_KEY ||
        "admin_data";


    sessionStorage.removeItem(
        sessionKey
    );


    sessionStorage.removeItem(
        adminKey
    );


    alert(
        "Session ของ Admin หมดอายุ กรุณาเข้าสู่ระบบใหม่"
    );


    redirectToLogin();

}


/* =========================================================
   REDIRECT LOGIN
========================================================= */

function redirectToLogin() {

    window.location.replace(
        "admin-login.html"
    );

}


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    /*
     * Dashboard ใช้ข้อมูลจาก Students
     * จึงสามารถคำนวณจาก cache ได้
     */

    updateDashboardStats();


}


/* =========================================================
   UPDATE DASHBOARD STATS
========================================================= */

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
                    "ACTIVE" ||
                    status ===
                    "นักศึกษาปกติ".toUpperCase()
                );

            }
        )
        .length;


    const inactive =
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
                    "INACTIVE"
                );

            }
        )
        .length;


    const pending =
        resetRequestsCache.filter(
            function (request) {

                const status =
                    String(
                        request.status ||
                        ""
                    )
                    .trim()
                    .toUpperCase();


                return (
                    status ===
                    "PENDING"
                );

            }
        )
        .length;


    /*
     * รองรับ ID หลายแบบ
     */

    setText(
        "totalStudents",
        total
    );


    setText(
        "activeStudents",
        active
    );


    setText(
        "inactiveStudents",
        inactive
    );


    setText(
        "pendingResetRequests",
        pending
    );


    setText(
        "totalResetRequests",
        resetRequestsCache.length
    );


    setText(
        "totalStaff",
        staffCache.length
    );

}


/* =========================================================
   LOAD STUDENTS
========================================================= */

async function loadStudents() {

    const token =
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        );


    if (!token) {

        handleSessionExpired();

        return;

    }


    const tbody =
        document.getElementById(
            "studentsTableBody"
        );


    if (tbody) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="20"
                    class="loading-row"
                >

                    กำลังโหลดข้อมูลนักศึกษา...

                </td>

            </tr>

        `;

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


        renderStudents();


        updateDashboardStats();


        showMessage(
            "โหลดข้อมูลนักศึกษาแล้ว",
            "success"
        );


    } catch (error) {

        console.error(
            "[ADMIN] Load students error:",
            error
        );


        if (tbody) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="20"
                        class="error-row"
                    >

                        ไม่สามารถโหลดข้อมูลนักศึกษาได้

                    </td>

                </tr>

            `;

        }


        showMessage(
            error.message ||
            "ไม่สามารถโหลดข้อมูลนักศึกษาได้",
            "error"
        );

    }

}


/* =========================================================
   RENDER STUDENTS
========================================================= */

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
            searchText ||
            (
                document.getElementById(
                    "studentSearch"
                ) || {}
            ).value ||
            ""
        )
        .trim()
        .toLowerCase();


    let list =
        studentsCache.slice();


    if (search) {

        list =
            list.filter(
                function (student) {

                    const values = [

                        student.student_id,

                        student.prefix_th,

                        student.firstname_th,

                        student.lastname_th,

                        student.firstname_en,

                        student.lastname_en,

                        student.department,

                        student.phone,

                        student.status

                    ];


                    const text =
                        values
                            .filter(
                                function (value) {

                                    return (
                                        value !==
                                        null &&
                                        value !==
                                        undefined
                                    );

                                }
                            )
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
                    colspan="20"
                    class="empty-row"
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


/* =========================================================
   CREATE STUDENT ROW
========================================================= */

function createStudentRow(
    student
) {

    const id =
        String(
            student.student_id ||
            ""
        )
        .trim();


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


    const department =
        student.department ||
        "-";


    const phone =
        student.phone ||
        "-";


    const status =
        student.status ||
        "นักศึกษาปกติ";


    const issueDate =
        formatDisplayDate(
            student.issue_date
        );


    const expireDate =
        formatDisplayDate(
            student.expire_date
        );


    return `

        <tr>

            <td
                data-label="รหัสนักศึกษา"
            >

                <strong>
                    ${escapeHtml(id)}
                </strong>

            </td>


            <td
                data-label="ชื่อ-นามสกุล"
            >

                ${escapeHtml(
                    fullname ||
                    "-"
                )}

            </td>


            <td
                data-label="English Name"
            >

                ${escapeHtml(
                    englishName ||
                    "-"
                )}

            </td>


            <td
                data-label="แผนก"
            >

                ${escapeHtml(
                    department
                )}

            </td>


            <td
                data-label="โทรศัพท์"
            >

                ${escapeHtml(
                    phone
                )}

            </td>


            <td
                data-label="สถานะ"
            >

                <span
                    class="status-badge ${getStatusClass(status)}"
                >

                    ${escapeHtml(
                        status
                    )}

                </span>

            </td>


            <td
                data-label="วันออกบัตร"
            >

                ${escapeHtml(
                    issueDate
                )}

            </td>


            <td
                data-label="วันหมดอายุ"
            >

                ${escapeHtml(
                    expireDate
                )}

            </td>


            <td
                data-label="จัดการ"
                class="action-cell"
            >

                <div
                    class="action-buttons"
                >

                    <button
                        type="button"
                        class="small-btn edit-btn"
                        data-action="edit-student"
                        data-student-id="${escapeHtml(id)}"
                    >
                        แก้ไข
                    </button>


                    <button
                        type="button"
                        class="small-btn reset-btn"
                        data-action="reset-student"
                        data-student-id="${escapeHtml(id)}"
                    >
                        รีเซ็ตรหัสผ่าน
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
            button.dataset.action;


        const studentId =
            button.dataset.studentId;


        if (
            action ===
            "edit-student"
        ) {

            editStudent(
                studentId
            );

        }


        if (
            action ===
            "reset-student"
        ) {

            resetStudentPassword(
                studentId
            );

        }


        if (
            action ===
            "reset-request-approve"
        ) {

            approveResetRequest(
                button.dataset.requestId
            );

        }


        if (
            action ===
            "reset-request-reject"
        ) {

            rejectResetRequest(
                button.dataset.requestId
            );

        }


        if (
            action ===
            "staff-edit"
        ) {

            editStaff(
                button.dataset.staffId
            );

        }


        if (
            action ===
            "staff-delete"
        ) {

            deleteStaff(
                button.dataset.staffId
            );

        }

    }
);


/* =========================================================
   PART 1 END
========================================================= */
/* =========================================================
   ADMIN DASHBOARD
   js/admin-dashboard.js
   ตอนที่ 2/3

   ส่วนนี้ดูแล:
   - โหลดนักศึกษา
   - แสดงตารางนักศึกษา
   - ค้นหา
   - เพิ่มนักศึกษา
   - แก้ไขนักศึกษา
   - รีเซ็ตรหัสผ่าน
   - PasswordResetRequests
========================================================= */


/* =========================================================
   STUDENT DATA
========================================================= */

let studentsCache = [];

let editingStudentId = null;


/* =========================================================
   LOAD STUDENTS
========================================================= */

async function loadStudents() {

    const tbody =
        document.getElementById("studentsTableBody");

    if (!tbody) {
        console.warn(
            "ไม่พบ studentsTableBody"
        );
        return;
    }


    const token =
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        );


    if (!token) {

        handleSessionExpired();

        return;

    }


    tbody.innerHTML = `
        <tr>
            <td colspan="9" class="loading-row">
                กำลังโหลดข้อมูลนักศึกษา...
            </td>
        </tr>
    `;


    try {

        const result =
            await apiRequest({

                action:
                    "adminGetStudents",

                token:
                    token

            });


        console.log(
            "ADMIN STUDENTS RESULT:",
            result
        );


        if (!result || !result.success) {

            if (
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                result?.message ||
                "ไม่สามารถโหลดข้อมูลนักศึกษาได้"
            );

        }


        studentsCache =
            Array.isArray(
                result.students
            )
                ? result.students
                : [];


        renderStudents();


    } catch (error) {

        console.error(
            "LOAD STUDENTS ERROR:",
            error
        );


        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="error-row">
                    ${escapeHtml(
                        error.message ||
                        "โหลดข้อมูลนักศึกษาไม่สำเร็จ"
                    )}
                </td>
            </tr>
        `;


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

function renderStudents(
    searchText = ""
) {

    const tbody =
        document.getElementById(
            "studentsTableBody"
        );


    if (!tbody) {
        return;
    }


    const keyword =
        String(searchText)
            .trim()
            .toLowerCase();


    let students =
        [...studentsCache];


    /*
     * SEARCH
     */

    if (keyword) {

        students =
            students.filter(
                student => {

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
                    .filter(
                        value =>
                            value !== undefined &&
                            value !== null
                    )
                    .join(" ")
                    .toLowerCase();


                    return text.includes(
                        keyword
                    );

                }
            );

    }


    /*
     * EMPTY
     */

    if (!students.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-row">
                    ไม่พบข้อมูลนักศึกษา
                </td>
            </tr>
        `;

        return;

    }


    /*
     * ROWS
     */

    tbody.innerHTML =
        students
            .map(
                createStudentRow
            )
            .join("");

}


/* =========================================================
   CREATE STUDENT ROW
========================================================= */

function createStudentRow(
    student
) {

    const studentId =
        String(
            student.student_id || ""
        );


    const fullName = [

        student.prefix_th,

        student.firstname_th,

        student.lastname_th

    ]
    .filter(Boolean)
    .join(" ");


    const englishName = [

        student.firstname_en,

        student.lastname_en

    ]
    .filter(Boolean)
    .join(" ");


    const department =
        student.department ||
        "-";


    const phone =
        student.phone ||
        "-";


    const status =
        student.status ||
        "นักศึกษาปกติ";


    const issueDate =
        formatDisplayDate(
            student.issue_date
        );


    const expireDate =
        formatDisplayDate(
            student.expire_date
        );


    return `

        <tr>

            <td
                data-label="รหัสนักศึกษา"
                class="student-id-cell"
            >

                <strong>
                    ${escapeHtml(studentId)}
                </strong>

            </td>


            <td
                data-label="ชื่อ-นามสกุล"
            >

                ${escapeHtml(
                    fullName || "-"
                )}

            </td>


            <td
                data-label="English Name"
            >

                ${escapeHtml(
                    englishName || "-"
                )}

            </td>


            <td
                data-label="แผนก"
            >

                ${escapeHtml(
                    department
                )}

            </td>


            <td
                data-label="โทรศัพท์"
            >

                ${escapeHtml(
                    phone
                )}

            </td>


            <td
                data-label="สถานะ"
            >

                <span
                    class="status-badge
                    ${getStatusClass(status)}"
                >

                    ${escapeHtml(
                        status
                    )}

                </span>

            </td>


            <td
                data-label="วันออกบัตร"
            >

                ${escapeHtml(
                    issueDate
                )}

            </td>


            <td
                data-label="วันหมดอายุ"
            >

                ${escapeHtml(
                    expireDate
                )}

            </td>


            <td
                data-label="จัดการ"
                class="action-cell"
            >

                <div
                    class="action-buttons"
                >

                    <button
                        type="button"
                        class="small-btn edit-btn"
                        onclick="editStudent('${escapeJs(studentId)}')"
                    >
                        แก้ไข
                    </button>


                    <button
                        type="button"
                        class="small-btn reset-btn"
                        onclick="resetStudentPassword('${escapeJs(studentId)}')"
                    >
                        รีเซ็ตรหัสผ่าน
                    </button>

                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   SEARCH STUDENTS
========================================================= */

function setupStudentSearch() {

    const input =
        document.getElementById(
            "studentSearch"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        function () {

            renderStudents(
                this.value
            );

        }
    );

}


/* =========================================================
   OPEN ADD STUDENT
========================================================= */

function openStudentModal(
    student = null
) {

    const modal =
        document.getElementById(
            "studentModal"
        );


    if (!modal) {
        return;
    }


    resetStudentForm();


    editingStudentId =
        null;


    const title =
        modal.querySelector(
            ".modal-header h2"
        );


    const idInput =
        document.getElementById(
            "studentId"
        );


    const passwordInput =
        document.getElementById(
            "studentPassword"
        );


    const saveButton =
        document.getElementById(
            "saveStudentBtn"
        );


    /*
     * ADD MODE
     */

    if (!student) {

        if (title) {

            title.textContent =
                "เพิ่มนักศึกษา";

        }


        if (idInput) {

            idInput.readOnly =
                false;

        }


        if (passwordInput) {

            passwordInput.required =
                true;

            passwordInput.value =
                "123456";

            passwordInput.placeholder =
                "";

        }


        if (saveButton) {

            saveButton.textContent =
                "บันทึกนักศึกษา";

        }


        modal.classList.add(
            "show"
        );

        return;

    }


    /*
     * EDIT MODE
     */

    editingStudentId =
        String(
            student.student_id
        );


    if (title) {

        title.textContent =
            "แก้ไขข้อมูลนักศึกษา";

    }


    setInputValue(
        "studentId",
        student.student_id
    );


    setInputValue(
        "studentPrefix",
        student.prefix_th
    );


    setInputValue(
        "studentFirstnameTh",
        student.firstname_th
    );


    setInputValue(
        "studentLastnameTh",
        student.lastname_th
    );


    setInputValue(
        "studentFirstnameEn",
        student.firstname_en
    );


    setInputValue(
        "studentLastnameEn",
        student.lastname_en
    );


    setInputValue(
        "studentDepartment",
        student.department
    );


    setInputValue(
        "studentPhone",
        student.phone
    );


    setInputValue(
        "studentStatus",
        student.status ||
        "นักศึกษาปกติ"
    );


    setInputValue(
        "studentIssueDate",
        convertToInputDate(
            student.issue_date
        )
    );


    setInputValue(
        "studentExpireDate",
        convertToInputDate(
            student.expire_date
        )
    );


    setInputValue(
        "studentPhoto",
        student.photo_url
    );


    /*
     * ID ห้ามแก้
     */

    if (idInput) {

        idInput.readOnly =
            true;

    }


    /*
     * Password ไม่ใช้ตอนแก้ไข
     */

    if (passwordInput) {

        passwordInput.value =
            "";

        passwordInput.required =
            false;

        passwordInput.placeholder =
            "หากไม่ต้องการเปลี่ยนรหัสผ่าน ให้เว้นว่าง";

    }


    if (saveButton) {

        saveButton.textContent =
            "บันทึกการแก้ไข";

    }


    modal.classList.add(
        "show"
    );

}


/* =========================================================
   EDIT STUDENT
========================================================= */

function editStudent(
    studentId
) {

    const target =
        String(
            studentId
        )
        .trim();


    const student =
        studentsCache.find(
            item =>
                String(
                    item.student_id
                )
                .trim()
                ===
                target
        );


    if (!student) {

        showMessage(
            "ไม่พบข้อมูลนักศึกษา",
            "error"
        );

        return;

    }


    openStudentModal(
        student
    );

}


/* =========================================================
   CLOSE STUDENT MODAL
========================================================= */

function closeStudentModalHandler() {

    const modal =
        document.getElementById(
            "studentModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    editingStudentId =
        null;


    resetStudentForm();

}


/* =========================================================
   RESET STUDENT FORM
========================================================= */

function resetStudentForm() {

    const form =
        document.getElementById(
            "studentForm"
        );


    if (form) {

        form.reset();

    }


    editingStudentId =
        null;


    setInputValue(
        "studentPassword",
        "123456"
    );


    setInputValue(
        "studentStatus",
        "นักศึกษาปกติ"
    );


    const idInput =
        document.getElementById(
            "studentId"
        );


    if (idInput) {

        idInput.readOnly =
            false;

    }


    const passwordInput =
        document.getElementById(
            "studentPassword"
        );


    if (passwordInput) {

        passwordInput.required =
            true;

        passwordInput.placeholder =
            "";

    }


    const saveButton =
        document.getElementById(
            "saveStudentBtn"
        );


    if (saveButton) {

        saveButton.textContent =
            "บันทึกนักศึกษา";

    }

}


/* =========================================================
   STUDENT FORM SUBMIT
========================================================= */

async function handleStudentSubmit(
    event
) {

    event.preventDefault();


    const token =
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        );


    if (!token) {

        handleSessionExpired();

        return;

    }


    const studentId =
        getInputValue(
            "studentId"
        );


    const password =
        getInputValue(
            "studentPassword"
        );


    const payload = {

        token:
            token,

        student_id:
            studentId,

        prefix_th:
            getInputValue(
                "studentPrefix"
            ),

        firstname_th:
            getInputValue(
                "studentFirstnameTh"
            ),

        lastname_th:
            getInputValue(
                "studentLastnameTh"
            ),

        firstname_en:
            getInputValue(
                "studentFirstnameEn"
            ),

        lastname_en:
            getInputValue(
                "studentLastnameEn"
            ),

        department:
            getInputValue(
                "studentDepartment"
            ),

        phone:
            getInputValue(
                "studentPhone"
            ),

        status:
            getInputValue(
                "studentStatus"
            ),

        issue_date:
            getInputValue(
                "studentIssueDate"
            ),

        expire_date:
            getInputValue(
                "studentExpireDate"
            ),

        photo_url:
            getInputValue(
                "studentPhoto"
            )

    };


    /*
     * VALIDATION
     */

    if (!studentId) {

        showMessage(
            "กรุณากรอกรหัสนักศึกษา",
            "error"
        );

        return;

    }


    if (!payload.firstname_th) {

        showMessage(
            "กรุณากรอกชื่อ",
            "error"
        );

        return;

    }


    if (!payload.lastname_th) {

        showMessage(
            "กรุณากรอกนามสกุล",
            "error"
        );

        return;

    }


    /*
     * ADD
     */

    if (!editingStudentId) {

        if (!password) {

            showMessage(
                "กรุณากรอกรหัสผ่านเริ่มต้น",
                "error"
            );

            return;

        }


        await addStudent({

            ...payload,

            password:
                password

        });


        return;

    }


    /*
     * UPDATE
     */

    await updateStudent(
        payload
    );

}


/* =========================================================
   ADD STUDENT
========================================================= */

async function addStudent(
    data
) {

    const button =
        document.getElementById(
            "saveStudentBtn"
        );


    setButtonLoading(
        button,
        true,
        "กำลังเพิ่มนักศึกษา..."
    );


    try {

        const result =
            await apiRequest({

                action:
                    "adminAddStudent",

                ...data

            });


        if (
            !result ||
            !result.success
        ) {

            if (
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                result?.message ||
                "เพิ่มนักศึกษาไม่สำเร็จ"
            );

        }


        showMessage(
            "เพิ่มนักศึกษาสำเร็จ",
            "success"
        );


        closeStudentModalHandler();


        await loadStudents();


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

    }

}


/* =========================================================
   UPDATE STUDENT
========================================================= */

async function updateStudent(
    data
) {

    const button =
        document.getElementById(
            "saveStudentBtn"
        );


    setButtonLoading(
        button,
        true,
        "กำลังบันทึก..."
    );


    try {

        const result =
            await apiRequest({

                action:
                    "adminUpdateStudent",

                ...data,

                student_id:
                    editingStudentId

            });


        if (
            !result ||
            !result.success
        ) {

            if (
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                result?.message ||
                "แก้ไขข้อมูลไม่สำเร็จ"
            );

        }


        showMessage(
            "แก้ไขข้อมูลนักศึกษาสำเร็จ",
            "success"
        );


        closeStudentModalHandler();


        await loadStudents();


    } catch (error) {

        console.error(
            "UPDATE STUDENT ERROR:",
            error
        );


        showMessage(
            error.message ||
            "แก้ไขข้อมูลไม่สำเร็จ",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "บันทึกการแก้ไข"
        );

    }

}


/* =========================================================
   RESET STUDENT PASSWORD
========================================================= */

/*
 * ระบบนี้ใช้ PasswordResetRequests
 *
 * ขั้นตอน:
 *
 * Admin กด "รีเซ็ตรหัสผ่าน"
 *       ↓
 * ยืนยัน
 *       ↓
 * ส่ง request ไป Code.gs
 *       ↓
 * Code.gs ตรวจสิทธิ์ Admin
 *       ↓
 * บันทึก/ประมวลผล PasswordResetRequests
 *
 * action:
 * adminDirectResetStudentPassword
 */

async function resetStudentPassword(
    studentId
) {

    const token =
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        );


    if (!token) {

        handleSessionExpired();

        return;

    }


    const id =
        String(
            studentId || ""
        )
        .trim();


    if (!id) {

        showMessage(
            "ไม่พบรหัสนักศึกษา",
            "error"
        );

        return;

    }


    const student =
        studentsCache.find(
            item =>
                String(
                    item.student_id
                )
                .trim()
                ===
                id
        );


    const studentName =
        student
            ? [

                student.prefix_th,

                student.firstname_th,

                student.lastname_th

              ]
              .filter(Boolean)
              .join(" ")

            : "";


    const message = [

        "ต้องการรีเซ็ตรหัสผ่านหรือไม่?",

        "",

        "รหัสนักศึกษา: " + id,

        studentName
            ? "ชื่อ: " + studentName
            : "",

        "",

        "รหัสผ่านใหม่จะเป็น: 123456",

        "",

        "ระบบจะบันทึกการดำเนินการไว้ใน PasswordResetRequests"

    ]
    .filter(Boolean)
    .join("\n");


    const confirmed =
        window.confirm(
            message
        );


    if (!confirmed) {

        return;

    }


    try {

        showMessage(
            "กำลังรีเซ็ตรหัสผ่าน...",
            "info"
        );


        const result =
            await apiRequest({

                action:
                    "adminDirectResetStudentPassword",

                token:
                    token,

                student_id:
                    id,

                newPassword:
                    "123456"

            });


        console.log(
            "RESET PASSWORD RESULT:",
            result
        );


        if (
            !result ||
            !result.success
        ) {

            if (
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                result?.message ||
                "รีเซ็ตรหัสผ่านไม่สำเร็จ"
            );

        }


        showMessage(
            result.message ||
            "รีเซ็ตรหัสผ่านสำเร็จ",
            "success"
        );


    } catch (error) {

        console.error(
            "RESET STUDENT PASSWORD ERROR:",
            error
        );


        showMessage(
            error.message ||
            "รีเซ็ตรหัสผ่านไม่สำเร็จ",
            "error"
        );

    }

}


/* =========================================================
   LOAD PASSWORD RESET REQUESTS
========================================================= */

async function loadPasswordResetRequests() {

    const tbody =
        document.getElementById(
            "passwordResetTableBody"
        );


    /*
     * ถ้า HTML ยังไม่มีตาราง
     * ไม่ต้องทำอะไร
     */

    if (!tbody) {

        console.log(
            "ยังไม่มี passwordResetTableBody"
        );

        return;

    }


    const token =
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        );


    if (!token) {

        handleSessionExpired();

        return;

    }


    tbody.innerHTML = `
        <tr>
            <td colspan="8">
                กำลังโหลดคำขอรีเซ็ตรหัสผ่าน...
            </td>
        </tr>
    `;


    try {

        const result =
            await apiRequest({

                action:
                    "adminGetPasswordResetRequests",

                token:
                    token

            });


        console.log(
            "PASSWORD RESET REQUESTS:",
            result
        );


        if (
            !result ||
            !result.success
        ) {

            if (
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                result?.message ||
                "โหลดคำขอรีเซ็ตรหัสผ่านไม่สำเร็จ"
            );

        }


        const requests =
            Array.isArray(
                result.requests
            )
                ? result.requests
                : [];


        renderPasswordResetRequests(
            requests
        );


    } catch (error) {

        console.error(
            "LOAD PASSWORD RESET REQUESTS ERROR:",
            error
        );


        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="error-row">
                    ${escapeHtml(
                        error.message ||
                        "ไม่สามารถโหลดคำขอรีเซ็ตรหัสผ่านได้"
                    )}
                </td>
            </tr>
        `;

    }

}


/* =========================================================
   RENDER PASSWORD RESET REQUESTS
========================================================= */

function renderPasswordResetRequests(
    requests
) {

    const tbody =
        document.getElementById(
            "passwordResetTableBody"
        );


    if (!tbody) {
        return;
    }


    if (!requests.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-row">
                    ไม่มีคำขอรีเซ็ตรหัสผ่าน
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        requests
            .map(
                request => {

                    return `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    request.request_id ||
                                    "-"
                                )}
                            </td>


                            <td>
                                <strong>
                                    ${escapeHtml(
                                        request.student_id ||
                                        "-"
                                    )}
                                </strong>
                            </td>


                            <td>
                                ${escapeHtml(
                                    request.reason ||
                                    "-"
                                )}
                            </td>


                            <td>

                                <span
                                    class="status-badge
                                    ${getStatusClass(
                                        request.status
                                    )}"
                                >

                                    ${escapeHtml(
                                        request.status ||
                                        "-"
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
                                    request.processed_by ||
                                    "-"
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    request.note ||
                                    "-"
                                )}
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   FORMAT DATE TIME
========================================================= */

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
        String(value)
            .trim();


    if (
        text === ""
    ) {

        return "-";

    }


    /*
     * Google Sheets อาจส่ง
     *
     * 20/8/2026, 20:58:17
     */

    return text;

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.loadStudents =
    loadStudents;


window.renderStudents =
    renderStudents;


window.openStudentModal =
    openStudentModal;


window.editStudent =
    editStudent;


window.resetStudentPassword =
    resetStudentPassword;


window.closeStudentModalHandler =
    closeStudentModalHandler;


window.handleStudentSubmit =
    handleStudentSubmit;


window.loadPasswordResetRequests =
    loadPasswordResetRequests;


/* =========================================================
   AUTO SETUP SEARCH
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupStudentSearch();

    }
);


/* =========================================================
   END PART 2/3
========================================================= */
/* =========================================================
   ADMIN DASHBOARD
   PART 3 / 3
   Password Reset / Staff / Logout / Helpers
========================================================= */


/* =========================================================
   PASSWORD RESET REQUESTS
========================================================= */

async function loadPasswordResetRequests() {

    const tbody =
        document.getElementById(
            "passwordResetTableBody"
        );

    if (!tbody) {
        console.warn(
            "ไม่พบ #passwordResetTableBody"
        );
        return;
    }

    const token =
        getAdminToken();

    if (!token) {
        handleSessionExpired();
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="loading-row">
                กำลังโหลดคำขอรีเซ็ตรหัสผ่าน...
            </td>
        </tr>
    `;

    try {

        const result =
            await apiRequest({
                action:
                    "adminGetPasswordResetRequests",

                token:
                    token
            });


        if (
            !result ||
            !result.success
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
                    : "ไม่สามารถโหลดคำขอรีเซ็ตรหัสผ่านได้"
            );
        }


        passwordResetCache =
            Array.isArray(
                result.requests
            )
                ? result.requests
                : [];


        renderPasswordResetRequests();


    } catch (error) {

        console.error(
            "LOAD PASSWORD RESET REQUESTS ERROR",
            error
        );


        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="error-row">
                    ${escapeHtml(
                        error.message ||
                        "ไม่สามารถโหลดข้อมูลได้"
                    )}
                </td>
            </tr>
        `;
    }
}


/* =========================================================
   RENDER PASSWORD RESET REQUESTS
========================================================= */

function renderPasswordResetRequests(
    searchText = ""
) {

    const tbody =
        document.getElementById(
            "passwordResetTableBody"
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
        Array.isArray(
            passwordResetCache
        )
            ? passwordResetCache.slice()
            : [];


    if (search) {

        list =
            list.filter(
                function (item) {

                    const text = [

                        item.request_id,

                        item.student_id,

                        item.reason,

                        item.status,

                        item.requested_at,

                        item.processed_at,

                        item.processed_by,

                        item.note

                    ]
                    .join(" ")
                    .toLowerCase();


                    return (
                        text.indexOf(search) >= 0
                    );
                }
            );
    }


    if (
        list.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-row">
                    ไม่พบคำขอรีเซ็ตรหัสผ่าน
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        list
            .map(
                function (item) {

                    return createPasswordResetRow(
                        item
                    );

                }
            )
            .join("");
}


/* =========================================================
   PASSWORD RESET ROW
========================================================= */

function createPasswordResetRow(
    item
) {

    const requestId =
        item.request_id ||
        "-";


    const studentId =
        item.student_id ||
        "-";


    const reason =
        item.reason ||
        "-";


    const status =
        item.status ||
        "-";


    const requestedAt =
        item.requested_at ||
        "-";


    const processedAt =
        item.processed_at ||
        "-";


    const processedBy =
        item.processed_by ||
        "-";


    const note =
        item.note ||
        "-";


    const normalizedStatus =
        String(
            status
        )
        .trim()
        .toUpperCase();


    let actionHtml = "";


    if (
        normalizedStatus === "PENDING" ||
        normalizedStatus === "REQUEST"
    ) {

        actionHtml = `

            <div class="action-buttons">

                <button
                    type="button"
                    class="small-btn reset-btn"
                    onclick="processPasswordReset('${escapeJs(studentId)}','${escapeJs(requestId)}')"
                >
                    รีเซ็ต
                </button>

            </div>

        `;

    } else {

        actionHtml = `
            <span class="muted-text">
                ดำเนินการแล้ว
            </span>
        `;
    }


    return `

        <tr>

            <td data-label="Request ID">
                ${escapeHtml(requestId)}
            </td>

            <td data-label="รหัสนักศึกษา">
                <strong>
                    ${escapeHtml(studentId)}
                </strong>
            </td>

            <td data-label="เหตุผล">
                ${escapeHtml(reason)}
            </td>

            <td data-label="สถานะ">

                <span
                    class="status-badge ${getStatusClass(status)}"
                >
                    ${escapeHtml(status)}
                </span>

            </td>

            <td data-label="วันที่ร้องขอ">
                ${escapeHtml(requestedAt)}
            </td>

            <td data-label="วันที่ดำเนินการ">
                ${escapeHtml(processedAt)}
            </td>

            <td data-label="ผู้ดำเนินการ">
                ${escapeHtml(processedBy)}
            </td>

            <td data-label="จัดการ">
                ${actionHtml}
            </td>

        </tr>

    `;
}


/* =========================================================
   PROCESS PASSWORD RESET REQUEST
========================================================= */

async function processPasswordReset(
    studentId,
    requestId
) {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;
    }


    studentId =
        String(
            studentId || ""
        ).trim();


    requestId =
        String(
            requestId || ""
        ).trim();


    if (!studentId) {

        showMessage(
            "ไม่พบรหัสนักศึกษา",
            "error"
        );

        return;
    }


    const confirmed =
        window.confirm(

            "ยืนยันการรีเซ็ตรหัสผ่าน?\n\n" +

            "รหัสนักศึกษา: " +
            studentId +

            "\n\n" +

            "รหัสผ่านใหม่: 123456"

        );


    if (!confirmed) {
        return;
    }


    try {

        showMessage(
            "กำลังรีเซ็ตรหัสผ่าน...",
            "info"
        );


        const result =
            await apiRequest({

                action:
                    "adminDirectResetStudentPassword",

                token:
                    token,

                student_id:
                    studentId,

                newPassword:
                    "123456",

                request_id:
                    requestId

            });


        if (
            !result ||
            !result.success
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


        /*
         * โหลดรายการใหม่
         */

        await loadPasswordResetRequests();


    } catch (error) {

        console.error(
            "PROCESS PASSWORD RESET ERROR",
            error
        );


        showMessage(
            error.message ||
            "รีเซ็ตรหัสผ่านไม่สำเร็จ",
            "error"
        );
    }
}


/* =========================================================
   DIRECT RESET FROM STUDENT TABLE
========================================================= */

async function resetStudentPassword(
    studentId
) {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;
    }


    studentId =
        String(
            studentId || ""
        ).trim();


    if (!studentId) {

        showMessage(
            "ไม่พบรหัสนักศึกษา",
            "error"
        );

        return;
    }


    const student =
        studentsCache.find(
            function (student) {

                return String(
                    student.student_id || ""
                )
                .trim()
                ===
                studentId;

            }
        );


    let studentName = "";


    if (student) {

        studentName =
            [

                student.prefix_th,

                student.firstname_th,

                student.lastname_th

            ]
            .filter(Boolean)
            .join(" ");
    }


    const confirmed =
        window.confirm(

            "ต้องการรีเซ็ตรหัสผ่านหรือไม่?\n\n" +

            "รหัสนักศึกษา: " +
            studentId +

            (
                studentName
                    ? "\nชื่อ: " +
                      studentName
                    : ""
            ) +

            "\n\n" +

            "รหัสผ่านใหม่จะเป็น: 123456"

        );


    if (!confirmed) {
        return;
    }


    try {

        showMessage(
            "กำลังรีเซ็ตรหัสผ่าน...",
            "info"
        );


        const result =
            await apiRequest({

                action:
                    "adminDirectResetStudentPassword",

                token:
                    token,

                student_id:
                    studentId,

                newPassword:
                    "123456"

            });


        if (
            !result ||
            !result.success
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


        /*
         * ถ้ามี Password Reset section
         * ให้โหลดใหม่ด้วย
         */

        if (
            document.getElementById(
                "passwordResetTableBody"
            )
        ) {

            await loadPasswordResetRequests();

        }


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
    }
}


/* =========================================================
   LOAD STAFF
========================================================= */

async function loadStaff() {

    const tbody =
        document.getElementById(
            "staffTableBody"
        );


    if (!tbody) {
        return;
    }


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;
    }


    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="loading-row">
                กำลังโหลดข้อมูล Staff...
            </td>
        </tr>
    `;


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
                isSessionExpired(result)
            ) {

                handleSessionExpired();

                return;
            }


            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "ไม่สามารถโหลดข้อมูล Staff ได้"
            );
        }


        staffCache =
            Array.isArray(
                result.staff
            )
                ? result.staff
                : [];


        renderStaff();


    } catch (error) {

        console.error(
            "LOAD STAFF ERROR",
            error
        );


        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="error-row">
                    ${escapeHtml(
                        error.message ||
                        "ไม่สามารถโหลดข้อมูล Staff ได้"
                    )}
                </td>
            </tr>
        `;
    }
}


/* =========================================================
   RENDER STAFF
========================================================= */

function renderStaff(
    searchText = ""
) {

    const tbody =
        document.getElementById(
            "staffTableBody"
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
        Array.isArray(
            staffCache
        )
            ? staffCache.slice()
            : [];


    if (search) {

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


                    return (
                        text.indexOf(search) >= 0
                    );
                }
            );
    }


    if (
        list.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-row">
                    ไม่พบข้อมูล Staff
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        list
            .map(
                function (staff) {

                    return `

                        <tr>

                            <td data-label="Admin ID">
                                ${escapeHtml(
                                    staff.admin_id ||
                                    "-"
                                )}
                            </td>

                            <td data-label="Username">

                                <strong>
                                    ${escapeHtml(
                                        staff.username ||
                                        "-"
                                    )}
                                </strong>

                            </td>

                            <td data-label="ชื่อ">

                                ${escapeHtml(
                                    staff.name ||
                                    "-"
                                )}

                            </td>

                            <td data-label="Role">

                                <span class="role-badge">

                                    ${escapeHtml(
                                        staff.role ||
                                        "STAFF"
                                    )}

                                </span>

                            </td>

                            <td data-label="Status">

                                <span
                                    class="status-badge ${getStatusClass(
                                        staff.status
                                    )}"
                                >

                                    ${escapeHtml(
                                        staff.status ||
                                        "-"
                                    )}

                                </span>

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

async function handleStaffSubmit(
    event
) {

    event.preventDefault();


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;
    }


    const username =
        getInputValue(
            "staffUsername"
        );


    const password =
        getInputValue(
            "staffPassword"
        );


    const name =
        getInputValue(
            "staffName"
        );


    const role =
        getInputValue(
            "staffRole"
        ) ||
        "STAFF";


    const status =
        getInputValue(
            "staffStatus"
        ) ||
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


    setButtonLoading(
        button,
        true,
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
            !result.success
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

        setButtonLoading(
            button,
            false,
            "บันทึก Staff"
        );
    }
}


/* =========================================================
   OPEN STAFF MODAL
========================================================= */

function openStaffModal() {

    const modal =
        document.getElementById(
            "staffModal"
        );


    if (!modal) {
        return;
    }


    const form =
        document.getElementById(
            "staffForm"
        );


    if (form) {
        form.reset();
    }


    setInputValue(
        "staffRole",
        "STAFF"
    );


    setInputValue(
        "staffStatus",
        "ACTIVE"
    );


    modal.classList.add(
        "show"
    );
}


/* =========================================================
   CLOSE STAFF MODAL
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


/* =========================================================
   LOGOUT
========================================================= */

async function handleLogout() {

    const confirmed =
        window.confirm(
            "ต้องการออกจากระบบ Admin หรือไม่?"
        );


    if (!confirmed) {
        return;
    }


    const token =
        getAdminToken();


    /*
     * พยายามแจ้ง Server
     */

    if (token) {

        try {

            await apiRequest({

                action:
                    "adminLogout",

                token:
                    token

            });

        } catch (error) {

            console.warn(
                "ADMIN LOGOUT API ERROR",
                error
            );
        }
    }


    /*
     * ล้าง Session
     */

    clearAdminSession();


    /*
     * กลับหน้า Login
     */

    window.location.replace(
        "admin-login.html"
    );
}


/* =========================================================
   SESSION HELPERS
========================================================= */

function getAdminToken() {

    if (
        typeof CONFIG ===
        "undefined"
    ) {

        return "";
    }


    return (
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        ) || ""
    );
}


function getAdminData() {

    if (
        typeof CONFIG ===
        "undefined"
    ) {

        return null;
    }


    const raw =
        sessionStorage.getItem(
            CONFIG.ADMIN_KEY
        );


    if (!raw) {
        return null;
    }


    try {

        return JSON.parse(
            raw
        );

    } catch (error) {

        console.error(
            "ADMIN DATA PARSE ERROR",
            error
        );

        return null;
    }
}


function clearAdminSession() {

    if (
        typeof CONFIG ===
        "undefined"
    ) {

        return;
    }


    sessionStorage.removeItem(
        CONFIG.ADMIN_SESSION_KEY
    );


    sessionStorage.removeItem(
        CONFIG.ADMIN_KEY
    );
}


function handleSessionExpired() {

    clearAdminSession();


    window.alert(
        "Session ของ Admin หมดอายุ กรุณาเข้าสู่ระบบใหม่"
    );


    window.location.replace(
        "admin-login.html"
    );
}


/* =========================================================
   API
========================================================= */

async function apiRequest(
    data
) {

    if (
        typeof CONFIG ===
        "undefined"
    ) {

        throw new Error(
            "ไม่พบ CONFIG"
        );
    }


    if (
        !CONFIG.API_URL
    ) {

        throw new Error(
            "ไม่พบ API_URL"
        );
    }


    const response =
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


    if (!response.ok) {

        throw new Error(
            "HTTP " +
            response.status
        );
    }


    const result =
        await response.json();


    console.log(
        "ADMIN API",
        data.action,
        result
    );


    return result;
}


/* =========================================================
   INPUT HELPERS
========================================================= */

function getInputValue(
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


function setInputValue(
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
        value === null ||
        value === undefined
            ? ""
            : value;
}


/* =========================================================
   BUTTON HELPER
========================================================= */

function setButtonLoading(
    button,
    loading,
    loadingText
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
            loadingText ||
            "กำลังดำเนินการ...";


    } else {

        button.disabled =
            false;


        button.textContent =
            button.dataset.originalText ||
            "บันทึก";


        delete button.dataset.originalText;
    }
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    text,
    type = "info"
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

        window.clearTimeout(
            showMessage.timer
        );


        showMessage.timer =
            window.setTimeout(
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


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(
    status
) {

    const value =
        String(
            status || ""
        )
        .trim()
        .toUpperCase();


    if (
        value === "ACTIVE" ||
        value === "RESET" ||
        value === "นักศึกษาปกติ"
    ) {

        return "status-active";
    }


    if (
        value === "PENDING"
    ) {

        return "status-pending";
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


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(
    value
) {

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


/* =========================================================
   JS ESCAPE
========================================================= */

function escapeJs(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)

        .replace(
            /\\/g,
            "\\\\"
        )

        .replace(
            /'/g,
            "\\'"
        )

        .replace(
            /\r/g,
            "\\r"
        )

        .replace(
            /\n/g,
            "\\n"
        );
}


/* =========================================================
   DATE FORMAT
========================================================= */

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
        String(value).trim();


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


    return text;
}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.loadStudents =
    loadStudents;


window.loadStaff =
    loadStaff;


window.loadPasswordResetRequests =
    loadPasswordResetRequests;


window.renderPasswordResetRequests =
    renderPasswordResetRequests;


window.processPasswordReset =
    processPasswordReset;


window.resetStudentPassword =
    resetStudentPassword;


window.openStaffModal =
    openStaffModal;


window.closeStaffModal =
    closeStaffModal;


window.handleLogout =
    handleLogout;


window.editStudent =
    typeof editStudent !== "undefined"
        ? editStudent
        : function () {

            console.warn(
                "editStudent ยังไม่ได้โหลดจาก Part 1/2"
            );

        };


/* =========================================================
   END PART 3 / 3
========================================================= */
