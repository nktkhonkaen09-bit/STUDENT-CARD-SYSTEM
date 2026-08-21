/************************************************************
 * ADMIN DASHBOARD
 * js/admin-dashboard.js
 *
 * VERSION:
 *   สำหรับ admin-dashboard.html โครงสร้างปัจจุบัน
 *
 * รองรับ:
 *   1. Admin Session
 *   2. Sidebar Navigation
 *   3. Dashboard Summary
 *   4. Student List
 *   5. Search Student
 *   6. Add Student
 *   7. Edit Student
 *   8. Reset Student Password
 *   9. PasswordResetRequests
 *  10. Staff List
 *  11. Add Staff
 *  12. Edit Staff
 *  13. Logout
 *  14. Mobile Sidebar
 ************************************************************/


"use strict";


/* =========================================================
   GLOBAL
========================================================= */

let studentsCache = [];
let staffCache = [];
let resetRequestsCache = [];

let currentEditingStudentId = "";
let currentEditingStaffId = "";


/* =========================================================
   CONFIG CHECK
========================================================= */

function checkConfig() {

    if (typeof CONFIG === "undefined") {

        console.error(
            "ADMIN DASHBOARD: CONFIG NOT FOUND"
        );

        showMessage(
            "ไม่พบ config.js",
            "error"
        );

        return false;
    }


    if (!CONFIG.API_URL) {

        console.error(
            "ADMIN DASHBOARD: API_URL NOT FOUND"
        );

        showMessage(
            "ไม่พบ API_URL",
            "error"
        );

        return false;
    }


    if (!CONFIG.ADMIN_SESSION_KEY) {

        console.error(
            "ADMIN DASHBOARD: ADMIN_SESSION_KEY NOT FOUND"
        );

        showMessage(
            "ไม่พบ ADMIN_SESSION_KEY",
            "error"
        );

        return false;
    }


    return true;
}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "ADMIN DASHBOARD JS READY"
        );


        if (!checkConfig()) {

            return;
        }


        setupNavigation();

        setupSidebar();

        setupStudentEvents();

        setupResetEvents();

        setupStaffEvents();

        setupGlobalModalEvents();

        loadAdminDisplay();

        checkAdminSession();

    }
);


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item[data-section]"
        );


    navItems.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const section =
                        button.dataset.section;

                    if (section) {

                        navigateToSection(
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

    const quickActions =
        document.querySelectorAll(
            ".quick-action[data-section]"
        );


    quickActions.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const section =
                        button.dataset.section;

                    if (section) {

                        navigateToSection(
                            section
                        );
                    }

                }
            );

        }
    );

}


function navigateToSection(
    sectionName
) {

    if (!sectionName) {

        return;
    }


    /*
     * ซ่อนทุก section
     */

    const sections =
        document.querySelectorAll(
            ".admin-section"
        );


    sections.forEach(
        function (section) {

            section.classList.remove(
                "active"
            );

        }
    );


    /*
     * แสดง section ที่เลือก
     */

    const target =
        document.getElementById(
            "section-" +
            sectionName
        );


    if (!target) {

        console.warn(
            "ไม่พบ section:",
            sectionName
        );

        return;
    }


    target.classList.add(
        "active"
    );


    /*
     * เปลี่ยน active menu
     */

    const navItems =
        document.querySelectorAll(
            ".nav-item[data-section]"
        );


    navItems.forEach(
        function (item) {

            item.classList.remove(
                "active"
            );


            if (
                item.dataset.section ===
                sectionName
            ) {

                item.classList.add(
                    "active"
                );

            }

        }
    );


    /*
     * เปลี่ยน Title
     */

    updatePageTitle(
        sectionName
    );


    /*
     * Mobile ปิด sidebar
     */

    closeMobileSidebar();


    /*
     * โหลดข้อมูลตามหน้า
     */

    if (
        sectionName ===
        "dashboard"
    ) {

        updateDashboardStats();

    }


    if (
        sectionName ===
        "students"
    ) {

        if (
            studentsCache.length === 0
        ) {

            loadStudents();

        }

    }


    if (
        sectionName ===
        "reset-password"
    ) {

        loadResetRequests();

    }


    if (
        sectionName ===
        "staff"
    ) {

        if (
            staffCache.length === 0
        ) {

            loadStaff();

        }

    }

}


