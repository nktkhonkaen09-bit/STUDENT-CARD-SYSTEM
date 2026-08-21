"use strict";

/*
 * ============================================================
 * STUDENT CARD SYSTEM
 * ADMIN DASHBOARD
 * ============================================================
 *
 * ใช้งานร่วมกับ:
 *   - js/config.js
 *   - admin-dashboard.html
 *   - Code.gs
 *
 * IMPORTANT
 * ------------------------------------------------------------
 * HTML ชุดปัจจุบันใช้:
 *
 * Student:
 *   section-students
 *   section-add-student
 *   studentModal
 *   studentModalForm
 *
 * Staff:
 *   section-staff
 *   staffModal
 *   staffForm
 *
 * Password Reset:
 *   section-reset-requests
 *   resetRequestModal
 *
 * ห้ามเปลี่ยนชื่อ ID เหล่านี้โดยไม่แก้ JS
 * ============================================================
 */


/* ============================================================
   GLOBAL STATE
============================================================ */

let studentsCache = [];
let staffCache = [];
let resetRequestsCache = [];

let currentSection = "dashboard";

let currentStudentMode = "add";
let currentEditStudentId = "";

let currentStaffMode = "add";
let currentEditStaffId = "";

let currentResetRequestId = "";


/* ============================================================
   DOM READY
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "ADMIN DASHBOARD JS READY"
        );

        if (
            typeof CONFIG ===
            "undefined"
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


        if (
            !CONFIG.API_URL
        ) {

            console.error(
                "CONFIG.API_URL NOT FOUND"
            );

            showMessage(
                "ไม่พบ CONFIG.API_URL",
                "error"
            );

            return;
        }


        bindEvents();

        checkAdminSession();

    }
);


/* ============================================================
   EVENT BINDING
============================================================ */

function bindEvents() {


    /*
     * ---------------------------------------------------------
     * NAVIGATION
     * ---------------------------------------------------------
     */

    document
        .querySelectorAll(
            ".nav-item, .quick-action"
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

                        if (
                            section ===
                            "add-staff"
                        ) {

                            openStaffModal(
                                "add"
                            );

                            return;
                        }


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
     * ---------------------------------------------------------
     * SIDEBAR
     * ---------------------------------------------------------
     */

    bindClick(
        "sidebarToggle",
        toggleSidebar
    );


    bindClick(
        "logoutBtn",
        handleLogout
    );


    /*
     * ---------------------------------------------------------
     * STUDENTS
     * ---------------------------------------------------------
     */

    bindClick(
        "addStudentBtn",
        function () {

            switchSection(
                "add-student"
            );

        }
    );


    bindClick(
        "refreshStudentsBtn",
        function () {

            loadStudents();

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


    bindSubmit(
        "studentForm",
        handleAddStudent
    );


    /*
     * ---------------------------------------------------------
     * STUDENT MODAL
     * ---------------------------------------------------------
     */

    bindClick(
        "closeStudentModal",
        closeStudentModal
    );


    bindClick(
        "closeStudentModal2",
        closeStudentModal
    );


    bindSubmit(
        "studentModalForm",
        handleStudentModalSubmit
    );


    /*
     * ---------------------------------------------------------
     * STAFF
     * ---------------------------------------------------------
     */

    bindClick(
        "addStaffBtn",
        function () {

            openStaffModal(
                "add"
            );

        }
    );


    bindClick(
        "refreshStaffBtn",
        function () {

            loadStaff();

        }
    );


    bindClick(
        "closeStaffModal",
        closeStaffModal
    );


    bindClick(
        "closeStaffModal2",
        closeStaffModal
    );


    bindSubmit(
        "staffForm",
        handleStaffSubmit
    );


    /*
     * ---------------------------------------------------------
     * RESET REQUESTS
     * ---------------------------------------------------------
     */

    bindClick(
        "refreshResetRequestsBtn",
        function () {

            loadResetRequests();

        }
    );


    bindClick(
        "closeResetRequestModal",
        closeResetRequestModal
    );


    bindClick(
        "closeResetRequestModal2",
        closeResetRequestModal
    );


    bindClick(
        "processResetRequestBtn",
        processCurrentResetRequest
    );


    /*
     * ---------------------------------------------------------
     * SEARCH
     * ---------------------------------------------------------
     */

    const studentSearch =
        document.getElementById(
            "studentSearch"
        );

    if (studentSearch) {

        studentSearch.addEventListener(
            "input",
            function () {

                renderStudents();

            }
        );

    }


    const staffSearch =
        document.getElementById(
            "staffSearch"
        );

    if (staffSearch) {

        staffSearch.addEventListener(
            "input",
            function () {

                renderStaff();

            }
        );

    }


    const resetSearch =
        document.getElementById(
            "resetRequestSearch"
        );

    if (resetSearch) {

        resetSearch.addEventListener(
            "input",
            function () {

                renderResetRequests();

            }
        );

    }


    const resetFilter =
        document.getElementById(
            "resetRequestStatusFilter"
        );

    if (resetFilter) {

        resetFilter.addEventListener(
            "change",
            function () {

                renderResetRequests();

            }
        );

    }


    /*
     * ---------------------------------------------------------
     * DYNAMIC BUTTONS
     * ---------------------------------------------------------
     */

    document.addEventListener(
        "click",
        handleDynamicClick
    );


    /*
     * ---------------------------------------------------------
     * MODAL BACKDROP
     * ---------------------------------------------------------
     */

    document.addEventListener(
        "click",
        function (event) {

            const target =
                event.target;

            if (
                target.classList &&
                target.classList.contains(
                    "modal"
                )
            ) {

                closeModalElement(
                    target
                );

            }

        }
    );

}


/* ============================================================
   DYNAMIC CLICK
============================================================ */

function handleDynamicClick(event) {

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


    /*
     * STUDENT
     */

    if (
        action ===
        "edit-student"
    ) {

        openStudentModal(
            "edit",
            id
        );

        return;
    }


    if (
        action ===
        "reset-student"
    ) {

        directResetStudentPassword(
            id
        );

        return;
    }


    /*
     * STAFF
     */

    if (
        action ===
        "edit-staff"
    ) {

        openStaffModal(
            "edit",
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
        "toggle-staff"
    ) {

        toggleStaffStatus(
            id
        );

        return;
    }


    /*
     * RESET REQUEST
     */

    if (
        action ===
        "process-reset"
    ) {

        openResetRequestModal(
            id
        );

        return;
    }

}


/* ============================================================
   NAVIGATION
============================================================ */

function switchSection(
    section
) {

    const validSections = [
        "dashboard",
        "students",
        "add-student",
        "staff",
        "reset-requests"
    ];


    /*
     * add-staff ไม่มี section
     * เพราะ HTML ใช้ staffModal
     */

    if (
        section ===
        "add-staff"
    ) {

        openStaffModal(
            "add"
        );

        return;
    }


    if (
        validSections.indexOf(
            section
        ) === -1
    ) {

        console.warn(
            "UNKNOWN ADMIN SECTION:",
            section
        );

        return;
    }


    const sectionElement =
        document.getElementById(
            "section-" +
            section
        );


    if (!sectionElement) {

        console.error(
            "SECTION NOT FOUND:",
            "section-" + section
        );

        showMessage(
            "ไม่พบส่วนเมนู " +
            section,
            "error"
        );

        return;
    }


    /*
     * ซ่อนทุก section
     */

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


    /*
     * แสดง section
     */

    sectionElement.classList.add(
        "active"
    );


    /*
     * ACTIVE NAV
     */

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            function (item) {

                item.classList.remove(
                    "active"
                );


                if (
                    item.getAttribute(
                        "data-section"
                    ) === section
                ) {

                    item.classList.add(
                        "active"
                    );

                }

            }
        );


    currentSection =
        section;


    /*
     * PAGE TITLE
     */

    updatePageTitle(
        section
    );


    /*
     * ปิด sidebar บนมือถือ
     */

    closeMobileSidebar();


    /*
     * โหลดข้อมูลเมื่อเข้า section
     */

    if (
        section ===
        "students"
    ) {

        renderStudents();

    }


    if (
        section ===
        "staff"
    ) {

        renderStaff();

    }


    if (
        section ===
        "reset-requests"
    ) {

        renderResetRequests();

    }

}


/* ============================================================
   PAGE TITLE
============================================================ */

function updatePageTitle(
    section
) {

    const titles = {

        dashboard: [
            "Dashboard",
            "ภาพรวมระบบจัดการนักศึกษาและ Staff"
        ],

        students: [
            "ข้อมูลนักศึกษา",
            "ค้นหา แก้ไข และจัดการข้อมูลนักศึกษา"
        ],

        "add-student": [
            "เพิ่มนักศึกษา",
            "เพิ่มข้อมูลนักศึกษาใหม่เข้าสู่ระบบ"
        ],

        staff: [
            "จัดการ Staff",
            "เพิ่ม แก้ไข เปิด/ปิด และจัดการบัญชี Staff"
        ],

        "reset-requests": [
            "Password Reset Requests",
            "จัดการคำขอรีเซ็ตรหัสผ่านจากนักศึกษา"
        ]

    };


    const data =
        titles[section];


    if (!data) {
        return;
    }


    setText(
        "pageTitle",
        data[0]
    );


    setText(
        "pageSubtitle",
        data[1]
    );

}


/* ============================================================
   ADMIN SESSION
============================================================ */

async function checkAdminSession() {

    const token =
        getAdminToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    loadAdminDisplay();


    setConnectionStatus(
        "กำลังตรวจสอบระบบ..."
    );


    try {

        /*
         * ใช้ GET STUDENTS ตรวจ Session
         */

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
                    : "ไม่สามารถตรวจสอบ Session ได้"
            );

        }


        studentsCache =
            Array.isArray(
                result.students
            )
                ? result.students
                : [];


        renderStudents();


        /*
         * โหลดข้อมูล Staff
         */

        await loadStaff();


        /*
         * โหลด Reset Requests
         */

        await loadResetRequests();


        updateDashboardStats();


        setConnectionStatus(
            "● ระบบพร้อมใช้งาน"
        );


        console.log(
            "ADMIN SESSION OK"
        );

    }
    catch (error) {

        console.error(
            "ADMIN DASHBOARD INIT ERROR",
            error
        );


        setConnectionStatus(
            "● เชื่อมต่อระบบมีปัญหา"
        );


        showMessage(
            error.message ||
            "ไม่สามารถโหลดข้อมูล Admin Dashboard ได้",
            "error"
        );

    }

}


/* ============================================================
   ADMIN DISPLAY
============================================================ */

function loadAdminDisplay() {

    const key =
        CONFIG.ADMIN_KEY;


    if (!key) {
        return;
    }


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

    }
    catch (error) {

        console.warn(
            "ADMIN DISPLAY ERROR",
            error
        );

    }

}