function updatePageTitle(
    section
) {

    const title =
        document.getElementById(
            "pageTitle"
        );


    const subtitle =
        document.getElementById(
            "pageSubtitle"
        );


    const titles = {

        dashboard: [
            "Dashboard",
            "ภาพรวมระบบ"
        ],

        students: [
            "ข้อมูลนักศึกษา",
            "จัดการข้อมูลนักศึกษา"
        ],

        "add-student": [
            "เพิ่มนักศึกษา",
            "เพิ่มข้อมูลนักศึกษาใหม่"
        ],

        "reset-password": [
            "รีเซ็ตรหัสผ่าน",
            "จัดการคำร้องรีเซ็ตรหัสผ่าน"
        ],

        staff: [
            "จัดการ Staff",
            "จัดการผู้ดูแลระบบและเจ้าหน้าที่"
        ],

        "add-staff": [
            "เพิ่ม Staff",
            "เพิ่มเจ้าหน้าที่เข้าสู่ระบบ"
        ]

    };


    const data =
        titles[section] ||
        titles.dashboard;


    if (title) {

        title.textContent =
            data[0];

    }


    if (subtitle) {

        subtitle.textContent =
            data[1];

    }

}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function setupSidebar() {

    const toggle =
        document.getElementById(
            "sidebarToggle"
        );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (toggle) {

        toggle.addEventListener(
            "click",
            function () {

                const sidebar =
                    document.getElementById(
                        "adminSidebar"
                    );


                if (!sidebar) {

                    return;
                }


                sidebar.classList.toggle(
                    "open"
                );


                if (overlay) {

                    overlay.classList.toggle(
                        "show"
                    );

                }

            }
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeMobileSidebar
        );

    }

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


/* =========================================================
   ADMIN SESSION
========================================================= */

async function checkAdminSession() {

    const token =
        getAdminToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    loadAdminDisplay();


    /*
     * ตรวจ Session กับ API
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

                return;
            }


            /*
             * API อาจส่งข้อมูลผิดรูปแบบ
             * แต่ถ้าไม่ได้แจ้ง Session หมดอายุ
             * ให้พยายามโหลดข้อมูลต่อ
             */

            console.warn(
                "Admin session verification returned:",
                result
            );

        }


        /*
         * โหลดข้อมูลหลัก
         */

        await Promise.allSettled([

            loadStudents(),

            loadStaff(),

            loadResetRequests()

        ]);


        updateDashboardStats();


    } catch (error) {

        console.error(
            "CHECK ADMIN SESSION ERROR:",
            error
        );


        /*
         * กรณี Network error
         * ไม่ลบ Session ทันที
         */

        showMessage(
            "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองรีเฟรชหน้า",
            "error"
        );

    }

}


/* =========================================================
   ADMIN DISPLAY
========================================================= */

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
            admin.full_name ||
            admin.username ||
            "Admin";


        const role =
            admin.role ||
            "ADMIN";


        const nameElement =
            document.getElementById(
                "adminName"
            );


        const roleElement =
            document.getElementById(
                "adminRole"
            );


        const topbarName =
            document.getElementById(
                "topbarAdminName"
            );


        if (nameElement) {

            nameElement.textContent =
                name;

        }


        if (roleElement) {

            roleElement.textContent =
                role;

        }


        if (topbarName) {

            topbarName.textContent =
                name;

        }

    } catch (error) {

        console.error(
            "ADMIN DISPLAY ERROR:",
            error
        );

    }

}


/* =========================================================
   API
========================================================= */

async function apiRequest(
    payload
) {

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
            "API INVALID JSON:",
            text
        );


        throw new Error(
            "API ส่งข้อมูลไม่ใช่ JSON"
        );

    }


    console.log(
        "ADMIN API:",
        payload.action,
        result
    );


    return result;

}


/* =========================================================
   SESSION HELPERS
========================================================= */

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


    const code =
        String(
            result.code ||
            result.errorCode ||
            ""
        )
        .toUpperCase();


    const message =
        String(
            result.message ||
            result.error ||
            ""
        )
        .toLowerCase();


    return (

        code ===
        "ADMIN_SESSION_EXPIRED"

        ||

        code ===
        "SESSION_EXPIRED"

        ||

        message.includes(
            "session"
        )
        &&
        (
            message.includes(
                "expired"
            )
            ||
            message.includes(
                "หมดอายุ"
            )
        )

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
   STUDENT EVENTS
========================================================= */

function setupStudentEvents() {

    const search =
        document.getElementById(
            "studentSearch"
        );


    if (search) {

        search.addEventListener(
            "input",
            function () {

                renderStudents(
                    search.value
                );

            }
        );

    }


    const refresh =
        document.getElementById(
            "refreshStudentsBtn"
        );


    if (refresh) {

        refresh.addEventListener(
            "click",
            loadStudents
        );

    }


    const addButton =
        document.getElementById(
            "addStudentBtn"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            function () {

                navigateToSection(
                    "add-student"
                );


                resetStudentAddForm();

            }
        );

    }


    const form =
        document.getElementById(
            "studentForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            handleAddStudent
        );

    }


    const resetForm =
        document.getElementById(
            "resetStudentFormBtn"
        );


    if (resetForm) {

        resetForm.addEventListener(
            "click",
            function () {

                setTimeout(
                    resetStudentAddForm,
                    0
                );

            }
        );

    }


    const editForm =
        document.getElementById(
            "studentEditForm"
        );


    if (editForm) {

        editForm.addEventListener(
            "submit",
            handleUpdateStudent
        );

    }


    const closeEdit =
        document.getElementById(
            "closeStudentEditModal"
        );


    if (closeEdit) {

        closeEdit.addEventListener(
            "click",
            closeStudentEditModal
        );

    }


    const cancelEdit =
        document.getElementById(
            "cancelStudentEdit"
        );


    if (cancelEdit) {

        cancelEdit.addEventListener(
            "click",
            closeStudentEditModal
        );

    }

}


/* =========================================================
   LOAD STUDENTS
========================================================= */