/* ============================================================
   API REQUEST
============================================================ */

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
            "ไม่พบ CONFIG.API_URL"
        );

    }


    console.log(
        "ADMIN API REQUEST:",
        data.action
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
                        data
                    )
            }
        );


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

    }
    catch (error) {

        console.error(
            "API INVALID JSON:",
            text
        );

        throw new Error(
            "API ส่งข้อมูลกลับมาไม่ถูกต้อง"
        );

    }


    console.log(
        "ADMIN API:",
        data.action,
        result
    );


    return result;

}


/* ============================================================
   LOAD STUDENTS
============================================================ */

async function loadStudents() {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const tbody =
        document.getElementById(
            "studentsTableBody"
        );


    if (tbody) {

        tbody.innerHTML =
            '<tr>' +
            '<td colspan="9" class="loading-row">' +
            'กำลังโหลดข้อมูล...' +
            '</td>' +
            '</tr>';

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

    }
    catch (error) {

        console.error(
            "LOAD STUDENTS ERROR",
            error
        );


        if (tbody) {

            tbody.innerHTML =
                '<tr>' +
                '<td colspan="9" class="loading-row">' +
                escapeHtml(
                    error.message ||
                    "โหลดข้อมูลไม่สำเร็จ"
                ) +
                '</td>' +
                '</tr>';

        }


        showMessage(
            error.message ||
            "โหลดข้อมูลนักศึกษาไม่สำเร็จ",
            "error"
        );

    }

}


/* ============================================================
   RENDER STUDENTS
============================================================ */

function renderStudents() {

    const tbody =
        document.getElementById(
            "studentsTableBody"
        );


    if (!tbody) {
        return;
    }


    const searchInput =
        document.getElementById(
            "studentSearch"
        );


    const keyword =
        searchInput
            ? String(
                searchInput.value ||
                ""
            )
                .trim()
                .toLowerCase()
            : "";


    let rows =
        studentsCache.slice();


    if (keyword) {

        rows =
            rows.filter(
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


                    return text.indexOf(
                        keyword
                    ) !== -1;

                }
            );

    }


    if (!rows.length) {

        tbody.innerHTML =
            '<tr>' +
            '<td colspan="9" class="loading-row">' +
            (
                keyword
                    ? "ไม่พบข้อมูลที่ค้นหา"
                    : "ยังไม่มีข้อมูลนักศึกษา"
            ) +
            '</td>' +
            '</tr>';

        return;

    }


    tbody.innerHTML =
        rows
            .map(
                renderStudentRow
            )
            .join("");

}


/* ============================================================
   STUDENT ROW
============================================================ */

function renderStudentRow(
    student
) {

    const id =
        String(
            student.student_id ||
            ""
        ).trim();


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
        String(
            student.status ||
            ""
        ).trim();


    return `
        <tr>

            <td data-label="รหัสนักศึกษา">
                <strong>
                    ${escapeHtml(id || "-")}
                </strong>
            </td>

            <td data-label="ชื่อ-นามสกุล">
                ${escapeHtml(fullName || "-")}
            </td>

            <td data-label="English Name">
                ${escapeHtml(englishName || "-")}
            </td>

            <td data-label="แผนก">
                ${escapeHtml(
                    student.department || "-"
                )}
            </td>

            <td data-label="โทรศัพท์">
                ${escapeHtml(
                    student.phone || "-"
                )}
            </td>

            <td data-label="สถานะ">
                <span class="status-badge ${statusClass(status)}">
                    ${escapeHtml(status || "-")}
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
                        class="small-btn"
                        data-action="edit-student"
                        data-id="${escapeAttr(id)}"
                    >
                        ✏️ แก้ไข
                    </button>

                    <button
                        type="button"
                        class="small-btn reset-btn"
                        data-action="reset-student"
                        data-id="${escapeAttr(id)}"
                    >
                        🔑 รีเซ็ตรหัสผ่าน
                    </button>

                </div>

            </td>

        </tr>
    `;

}


/* ============================================================
   ADD STUDENT
============================================================ */

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


    if (!data.student_id) {

        showMessage(
            "กรุณากรอกรหัสนักศึกษา",
            "error"
        );

        return;

    }


    if (!data.password) {

        showMessage(
            "กรุณากรอกรหัสผ่าน",
            "error"
        );

        return;

    }


    if (!data.firstname_th) {

        showMessage(
            "กรุณากรอกชื่อ",
            "error"
        );

        return;

    }


    if (!data.lastname_th) {

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
            "เพิ่มนักศึกษาสำเร็จ",
            "success"
        );


        resetStudentAddForm();


        await loadStudents();


        switchSection(
            "students"
        );

    }
    catch (error) {

        console.error(
            "ADD STUDENT ERROR",
            error
        );


        showMessage(
            error.message ||
            "เพิ่มนักศึกษาไม่สำเร็จ",
            "error"
        );

    }
    finally {

        setButtonLoading(
            button,
            false,
            "บันทึกนักศึกษา"
        );

    }

}


/* ============================================================
   RESET ADD STUDENT FORM
============================================================ */

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


/* ============================================================
   STUDENT MODAL
============================================================ */