async function loadStudents() {

    const tbody =
        document.getElementById(
            "studentsTableBody"
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

            <td
                colspan="9"
                class="loading-row"
            >
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
                : Array.isArray(
                    result.data
                )
                    ? result.data
                    : [];


        renderStudents();


        updateDashboardStats();

    } catch (error) {

        console.error(
            "LOAD STUDENTS ERROR:",
            error
        );


        tbody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="error-row"
                >
                    ${escapeHtml(
                        error.message ||
                        "ไม่สามารถโหลดข้อมูลนักศึกษาได้"
                    )}
                </td>

            </tr>

        `;


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
                    colspan="9"
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
   STUDENT ROW
========================================================= */

function createStudentRow(
    student
) {

    const id =
        String(
            student.student_id ||
            ""
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

            <td data-label="รหัสนักศึกษา">

                <strong>
                    ${escapeHtml(id)}
                </strong>

            </td>


            <td data-label="ชื่อ-นามสกุล">

                ${escapeHtml(
                    fullname || "-"
                )}

            </td>


            <td data-label="English Name">

                ${escapeHtml(
                    englishName || "-"
                )}

            </td>


            <td data-label="แผนก">

                ${escapeHtml(
                    department
                )}

            </td>


            <td data-label="โทรศัพท์">

                ${escapeHtml(
                    phone
                )}

            </td>


            <td data-label="สถานะ">

                <span
                    class="status-badge ${getStatusClass(status)}"
                >
                    ${escapeHtml(
                        status
                    )}
                </span>

            </td>


            <td data-label="วันออกบัตร">

                ${escapeHtml(
                    issueDate
                )}

            </td>


            <td data-label="วันหมดอายุ">

                ${escapeHtml(
                    expireDate
                )}

            </td>


            <td data-label="จัดการ">

                <div class="action-buttons">

                    <button
                        type="button"
                        class="small-btn edit-btn"
                        data-action="edit-student"
                        data-id="${escapeHtml(id)}"
                    >
                        แก้ไข
                    </button>


                    <button
                        type="button"
                        class="small-btn reset-btn"
                        data-action="reset-student"
                        data-id="${escapeHtml(id)}"
                    >
                        รีเซ็ตรหัสผ่าน
                    </button>

                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   STUDENT TABLE CLICK
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const editButton =
            event.target.closest(
                '[data-action="edit-student"]'
            );


        if (editButton) {

            const id =
                editButton.dataset.id;

            editStudent(
                id
            );

            return;
        }


        const resetButton =
            event.target.closest(
                '[data-action="reset-student"]'
            );


        if (resetButton) {

            const id =
                resetButton.dataset.id;

            openDirectStudentReset(
                id
            );

        }


        const resetRequestButton =
            event.target.closest(
                '[data-action="reset-request"]'
            );


        if (resetRequestButton) {

            const requestId =
                resetRequestButton.dataset.id;

            openResetRequestModal(
                requestId
            );

        }


        const editStaffButton =
            event.target.closest(
                '[data-action="edit-staff"]'
            );


        if (editStaffButton) {

            const staffId =
                editStaffButton.dataset.id;

            editStaff(
                staffId
            );

        }

    }
);


/* =========================================================
   ADD STUDENT
========================================================= */

async function handleAddStudent(
    event
) {

    event.preventDefault();


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;
    }


    const student = {

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
            ),

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


    if (
        !student.student_id
    ) {

        showMessage(
            "กรุณากรอกรหัสนักศึกษา",
            "error"
        );

        return;
    }


    if (
        !student.password
    ) {

        showMessage(
            "กรุณากรอกรหัสผ่านเริ่มต้น",
            "error"
        );

        return;
    }


    if (
        !student.firstname_th
    ) {

        showMessage(
            "กรุณากรอกชื่อ",
            "error"
        );

        return;
    }


    if (
        !student.lastname_th
    ) {

        showMessage(
            "กรุณากรอกนามสกุล",
            "error"
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


    try {

        const result =
            await apiRequest({

                action:
                    "adminAddStudent",

                token:
                    token,

                ...student

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
                    : "เพิ่มนักศึกษาไม่สำเร็จ"
            );

        }


        showMessage(
            "เพิ่มนักศึกษาสำเร็จ",
            "success"
        );


        resetStudentAddForm();


        await loadStudents();


        navigateToSection(
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

    }

}


/* =========================================================
   RESET ADD STUDENT FORM
========================================================= */

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


/* =========================================================
   EDIT STUDENT
========================================================= */

function editStudent(
    studentId
) {

    const student =
        studentsCache.find(
            function (item) {

                return String(
                    item.student_id
                )
                ===
                String(
                    studentId
                );

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
        String(
            student.student_id
        );


    setValue(
        "editStudentId",
        student.student_id
    );


    setValue(
        "editStudentIdDisplay",
        student.student_id
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


    openModal(
        "studentEditModal"
    );

}


/* =========================================================
   UPDATE STUDENT
========================================================= */

async function handleUpdateStudent(
    event
) {

    event.preventDefault();


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;
    }


    const studentId =
        getValue(
            "editStudentId"
        );


    if (!studentId) {

        showMessage(
            "ไม่พบรหัสนักศึกษา",
            "error"
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


    try {

        const result =
            await apiRequest({

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
                    ),

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
                    : "แก้ไขข้อมูลไม่สำเร็จ"
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
   CLOSE STUDENT EDIT MODAL
========================================================= */

function closeStudentEditModal() {

    closeModal(
        "studentEditModal"
    );


    currentEditingStudentId =
        "";

}


/* =========================================================
   DIRECT STUDENT RESET
========================================================= */

async function openDirectStudentReset(
    studentId
) {

    const student =
        studentsCache.find(
            function (item) {

                return String(
                    item.student_id
                )
                ===
                String(
                    studentId
                );

            }
        );


    const name =
        student
            ? [

                student.firstname_th,
                student.lastname_th

            ]
            .filter(Boolean)
            .join(" ")
            : "";


    const confirmed =
        confirm(

            "ต้องการรีเซ็ตรหัสผ่านนักศึกษาหรือไม่?\n\n" +

            "รหัสนักศึกษา: " +
            studentId +

            (
                name
                    ? "\nชื่อ: " +
                      name
                    : ""
            ) +

            "\n\nรหัสผ่านใหม่จะเป็น 123456"

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
            "รีเซ็ตรหัสผ่านสำเร็จ รหัสผ่านใหม่คือ 123456",
            "success"
        );


    } catch (error) {

        console.error(
            "DIRECT RESET ERROR:",
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
   RESET PASSWORD EVENTS
========================================================= */

function setupResetEvents() {

    const refresh =
        document.getElementById(
            "refreshResetBtn"
        );


    if (refresh) {

        refresh.addEventListener(
            "click",
            loadResetRequests
        );

    }


    const form =
        document.getElementById(
            "resetPasswordForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            handleResetRequest
        );

    }


    const close =
        document.getElementById(
            "closeResetPasswordModal"
        );


    if (close) {

        close.addEventListener(
            "click",
            closeResetPasswordModal
        );

    }


    const cancel =
        document.getElementById(
            "cancelResetPassword"
        );


    if (cancel) {

        cancel.addEventListener(
            "click",
            closeResetPasswordModal
        );

    }

}


/* =========================================================
   LOAD PASSWORD RESET REQUESTS
========================================================= */

async function loadResetRequests() {

    const tbody =
        document.getElementById(
            "resetRequestsTableBody"
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

            <td
                colspan="6"
                class="loading-row"
            >
                กำลังโหลดคำร้องรีเซ็ตรหัสผ่าน...
            </td>

        </tr>

    `;


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
                : Array.isArray(
                    result.resetRequests
                )
                    ? result.resetRequests
                    : Array.isArray(
                        result.data
                    )
                        ? result.data
                        : [];


        renderResetRequests();


        updateDashboardStats();


    } catch (error) {

        console.error(
            "LOAD RESET REQUESTS ERROR:",
            error
        );


        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="error-row"
                >
                    ${escapeHtml(
                        error.message ||
                        "ไม่สามารถโหลดคำร้องได้"
                    )}
                </td>

            </tr>

        `;


        showMessage(
            error.message ||
            "ไม่สามารถโหลดคำร้องรีเซ็ตรหัสผ่านได้",
            "error"
        );

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
                    class="empty-row"
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


/* =========================================================
   RESET REQUEST ROW
========================================================= */

function createResetRequestRow(
    request
) {

    const requestId =
        request.request_id ||
        request.id ||
        "-";


    const studentId =
        request.student_id ||
        "-";


    const reason =
        request.reason ||
        "-";


    const requestedAt =
        request.requested_at ||
        request.created_at ||
        "-";


    const status =
        request.status ||
        "PENDING";


    const normalizedStatus =
        String(
            status
        )
        .trim()
        .toUpperCase();


    const canProcess =
        normalizedStatus !==
            "RESET"
        &&
        normalizedStatus !==
            "COMPLETED"
        &&
        normalizedStatus !==
            "DONE";


    return `

        <tr>

            <td data-label="เลขที่คำร้อง">

                <strong>
                    ${escapeHtml(
                        requestId
                    )}
                </strong>

            </td>


            <td data-label="รหัสนักศึกษา">

                ${escapeHtml(
                    studentId
                )}

            </td>


            <td data-label="เหตุผล">

                ${escapeHtml(
                    reason
                )}

            </td>


            <td data-label="วันที่ร้องขอ">

                ${escapeHtml(
                    formatDateTime(
                        requestedAt
                    )
                )}

            </td>


            <td data-label="สถานะ">

                <span
                    class="status-badge ${getResetStatusClass(status)}"
                >
                    ${escapeHtml(
                        status
                    )}
                </span>

            </td>


            <td data-label="ดำเนินการ">

                ${
                    canProcess

                        ?

                    `
                    <button
                        type="button"
                        class="small-btn reset-btn"
                        data-action="reset-request"
                        data-id="${escapeHtml(
                            requestId
                        )}"
                    >
                        รีเซ็ตรหัสผ่าน
                    </button>
                    `

                        :

                    `
                    <span class="muted-text">
                        ดำเนินการแล้ว
                    </span>
                    `
                }

            </td>

        </tr>

    `;

}


/* =========================================================
   OPEN RESET REQUEST MODAL
========================================================= */

function openResetRequestModal(
    requestId
) {

    const request =
        resetRequestsCache.find(
            function (item) {

                return String(
                    item.request_id ||
                    item.id ||
                    ""
                )
                ===
                String(
                    requestId
                );

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
        request.request_id ||
        request.id ||
        ""
    );


    setValue(
        "resetStudentId",
        request.student_id ||
        ""
    );


    setValue(
        "newPassword",
        "123456"
    );


    setValue(
        "resetNote",
        ""
    );


    openModal(
        "resetPasswordModal"
    );

}


/* =========================================================
   HANDLE RESET REQUEST
========================================================= */

async function handleResetRequest(
    event
) {

    event.preventDefault();


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;
    }


    const requestId =
        getValue(
            "resetRequestId"
        );


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
            "กรุณากรอกรหัสผ่านใหม่",
            "error"
        );

        return;
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


    try {

        const result =
            await apiRequest({

                action:
                    "adminProcessPasswordResetRequest",

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
                    : "ดำเนินการรีเซ็ตรหัสผ่านไม่สำเร็จ"
            );

        }


        showMessage(
            "รีเซ็ตรหัสผ่านสำเร็จ",
            "success"
        );


        closeResetPasswordModal();


        await loadResetRequests();


    } catch (error) {

        console.error(
            "PROCESS RESET REQUEST ERROR:",
            error
        );


        showMessage(
            error.message ||
            "ดำเนินการรีเซ็ตรหัสผ่านไม่สำเร็จ",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "รีเซ็ตรหัสผ่าน"
        );

    }

}


/* =========================================================
   CLOSE RESET MODAL
========================================================= */

function closeResetPasswordModal() {

    closeModal(
        "resetPasswordModal"
    );


    setValue(
        "resetRequestId",
        ""
    );


    setValue(
        "resetStudentId",
        ""
    );


    setValue(
        "newPassword",
        ""
    );


    setValue(
        "resetNote",
        ""
    );

}


/* =========================================================
   STAFF EVENTS
========================================================= */

function setupStaffEvents() {

    const refresh =
        document.getElementById(
            "refreshStaffBtn"
        );


    if (refresh) {

        refresh.addEventListener(
            "click",
            loadStaff
        );

    }


    const addButton =
        document.getElementById(
            "addStaffBtn"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            function () {

                navigateToSection(
                    "add-staff"
                );


                resetStaffAddForm();

            }
        );

    }


    const form =
        document.getElementById(
            "staffForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            handleAddStaff
        );

    }


    const editForm =
        document.getElementById(
            "staffEditForm"
        );


    if (editForm) {

        editForm.addEventListener(
            "submit",
            handleUpdateStaff
        );

    }


    const closeEdit =
        document.getElementById(
            "closeStaffEditModal"
        );


    if (closeEdit) {

        closeEdit.addEventListener(
            "click",
            closeStaffEditModal
        );

    }


    const cancelEdit =
        document.getElementById(
            "cancelStaffEdit"
        );


    if (cancelEdit) {

        cancelEdit.addEventListener(
            "click",
            closeStaffEditModal
        );

    }


    const resetForm =
        document.getElementById(
            "resetStaffFormBtn"
        );


    if (resetForm) {

        resetForm.addEventListener(
            "click",
            function () {

                setTimeout(
                    resetStaffAddForm,
                    0
                );

            }
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

            <td
                colspan="6"
                class="loading-row"
            >
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
                    : "โหลด Staff ไม่สำเร็จ"
            );

        }


        staffCache =
            Array.isArray(
                result.staff
            )
                ? result.staff
                : Array.isArray(
                    result.data
                )
                    ? result.data
                    : [];


        renderStaff();


        updateDashboardStats();


    } catch (error) {

        console.error(
            "LOAD STAFF ERROR:",
            error
        );


        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="error-row"
                >
                    ${escapeHtml(
                        error.message ||
                        "ไม่สามารถโหลด Staff ได้"
                    )}
                </td>

            </tr>

        `;


        showMessage(
            error.message ||
            "ไม่สามารถโหลดข้อมูล Staff ได้",
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
                    class="empty-row"
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
                function (staff) {

                    const id =
                        staff.admin_id ||
                        staff.id ||
                        "";


                    return `

                        <tr>

                            <td data-label="Admin ID">

                                ${escapeHtml(
                                    id || "-"
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
                                    staff.full_name ||
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


                            <td data-label="จัดการ">

                                <div class="action-buttons">

                                    <button
                                        type="button"
                                        class="small-btn edit-btn"
                                        data-action="edit-staff"
                                        data-id="${escapeHtml(
                                            id
                                        )}"
                                    >
                                        แก้ไข
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

async function handleAddStaff(
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
        getValue(
            "staffUsername"
        );


    const password =
        getValue(
            "staffPassword"
        );


    const name =
        getValue(
            "staffName"
        );


    const role =
        getValue(
            "staffRole"
        );


    const status =
        getValue(
            "staffStatus"
        );


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
            "เพิ่ม Staff สำเร็จ",
            "success"
        );


        resetStaffAddForm();


        await loadStaff();


        navigateToSection(
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

    }

}


/* =========================================================
   RESET STAFF FORM
========================================================= */

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


/* =========================================================
   EDIT STAFF
========================================================= */

function editStaff(
    staffId
) {

    const staff =
        staffCache.find(
            function (item) {

                const id =
                    item.admin_id ||
                    item.id ||
                    "";


                return String(
                    id
                )
                ===
                String(
                    staffId
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


    currentEditingStaffId =
        String(
            staff.admin_id ||
            staff.id ||
            ""
        );


    setValue(
        "editStaffId",
        currentEditingStaffId
    );


    setValue(
        "editStaffUsername",
        staff.username ||
        ""
    );


    setValue(
        "editStaffName",
        staff.name ||
        staff.full_name ||
        ""
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


    openModal(
        "staffEditModal"
    );

}


/* =========================================================
   UPDATE STAFF
========================================================= */

async function handleUpdateStaff(
    event
) {

    event.preventDefault();


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;
    }


    const adminId =
        getValue(
            "editStaffId"
        );


    if (!adminId) {

        showMessage(
            "ไม่พบ Admin ID",
            "error"
        );

        return;
    }


    const name =
        getValue(
            "editStaffName"
        );


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


    setButtonLoading(
        button,
        true,
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

                username:
                    getValue(
                        "editStaffUsername"
                    ),

                name:
                    name,

                role:
                    getValue(
                        "editStaffRole"
                    ),

                status:
                    getValue(
                        "editStaffStatus"
                    )

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

    }

}


/* =========================================================
   CLOSE STAFF MODAL
========================================================= */

function closeStaffEditModal() {

    closeModal(
        "staffEditModal"
    );


    currentEditingStaffId =
        "";

}


/* =========================================================
   GLOBAL MODAL EVENTS
========================================================= */

function setupGlobalModalEvents() {

    const modalIds = [

        "studentEditModal",

        "resetPasswordModal",

        "staffEditModal"

    ];


    modalIds.forEach(
        function (id) {

            const modal =
                document.getElementById(
                    id
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

                        closeModal(
                            id
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   DASHBOARD STATS
========================================================= */

function updateDashboardStats() {

    const totalStudents =
        document.getElementById(
            "totalStudents"
        );


    const activeStudents =
        document.getElementById(
            "activeStudents"
        );


    const totalStaff =
        document.getElementById(
            "totalStaff"
        );


    const pendingResets =
        document.getElementById(
            "pendingResets"
        );


    if (totalStudents) {

        totalStudents.textContent =
            studentsCache.length;

    }


    const activeCount =
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


    if (activeStudents) {

        activeStudents.textContent =
            activeCount;

    }


    if (totalStaff) {

        totalStaff.textContent =
            staffCache.length;

    }


    const pendingCount =
        resetRequestsCache.filter(
            function (request) {

                const status =
                    String(
                        request.status ||
                        "PENDING"
                    )
                    .trim()
                    .toUpperCase();


                return (

                    status !==
                    "RESET"

                    &&

                    status !==
                    "COMPLETED"

                    &&

                    status !==
                    "DONE"

                );

            }
        ).length;


    if (pendingResets) {

        pendingResets.textContent =
            pendingCount;

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function handleLogout() {

    const confirmed =
        confirm(
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
            "ADMIN LOGOUT API ERROR:",
            error
        );

    }


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


/* =========================================================
   LOGOUT EVENT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const logout =
            document.getElementById(
                "logoutBtn"
            );


        if (logout) {

            logout.addEventListener(
                "click",
                handleLogout
            );

        }

    }
);


/* =========================================================
   MODAL HELPERS
========================================================= */

function openModal(
    id
) {

    const modal =
        document.getElementById(
            id
        );


    if (!modal) {

        console.warn(
            "ไม่พบ Modal:",
            id
        );

        return;
    }


    modal.classList.add(
        "show"
    );


    document.body.classList.add(
        "modal-open"
    );

}


function closeModal(
    id
) {

    const modal =
        document.getElementById(
            id
        );


    if (!modal) {

        return;
    }


    modal.classList.remove(
        "show"
    );


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   INPUT HELPERS
========================================================= */

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
        element.value ||
        ""
    )
    .trim();

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
        value === null ||
        value === undefined
            ? ""
            : value;

}


/* =========================================================
   BUTTON LOADING
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
    type
) {

    const box =
        document.getElementById(
            "messageBox"
        );


    if (!box) {

        console.log(
            "MESSAGE:",
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


/* =========================================================
   DATE
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
        String(
            value
        )
        .trim();


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


    if (
        /^\d{4}-\d{2}-\d{2}/.test(
            text
        )
    ) {

        const parts =
            text.substring(
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


function convertToInputDate(
    value
) {

    if (!value) {

        return "";
    }


    const text =
        String(
            value
        )
        .trim();


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            text
        )
    ) {

        return text;

    }


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


/* =========================================================
   STATUS
========================================================= */

function getStatusClass(
    status
) {

    const value =
        String(
            status ||
            ""
        )
        .trim()
        .toUpperCase();


    if (
        value ===
        "ACTIVE"
        ||
        value ===
        "นักศึกษาปกติ"
    ) {

        return "status-active";

    }


    if (
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


    return "status-default";

}


function getResetStatusClass(
    status
) {

    const value =
        String(
            status ||
            ""
        )
        .trim()
        .toUpperCase();


    if (
        value ===
        "RESET"
        ||
        value ===
        "COMPLETED"
        ||
        value ===
        "DONE"
    ) {

        return "status-active";

    }


    if (
        value ===
        "PENDING"
    ) {

        return "status-default";

    }


    if (
        value ===
        "CANCELLED"
        ||
        value ===
        "REJECTED"
    ) {

        return "status-inactive";

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


/* =========================================================
   GLOBAL FUNCTIONS
   เผื่อ HTML / Browser เรียกใช้โดยตรง
========================================================= */

window.navigateToSection =
    navigateToSection;


window.editStudent =
    editStudent;


window.editStaff =
    editStaff;


window.openDirectStudentReset =
    openDirectStudentReset;


window.openResetRequestModal =
    openResetRequestModal;


window.openModal =
    openModal;


window.closeModal =
    closeModal;


window.loadStudents =
    loadStudents;


window.loadStaff =
    loadStaff;


window.loadResetRequests =
    loadResetRequests;


window.handleLogout =
    handleLogout;


/************************************************************
 * END
 ************************************************************/