function openStudentModal(
    mode,
    studentId
) {

    const modal =
        document.getElementById(
            "studentModal"
        );


    const form =
        document.getElementById(
            "studentModalForm"
        );


    if (!modal || !form) {

        console.error(
            "studentModal NOT FOUND"
        );

        showMessage(
            "ไม่พบหน้าต่างแก้ไขนักศึกษา",
            "error"
        );

        return;
    }


    currentStudentMode =
        mode;


    currentEditStudentId =
        "";


    if (
        mode ===
        "add"
    ) {

        setText(
            "studentModalTitle",
            "เพิ่มนักศึกษา"
        );


        form.reset();


        setValue(
            "modalStudentStatus",
            "นักศึกษาปกติ"
        );


        setValue(
            "modalStudentPassword",
            ""
        );


        setReadOnly(
            "modalStudentId",
            false
        );


        modal.classList.add(
            "show"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        return;
    }


    const student =
        studentsCache.find(
            function (item) {

                return String(
                    item.student_id ||
                    ""
                ).trim()
                ===
                String(
                    studentId ||
                    ""
                ).trim();

            }
        );


    if (!student) {

        showMessage(
            "ไม่พบข้อมูลนักศึกษา",
            "error"
        );

        return;
    }


    currentEditStudentId =
        String(
            student.student_id
        ).trim();


    setText(
        "studentModalTitle",
        "แก้ไขข้อมูลนักศึกษา"
    );


    setValue(
        "modalStudentId",
        student.student_id
    );


    setValue(
        "modalStudentPassword",
        ""
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
        toInputDate(
            student.issue_date
        )
    );


    setValue(
        "modalStudentExpireDate",
        toInputDate(
            student.expire_date
        )
    );


    setValue(
        "modalStudentPhoto",
        student.photo_url
    );


    /*
     * รหัสนักศึกษาแก้ไม่ได้
     */

    setReadOnly(
        "modalStudentId",
        true
    );


    modal.classList.add(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


/* ============================================================
   STUDENT MODAL SUBMIT
============================================================ */

async function handleStudentModalSubmit(
    event
) {

    event.preventDefault();


    if (
        currentStudentMode ===
        "add"
    ) {

        await handleAddStudentFromModal();

        return;

    }


    await handleUpdateStudent();

}


/* ============================================================
   ADD STUDENT FROM MODAL
============================================================ */

async function handleAddStudentFromModal() {

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
                "modalStudentId"
            ),

        password:
            getValue(
                "modalStudentPassword"
            ),

        prefix_th:
            getValue(
                "modalStudentPrefix"
            ),

        firstname_th:
            getValue(
                "modalStudentFirstnameTh"
            ),

        lastname_th:
            getValue(
                "modalStudentLastnameTh"
            ),

        firstname_en:
            getValue(
                "modalStudentFirstnameEn"
            ),

        lastname_en:
            getValue(
                "modalStudentLastnameEn"
            ),

        department:
            getValue(
                "modalStudentDepartment"
            ),

        phone:
            getValue(
                "modalStudentPhone"
            ),

        status:
            getValue(
                "modalStudentStatus"
            ) ||
            "นักศึกษาปกติ",

        issue_date:
            getValue(
                "modalStudentIssueDate"
            ),

        expire_date:
            getValue(
                "modalStudentExpireDate"
            ),

        photo_url:
            getValue(
                "modalStudentPhoto"
            )

    };


    if (!data.student_id) {

        showMessage(
            "กรุณากรอกรหัสนักศึกษา",
            "error"
        );

        return;
    }


    if (!data.password) {

        showMessage(
            "กรุณากรอกรหัสผ่าน",
            "error"
        );

        return;
    }


    if (!data.firstname_th) {

        showMessage(
            "กรุณากรอกชื่อ",
            "error"
        );

        return;
    }


    if (!data.lastname_th) {

        showMessage(
            "กรุณากรอกนามสกุล",
            "error"
        );

        return;
    }


    const button =
        document.getElementById(
            "saveStudentModalBtn"
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


        closeStudentModal();


        await loadStudents();


        switchSection(
            "students"
        );

    }
    catch (error) {

        console.error(
            "ADD STUDENT MODAL ERROR",
            error
        );


        showMessage(
            error.message ||
            "เพิ่มนักศึกษาไม่สำเร็จ",
            "error"
        );

    }
    finally {

        setButtonLoading(
            button,
            false,
            "บันทึก"
        );

    }

}


/* ============================================================
   UPDATE STUDENT
============================================================ */

async function handleUpdateStudent() {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    if (
        !currentEditStudentId
    ) {

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
            currentEditStudentId,

        prefix_th:
            getValue(
                "modalStudentPrefix"
            ),

        firstname_th:
            getValue(
                "modalStudentFirstnameTh"
            ),

        lastname_th:
            getValue(
                "modalStudentLastnameTh"
            ),

        firstname_en:
            getValue(
                "modalStudentFirstnameEn"
            ),

        lastname_en:
            getValue(
                "modalStudentLastnameEn"
            ),

        department:
            getValue(
                "modalStudentDepartment"
            ),

        phone:
            getValue(
                "modalStudentPhone"
            ),

        status:
            getValue(
                "modalStudentStatus"
            ) ||
            "นักศึกษาปกติ",

        issue_date:
            getValue(
                "modalStudentIssueDate"
            ),

        expire_date:
            getValue(
                "modalStudentExpireDate"
            ),

        photo_url:
            getValue(
                "modalStudentPhoto"
            )

    };


    const password =
        getValue(
            "modalStudentPassword"
        );


    if (password) {

        data.password =
            password;

    }


    if (
        !data.firstname_th
    ) {

        showMessage(
            "กรุณากรอกชื่อ",
            "error"
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

        return;
    }


    const button =
        document.getElementById(
            "saveStudentModalBtn"
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
            "แก้ไขข้อมูลนักศึกษาสำเร็จ",
            "success"
        );


        closeStudentModal();


        await loadStudents();


        switchSection(
            "students"
        );

    }
    catch (error) {

        console.error(
            "UPDATE STUDENT ERROR",
            error
        );


        showMessage(
            error.message ||
            "แก้ไขข้อมูลนักศึกษาไม่สำเร็จ",
            "error"
        );

    }
    finally {

        setButtonLoading(
            button,
            false,
            "บันทึก"
        );

    }

}


/* ============================================================
   CLOSE STUDENT MODAL
============================================================ */

function closeStudentModal() {

    const modal =
        document.getElementById(
            "studentModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    currentStudentMode =
        "add";

    currentEditStudentId =
        "";

}


/* ============================================================
   DIRECT STUDENT PASSWORD RESET
============================================================ */

async function directResetStudentPassword(
    studentId
) {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const student =
        studentsCache.find(
            function (item) {

                return String(
                    item.student_id ||
                    ""
                ).trim()
                ===
                String(
                    studentId ||
                    ""
                ).trim();

            }
        );


    if (!student) {

        showMessage(
            "ไม่พบข้อมูลนักศึกษา",
            "error"
        );

        return;
    }


    const ok =
        window.confirm(
            "ต้องการรีเซ็ตรหัสผ่านนักศึกษา " +
            studentId +
            " หรือไม่?\n\n" +
            "ระบบจะใช้รหัสผ่านเริ่มต้นของระบบ"
        );


    if (!ok) {
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
                    String(
                        studentId
                    ).trim(),

                note:
                    "รีเซ็ตรหัสผ่านจากหน้า Admin Dashboard"

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
            result.message ||
            "รีเซ็ตรหัสผ่านสำเร็จ",
            "success"
        );


        /*
         * ไม่แสดง password ในหน้าเว็บ
         * แม้ backend จะส่งกลับมา
         */

        console.log(
            "PASSWORD RESET SUCCESS:",
            result.student_id
        );

    }
    catch (error) {

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


/* ============================================================
   LOAD STAFF
============================================================ */

async function loadStaff() {

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


    if (tbody) {

        tbody.innerHTML =
            '<tr>' +
            '<td colspan="6" class="loading-row">' +
            'กำลังโหลดข้อมูล...' +
            '</td>' +
            '</tr>';

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

    }
    catch (error) {

        console.error(
            "LOAD STAFF ERROR",
            error
        );


        if (tbody) {

            tbody.innerHTML =
                '<tr>' +
                '<td colspan="6" class="loading-row">' +
                escapeHtml(
                    error.message ||
                    "โหลดข้อมูล Staff ไม่สำเร็จ"
                ) +
                '</td>' +
                '</tr>';

        }


        showMessage(
            error.message ||
            "โหลดข้อมูล Staff ไม่สำเร็จ",
            "error"
        );

    }

}


/* ============================================================
   RENDER STAFF
============================================================ */

function renderStaff() {

    const tbody =
        document.getElementById(
            "staffTableBody"
        );


    if (!tbody) {
        return;
    }


    const searchInput =
        document.getElementById(
            "staffSearch"
        );


    const keyword =
        searchInput
            ? String(
                searchInput.value ||
                ""
            )
                .trim()
                .toLowerCase()
            : "";


    let rows =
        staffCache.slice();


    if (keyword) {

        rows =
            rows.filter(
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


                    return text.indexOf(
                        keyword
                    ) !== -1;

                }
            );

    }


    if (!rows.length) {

        tbody.innerHTML =
            '<tr>' +
            '<td colspan="6" class="loading-row">' +
            (
                keyword
                    ? "ไม่พบข้อมูลที่ค้นหา"
                    : "ยังไม่มีข้อมูล Staff"
            ) +
            '</td>' +
            '</tr>';

        return;

    }


    tbody.innerHTML =
        rows
            .map(
                renderStaffRow
            )
            .join("");

}


/* ============================================================
   STAFF ROW
============================================================ */

function renderStaffRow(
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


    const role =
        String(
            staff.role ||
            "STAFF"
        ).trim();


    const status =
        String(
            staff.status ||
            "ACTIVE"
        ).trim();


    const nextStatus =
        status.toUpperCase() ===
        "ACTIVE"
            ? "INACTIVE"
            : "ACTIVE";


    return `
        <tr>

            <td data-label="Admin ID">
                ${escapeHtml(
                    adminId || "-"
                )}
            </td>

            <td data-label="Username">
                <strong>
                    ${escapeHtml(
                        username || "-"
                    )}
                </strong>
            </td>

            <td data-label="ชื่อ">
                ${escapeHtml(
                    staff.name || "-"
                )}
            </td>

            <td data-label="Role">
                <span class="status-badge">
                    ${escapeHtml(
                        role
                    )}
                </span>
            </td>

            <td data-label="สถานะ">
                <span class="status-badge ${statusClass(status)}">
                    ${escapeHtml(
                        status
                    )}
                </span>
            </td>

            <td data-label="จัดการ">

                <div class="action-buttons">

                    <button
                        type="button"
                        class="small-btn"
                        data-action="edit-staff"
                        data-id="${escapeAttr(adminId)}"
                    >
                        ✏️ แก้ไข
                    </button>

                    <button
                        type="button"
                        class="small-btn"
                        data-action="toggle-staff"
                        data-id="${escapeAttr(adminId)}"
                    >
                        ${nextStatus === "ACTIVE"
                            ? "🟢 เปิดใช้งาน"
                            : "⛔ ปิดใช้งาน"}
                    </button>

                    <button
                        type="button"
                        class="small-btn danger-btn"
                        data-action="delete-staff"
                        data-id="${escapeAttr(adminId)}"
                    >
                        🗑️ ลบ
                    </button>

                </div>

            </td>

        </tr>
    `;

}


/* ============================================================
   OPEN STAFF MODAL
============================================================ */

function openStaffModal(
    mode,
    adminId
) {

    const modal =
        document.getElementById(
            "staffModal"
        );


    const form =
        document.getElementById(
            "staffForm"
        );


    if (!modal || !form) {

        console.error(
            "staffModal NOT FOUND"
        );

        showMessage(
            "ไม่พบหน้าต่าง Staff",
            "error"
        );

        return;
    }


    currentStaffMode =
        mode;


    currentEditStaffId =
        "";


    const passwordInput =
        document.getElementById(
            "staffPassword"
        );


    if (
        mode ===
        "add"
    ) {

        setText(
            "staffModalTitle",
            "เพิ่ม Staff"
        );


        form.reset();


        setValue(
            "staffRole",
            "STAFF"
        );


        setValue(
            "staffStatus",
            "ACTIVE"
        );


        if (passwordInput) {

            passwordInput.required =
                true;

        }


        modal.classList.add(
            "show"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        return;
    }


    const staff =
        staffCache.find(
            function (item) {

                return String(
                    item.admin_id ||
                    item.adminId ||
                    ""
                ).trim()
                ===
                String(
                    adminId ||
                    ""
                ).trim();

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


    setText(
        "staffModalTitle",
        "แก้ไข Staff"
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
        staff.status ||
        "ACTIVE"
    );


    /*
     * ไม่ดึง password เดิม
     */

    setValue(
        "staffPassword",
        ""
    );


    if (passwordInput) {

        passwordInput.required =
            false;

    }


    modal.classList.add(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


/* ============================================================
   STAFF SUBMIT
============================================================ */

async function handleStaffSubmit(
    event
) {

    event.preventDefault();


    if (
        currentStaffMode ===
        "add"
    ) {

        await addStaff();

        return;
    }


    await updateStaff();

}


/* ============================================================
   ADD STAFF
============================================================ */

async function addStaff() {

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
        ) ||
        "STAFF";


    const status =
        getValue(
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


    if (
        password.length <
        4
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


    /*
     * Code.gs ชุดปัจจุบันต้องการ admin_id
     * จึงสร้างให้โดยอัตโนมัติ
     */

    const adminId =
        generateAdminId();


    const data = {

        action:
            "adminAddStaff",

        token:
            token,

        admin_id:
            adminId,

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

    };


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
            "เพิ่ม Staff สำเร็จ",
            "success"
        );


        closeStaffModal();


        await loadStaff();


        switchSection(
            "staff"
        );

    }
    catch (error) {

        console.error(
            "ADD STAFF ERROR",
            error
        );


        showMessage(
            error.message ||
            "เพิ่ม Staff ไม่สำเร็จ",
            "error"
        );

    }
    finally {

        setButtonLoading(
            button,
            false,
            "บันทึก Staff"
        );

    }

}


/* ============================================================
   UPDATE STAFF
============================================================ */

async function updateStaff() {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;
    }


    if (
        !currentEditStaffId
    ) {

        showMessage(
            "ไม่พบรหัส Staff",
            "error"
        );

        return;
    }


    const username =
        getValue(
            "staffUsername"
        );


    const name =
        getValue(
            "staffName"
        );


    const role =
        getValue(
            "staffRole"
        ) ||
        "STAFF";


    const status =
        getValue(
            "staffStatus"
        ) ||
        "ACTIVE";


    const password =
        getValue(
            "staffPassword"
        );


    if (!username) {

        showMessage(
            "กรุณากรอก Username",
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


    if (
        password &&
        password.length <
        4
    ) {

        showMessage(
            "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร",
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
            name,

        role:
            role,

        status:
            status

    };


    /*
     * ถ้าไม่กรอก password
     * จะไม่ส่ง password
     */

    if (password) {

        data.password =
            password;

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
            "แก้ไข Staff สำเร็จ",
            "success"
        );


        closeStaffModal();


        await loadStaff();


        switchSection(
            "staff"
        );

    }
    catch (error) {

        console.error(
            "UPDATE STAFF ERROR",
            error
        );


        showMessage(
            error.message ||
            "แก้ไข Staff ไม่สำเร็จ",
            "error"
        );

    }
    finally {

        setButtonLoading(
            button,
            false,
            "บันทึก Staff"
        );

    }

}


/* ============================================================
   TOGGLE STAFF
============================================================ */

async function toggleStaffStatus(
    adminId
) {

    const staff =
        staffCache.find(
            function (item) {

                return String(
                    item.admin_id ||
                    item.adminId ||
                    ""
                ).trim()
                ===
                String(
                    adminId ||
                    ""
                ).trim();

            }
        );


    if (!staff) {

        showMessage(
            "ไม่พบข้อมูล Staff",
            "error"
        );

        return;
    }


    const currentStatus =
        String(
            staff.status ||
            "ACTIVE"
        )
            .trim()
            .toUpperCase();


    const newStatus =
        currentStatus ===
        "ACTIVE"
            ? "INACTIVE"
            : "ACTIVE";


    const username =
        staff.username ||
        "";


    const confirmText =
        newStatus ===
        "ACTIVE"
            ? "ต้องการเปิดใช้งาน Staff " +
              username +
              " หรือไม่?"
            : "ต้องการปิดการใช้งาน Staff " +
              username +
              " หรือไม่?";


    if (
        !window.confirm(
            confirmText
        )
    ) {

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
                    "adminUpdateStaff",

                token:
                    token,

                admin_id:
                    String(
                        adminId
                    ).trim(),

                username:
                    username,

                name:
                    staff.name ||
                    "",

                role:
                    staff.role ||
                    "STAFF",

                status:
                    newStatus

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
                    : "เปลี่ยนสถานะ Staff ไม่สำเร็จ"
            );

        }


        showMessage(
            newStatus ===
            "ACTIVE"
                ? "เปิดใช้งาน Staff สำเร็จ"
                : "ปิดการใช้งาน Staff สำเร็จ",
            "success"
        );


        await loadStaff();

    }
    catch (error) {

        console.error(
            "TOGGLE STAFF ERROR",
            error
        );


        showMessage(
            error.message ||
            "เปลี่ยนสถานะ Staff ไม่สำเร็จ",
            "error"
        );

    }

}


/* ============================================================
   DELETE STAFF
============================================================ */

async function deleteStaff(
    adminId
) {

    const staff =
        staffCache.find(
            function (item) {

                return String(
                    item.admin_id ||
                    item.adminId ||
                    ""
                ).trim()
                ===
                String(
                    adminId ||
                    ""
                ).trim();

            }
        );


    if (!staff) {

        showMessage(
            "ไม่พบข้อมูล Staff",
            "error"
        );

        return;
    }


    const username =
        staff.username ||
        adminId;


    if (
        !window.confirm(
            "ต้องการลบ Staff " +
            username +
            " หรือไม่?\n\n" +
            "การลบจะไม่สามารถย้อนกลับได้"
        )
    ) {

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
                    "adminDeleteStaff",

                token:
                    token,

                admin_id:
                    String(
                        adminId
                    ).trim()

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
            "ลบ Staff สำเร็จ",
            "success"
        );


        await loadStaff();

    }
    catch (error) {

        console.error(
            "DELETE STAFF ERROR",
            error
        );


        showMessage(
            error.message ||
            "ลบ Staff ไม่สำเร็จ",
            "error"
        );

    }

}


/* ============================================================
   CLOSE STAFF MODAL
============================================================ */

function closeStaffModal() {

    const modal =
        document.getElementById(
            "staffModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    currentStaffMode =
        "add";


    currentEditStaffId =
        "";

}


/* ============================================================
   LOAD RESET REQUESTS
============================================================ */

async function loadResetRequests() {

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


    if (tbody) {

        tbody.innerHTML =
            '<tr>' +
            '<td colspan="9" class="loading-row">' +
            'กำลังโหลดข้อมูล...' +
            '</td>' +
            '</tr>';

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
                    : "โหลดคำขอ Reset ไม่สำเร็จ"
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

    }
    catch (error) {

        console.error(
            "LOAD RESET REQUESTS ERROR",
            error
        );


        if (tbody) {

            tbody.innerHTML =
                '<tr>' +
                '<td colspan="9" class="loading-row">' +
                escapeHtml(
                    error.message ||
                    "โหลดข้อมูลไม่สำเร็จ"
                ) +
                '</td>' +
                '</tr>';

        }


        showMessage(
            error.message ||
            "โหลดคำขอ Reset ไม่สำเร็จ",
            "error"
        );

    }

}


/* ============================================================
   RENDER RESET REQUESTS
============================================================ */

function renderResetRequests() {

    const tbody =
        document.getElementById(
            "resetRequestsTableBody"
        );


    if (!tbody) {
        return;
    }


    const searchInput =
        document.getElementById(
            "resetRequestSearch"
        );


    const filter =
        document.getElementById(
            "resetRequestStatusFilter"
        );


    const keyword =
        searchInput
            ? String(
                searchInput.value ||
                ""
            )
                .trim()
                .toLowerCase()
            : "";


    const statusFilter =
        filter
            ? String(
                filter.value ||
                ""
            )
                .trim()
                .toUpperCase()
            : "";


    let rows =
        resetRequestsCache.slice();


    if (keyword) {

        rows =
            rows.filter(
                function (request) {

                    const text = [

                        request.request_id,

                        request.student_id,

                        request.reason,

                        request.note,

                        request.status

                    ]
                        .join(" ")
                        .toLowerCase();


                    return text.indexOf(
                        keyword
                    ) !== -1;

                }
            );

    }


    if (statusFilter) {

        rows =
            rows.filter(
                function (request) {

                    return String(
                        request.status ||
                        ""
                    )
                        .trim()
                        .toUpperCase()
                        ===
                        statusFilter;

                }
            );

    }


    if (!rows.length) {

        tbody.innerHTML =
            '<tr>' +
            '<td colspan="9" class="loading-row">' +
            (
                keyword ||
                statusFilter
                    ? "ไม่พบคำขอที่ค้นหา"
                    : "ยังไม่มีคำขอ Reset"
            ) +
            '</td>' +
            '</tr>';

        return;
    }


    tbody.innerHTML =
        rows
            .map(
                renderResetRequestRow
            )
            .join("");

}


/* ============================================================
   RESET REQUEST ROW
============================================================ */

function renderResetRequestRow(
    request
) {

    const requestId =
        String(
            request.request_id ||
            ""
        ).trim();


    const studentId =
        String(
            request.student_id ||
            ""
        ).trim();


    const status =
        String(
            request.status ||
            ""
        )
            .trim()
            .toUpperCase();


    let actionHtml =
        '<span class="muted-text">-</span>';


    if (
        status ===
        "PENDING"
    ) {

        actionHtml = `
            <button
                type="button"
                class="small-btn reset-btn"
                data-action="process-reset"
                data-id="${escapeAttr(requestId)}"
            >
                🔑 ดำเนินการ
            </button>
        `;

    }
    else if (
        status ===
        "APPROVED"
    ) {

        actionHtml = `
            <button
                type="button"
                class="small-btn reset-btn"
                data-action="process-reset"
                data-id="${escapeAttr(requestId)}"
            >
                🔑 รีเซ็ตรหัสผ่าน
            </button>
        `;

    }


    return `
        <tr>

            <td data-label="Request ID">
                <strong>
                    ${escapeHtml(
                        requestId || "-"
                    )}
                </strong>
            </td>

            <td data-label="รหัสนักศึกษา">
                ${escapeHtml(
                    studentId || "-"
                )}
            </td>

            <td data-label="เหตุผล">
                ${escapeHtml(
                    request.reason ||
                    "-"
                )}
            </td>

            <td data-label="สถานะ">
                <span class="status-badge ${statusClass(status)}">
                    ${escapeHtml(
                        status || "-"
                    )}
                </span>
            </td>

            <td data-label="วันที่ร้องขอ">
                ${escapeHtml(
                    formatDateTime(
                        request.requested_at
                    )
                )}
            </td>

            <td data-label="วันที่ดำเนินการ">
                ${escapeHtml(
                    formatDateTime(
                        request.processed_at
                    )
                )}
            </td>

            <td data-label="ผู้ดำเนินการ">
                ${escapeHtml(
                    request.processed_by ||
                    "-"
                )}
            </td>

            <td data-label="หมายเหตุ">
                ${escapeHtml(
                    request.note ||
                    "-"
                )}
            </td>

            <td data-label="จัดการ">

                <div class="action-buttons">

                    ${actionHtml}

                </div>

            </td>

        </tr>
    `;

}


/* ============================================================
   OPEN RESET REQUEST MODAL
============================================================ */

function openResetRequestModal(
    requestId
) {

    const request =
        resetRequestsCache.find(
            function (item) {

                return String(
                    item.request_id ||
                    ""
                ).trim()
                ===
                String(
                    requestId ||
                    ""
                ).trim();

            }
        );


    if (!request) {

        showMessage(
            "ไม่พบคำขอ Reset",
            "error"
        );

        return;
    }


    currentResetRequestId =
        String(
            request.request_id
        ).trim();


    const details =
        document.getElementById(
            "resetRequestDetails"
        );


    if (details) {

        details.innerHTML = `

            <div class="reset-detail-row">
                <strong>Request ID:</strong>
                <span>
                    ${escapeHtml(
                        request.request_id ||
                        "-"
                    )}
                </span>
            </div>

            <div class="reset-detail-row">
                <strong>รหัสนักศึกษา:</strong>
                <span>
                    ${escapeHtml(
                        request.student_id ||
                        "-"
                    )}
                </span>
            </div>

            <div class="reset-detail-row">
                <strong>เหตุผล:</strong>
                <span>
                    ${escapeHtml(
                        request.reason ||
                        "-"
                    )}
                </span>
            </div>

            <div class="reset-detail-row">
                <strong>สถานะ:</strong>
                <span>
                    ${escapeHtml(
                        request.status ||
                        "-"
                    )}
                </span>
            </div>

            <div class="reset-detail-row">
                <strong>วันที่ร้องขอ:</strong>
                <span>
                    ${escapeHtml(
                        formatDateTime(
                            request.requested_at
                        )
                    )}
                </span>
            </div>

        `;

    }


    setValue(
        "resetRequestNote",
        ""
    );


    const button =
        document.getElementById(
            "processResetRequestBtn"
        );


    if (button) {

        const status =
            String(
                request.status ||
                ""
            )
                .trim()
                .toUpperCase();


        if (
            status ===
            "PENDING"
        ) {

            button.textContent =
                "🔑 อนุมัติและรีเซ็ตรหัสผ่าน";

        }
        else if (
            status ===
            "APPROVED"
        ) {

            button.textContent =
                "🔑 รีเซ็ตรหัสผ่าน";

        }
        else {

            button.textContent =
                "ดำเนินการไม่ได้";

        }

    }


    const modal =
        document.getElementById(
            "resetRequestModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

    }

}


/* ============================================================
   PROCESS RESET REQUEST
============================================================ */

async function processCurrentResetRequest() {

    if (
        !currentResetRequestId
    ) {

        showMessage(
            "ไม่พบ Request ID",
            "error"
        );

        return;
    }


    const request =
        resetRequestsCache.find(
            function (item) {

                return String(
                    item.request_id ||
                    ""
                ).trim()
                ===
                String(
                    currentResetRequestId
                ).trim();

            }
        );


    if (!request) {

        showMessage(
            "ไม่พบคำขอ",
            "error"
        );

        return;
    }


    const status =
        String(
            request.status ||
            ""
        )
            .trim()
            .toUpperCase();


    if (
        status ===
        "REJECTED"
    ) {

        showMessage(
            "คำขอนี้ถูกปฏิเสธแล้ว",
            "error"
        );

        return;
    }


    if (
        status ===
        "RESET"
    ) {

        showMessage(
            "คำขอนี้ถูกรีเซ็ตรหัสผ่านไปแล้ว",
            "error"
        );

        return;
    }


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;
    }


    const note =
        getValue(
            "resetRequestNote"
        );


    const button =
        document.getElementById(
            "processResetRequestBtn"
        );


    setButtonLoading(
        button,
        true,
        "กำลังดำเนินการ..."
    );


    try {

        /*
         * -----------------------------------------------------
         * ถ้า PENDING
         * ต้อง APPROVE ก่อน
         * เพราะ Code.gs adminResetPassword
         * อนุญาตเฉพาะสถานะ APPROVED
         * -----------------------------------------------------
         */

        if (
            status ===
            "PENDING"
        ) {

            const approveResult =
                await apiRequest({

                    action:
                        "adminApproveReset",

                    token:
                        token,

                    request_id:
                        currentResetRequestId,

                    note:
                        note

                });


            if (
                !approveResult ||
                !approveResult.success
            ) {

                if (
                    isSessionExpired(
                        approveResult
                    )
                ) {

                    handleSessionExpired();

                    return;
                }


                throw new Error(
                    approveResult &&
                    approveResult.message
                        ? approveResult.message
                        : "อนุมัติคำขอไม่สำเร็จ"
                );

            }

        }


        /*
         * -----------------------------------------------------
         * ตอนนี้ต้องเป็น APPROVED
         * -----------------------------------------------------
         */

        const resetResult =
            await apiRequest({

                action:
                    "adminResetPassword",

                token:
                    token,

                request_id:
                    currentResetRequestId,

                note:
                    note ||
                    "รีเซ็ตรหัสผ่านสำเร็จ"

            });


        if (
            !resetResult ||
            !resetResult.success
        ) {

            if (
                isSessionExpired(
                    resetResult
                )
            ) {

                handleSessionExpired();

                return;
            }


            throw new Error(
                resetResult &&
                resetResult.message
                    ? resetResult.message
                    : "รีเซ็ตรหัสผ่านไม่สำเร็จ"
            );

        }


        showMessage(
            "รีเซ็ตรหัสผ่านนักศึกษาสำเร็จ",
            "success"
        );


        /*
         * ไม่แสดงรหัสผ่านใหม่บนหน้าเว็บ
         */

        console.log(
            "PASSWORD RESET:",
            resetResult.student_id
        );


        closeResetRequestModal();


        await loadResetRequests();

    }
    catch (error) {

        console.error(
            "PROCESS RESET REQUEST ERROR",
            error
        );


        showMessage(
            error.message ||
            "ดำเนินการ Reset ไม่สำเร็จ",
            "error"
        );

    }
    finally {

        setButtonLoading(
            button,
            false,
            "รีเซ็ตรหัสผ่าน"
        );

    }

}


/* ============================================================
   CLOSE RESET MODAL
============================================================ */

function closeResetRequestModal() {

    const modal =
        document.getElementById(
            "resetRequestModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    currentResetRequestId =
        "";

}


/* ============================================================
   DASHBOARD STATISTICS
============================================================ */

function updateDashboardStats() {

    const totalStudents =
        studentsCache.length;


    const activeStudents =
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
                )
                ||
                (
                    status ===
                    "นักศึกษาปกติ"
                );

            }
        ).length;


    const pendingRequests =
        resetRequestsCache.filter(
            function (request) {

                return String(
                    request.status ||
                    ""
                )
                    .trim()
                    .toUpperCase()
                    ===
                    "PENDING";

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
        staffCache.length
    );


    setText(
        "pendingResetRequests",
        pendingRequests
    );


    /*
     * Badge
     */

    const badge =
        document.getElementById(
            "resetRequestBadge"
        );


    if (badge) {

        setText(
            "resetRequestBadge",
            pendingRequests
        );


        if (
            pendingRequests >
            0
        ) {

            badge.classList.remove(
                "hidden"
            );

        }
        else {

            badge.classList.add(
                "hidden"
            );

        }

    }

}


/* ============================================================
   LOGOUT
============================================================ */

async function handleLogout() {

    if (
        !window.confirm(
            "ต้องการออกจากระบบ Admin หรือไม่?"
        )
    ) {

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

    }
    catch (error) {

        console.warn(
            "ADMIN LOGOUT API ERROR",
            error
        );

    }
    finally {

        if (
            CONFIG.ADMIN_SESSION_KEY
        ) {

            sessionStorage.removeItem(
                CONFIG.ADMIN_SESSION_KEY
            );

        }


        if (
            CONFIG.ADMIN_KEY
        ) {

            sessionStorage.removeItem(
                CONFIG.ADMIN_KEY
            );

        }


        window.location.replace(
            "admin-login.html"
        );

    }

}


/* ============================================================
   SESSION HELPERS
============================================================ */

function getAdminToken() {

    if (
        typeof CONFIG ===
        "undefined"
    ) {

        return "";

    }


    if (
        !CONFIG.ADMIN_SESSION_KEY
    ) {

        return "";

    }


    return String(
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        ) ||
        ""
    ).trim();

}


/* ============================================================
   SESSION EXPIRED
============================================================ */

function isSessionExpired(
    result
) {

    if (!result) {
        return false;
    }


    const code =
        String(
            result.code ||
            ""
        )
            .trim()
            .toUpperCase();


    const message =
        String(
            result.message ||
            ""
        )
            .trim()
            .toLowerCase();


    return (
        code ===
        "ADMIN_SESSION_EXPIRED"
    )
    ||
    message.indexOf(
        "session ของ admin หมดอายุ"
    ) !== -1;

}


/* ============================================================
   HANDLE SESSION EXPIRED
============================================================ */

function handleSessionExpired() {

    showMessage(
        "Session ของ Admin หมดอายุ กรุณาเข้าสู่ระบบใหม่",
        "error"
    );


    if (
        CONFIG &&
        CONFIG.ADMIN_SESSION_KEY
    ) {

        sessionStorage.removeItem(
            CONFIG.ADMIN_SESSION_KEY
        );

    }


    if (
        CONFIG &&
        CONFIG.ADMIN_KEY
    ) {

        sessionStorage.removeItem(
            CONFIG.ADMIN_KEY
        );

    }


    setTimeout(
        function () {

            window.location.replace(
                "admin-login.html"
            );

        },
        1000
    );

}


/* ============================================================
   REDIRECT LOGIN
============================================================ */

function redirectToLogin() {

    window.location.replace(
        "admin-login.html"
    );

}


/* ============================================================
   SIDEBAR
============================================================ */

function toggleSidebar() {

    const sidebar =
        document.getElementById(
            "adminSidebar"
        );


    if (sidebar) {

        sidebar.classList.toggle(
            "open"
        );

    }

}


/* ============================================================
   MOBILE SIDEBAR
============================================================ */

function closeMobileSidebar() {

    const sidebar =
        document.getElementById(
            "adminSidebar"
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


/* ============================================================
   CONNECTION STATUS
============================================================ */

function setConnectionStatus(
    text
) {

    const element =
        document.getElementById(
            "connectionStatus"
        );


    if (!element) {
        return;
    }


    element.textContent =
        text || "";

}


/* ============================================================
   MODAL HELPER
============================================================ */

function closeModalElement(
    modal
) {

    if (!modal) {
        return;
    }


    modal.classList.remove(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* ============================================================
   BIND CLICK
============================================================ */

function bindClick(
    id,
    handler
) {

    const element =
        document.getElementById(
            id
        );


    if (
        element &&
        typeof handler ===
        "function"
    ) {

        element.addEventListener(
            "click",
            handler
        );

    }

}


/* ============================================================
   BIND SUBMIT
============================================================ */

function bindSubmit(
    id,
    handler
) {

    const element =
        document.getElementById(
            id
        );


    if (
        element &&
        typeof handler ===
        "function"
    ) {

        element.addEventListener(
            "submit",
            handler
        );

    }

}


/* ============================================================
   GET VALUE
============================================================ */

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
    ).trim();

}


/* ============================================================
   SET VALUE
============================================================ */

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


/* ============================================================
   SET TEXT
============================================================ */

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


/* ============================================================
   SET READONLY
============================================================ */

function setReadOnly(
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


    element.readOnly =
        Boolean(
            value
        );

}


/* ============================================================
   BUTTON LOADING
============================================================ */

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

    }
    else {

        button.disabled =
            false;


        button.textContent =
            button.dataset.originalText ||
            "บันทึก";


        delete button.dataset.originalText;

    }

}


/* ============================================================
   MESSAGE
============================================================ */

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


/* ============================================================
   GENERATE ADMIN ID
============================================================ */

function generateAdminId() {

    const now =
        new Date();


    const pad =
        function (
            value
        ) {

            return String(
                value
            ).padStart(
                2,
                "0"
            );

        };


    const timestamp =
        now.getFullYear() +
        pad(
            now.getMonth() + 1
        ) +
        pad(
            now.getDate()
        ) +
        pad(
            now.getHours()
        ) +
        pad(
            now.getMinutes()
        ) +
        pad(
            now.getSeconds()
        );


    const random =
        Math.floor(
            1000 +
            Math.random() *
            9000
        );


    return (
        "ADM-" +
        timestamp +
        "-" +
        random
    );

}


/* ============================================================
   DATE
============================================================ */

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
     * yyyy-mm-dd
     */

    const isoMatch =
        text.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );


    if (isoMatch) {

        return (
            isoMatch[1] +
            "-" +
            isoMatch[2] +
            "-" +
            isoMatch[3]
        );

    }


    /*
     * dd/mm/yyyy
     */

    const thaiMatch =
        text.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
        );


    if (thaiMatch) {

        let year =
            Number(
                thaiMatch[3]
            );


        /*
         * ถ้าเป็น พ.ศ.
         */

        if (
            year > 2400
        ) {

            year -= 543;

        }


        return (
            String(year).padStart(
                4,
                "0"
            ) +
            "-" +
            String(
                thaiMatch[2]
            ).padStart(
                2,
                "0"
            ) +
            "-" +
            String(
                thaiMatch[1]
            ).padStart(
                2,
                "0"
            )
        );

    }


    return "";

}


/* ============================================================
   FORMAT DATE
============================================================ */

function formatDate(
    value
) {

    if (!value) {
        return "-";
    }


    const text =
        String(
            value
        ).trim();


    const input =
        toInputDate(
            text
        );


    if (input) {

        const parts =
            input.split(
                "-"
            );


        if (
            parts.length ===
            3
        ) {

            return (
                parts[2] +
                "/" +
                parts[1] +
                "/" +
                parts[0]
            );

        }

    }


    return text;

}


/* ============================================================
   FORMAT DATETIME
============================================================ */

function formatDateTime(
    value
) {

    if (!value) {
        return "-";
    }


    const text =
        String(
            value
        ).trim();


    if (!text) {
        return "-";
    }


    /*
     * yyyy-mm-dd...
     */

    const iso =
        text.match(
            /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/
        );


    if (iso) {

        return (
            iso[3] +
            "/" +
            iso[2] +
            "/" +
            iso[1] +
            " " +
            iso[4] +
            ":" +
            iso[5]
        );

    }


    return text;

}


/* ============================================================
   STATUS CLASS
============================================================ */

function statusClass(
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
        ||
        value ===
        "REJECTED"
        ||
        value ===
        "พ้นสภาพ"
    ) {

        return "status-inactive";

    }


    if (
        value ===
        "PENDING"
        ||
        value ===
        "PROCESSING"
        ||
        value ===
        "APPROVED"
    ) {

        return "status-pending";

    }


    if (
        value ===
        "RESET"
    ) {

        return "status-active";

    }


    return "";

}


/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHtml(
    value
) {

    return String(
        value == null
            ? ""
            : value
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


/* ============================================================
   ESCAPE ATTRIBUTE
============================================================ */

function escapeAttr(
    value
) {

    return escapeHtml(
        value
    );

}


/* ============================================================
   END
============================================================ */

console.log(
    "ADMIN DASHBOARD JS LOADED - NEW VERSION"
);
