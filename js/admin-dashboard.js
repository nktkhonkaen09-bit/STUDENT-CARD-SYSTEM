"use strict";

/* =========================================================
   ADMIN DASHBOARD
   js/admin-dashboard.js

   ใช้กับ admin-dashboard.html ชุดปัจจุบัน

   รองรับ:
   - Dashboard
   - นักศึกษา
   - เพิ่มนักศึกษา
   - แก้ไขนักศึกษา
   - รีเซ็ตรหัสผ่านนักศึกษา
   - Password Reset Requests
   - Staff
   - เพิ่ม Staff
   - แก้ไข Staff
   - ลบ Staff
   - Logout
========================================================= */


/* =========================================================
   GLOBAL
========================================================= */

let studentsCache = [];
let staffCache = [];
let resetRequestsCache = [];

let editingStudentId = "";
let editingStaffId = "";


/* =========================================================
   READY
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("ADMIN DASHBOARD JS READY");


    if (typeof CONFIG === "undefined") {

        console.error("ไม่พบ CONFIG จาก config.js");

        showMessage(
            "ไม่พบ config.js",
            "error"
        );

        return;
    }


    if (!CONFIG.API_URL) {

        showMessage(
            "ไม่พบ API_URL",
            "error"
        );

        return;
    }


    setupEvents();

    loadAdminDisplay();

    checkAdminSession();

});


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    /* -----------------------------
       SIDEBAR MENU
    ----------------------------- */

    document
        .querySelectorAll("[data-section]")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    showSection(
                        button.getAttribute(
                            "data-section"
                        )
                    );

                }
            );

        });


    /* -----------------------------
       SIDEBAR TOGGLE
    ----------------------------- */

    const sidebarToggle =
        document.getElementById(
            "sidebarToggle"
        );

    const sidebarOverlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (sidebarToggle) {

        sidebarToggle.addEventListener(
            "click",
            function () {

                document.body.classList.toggle(
                    "sidebar-open"
                );

            }
        );

    }


    if (sidebarOverlay) {

        sidebarOverlay.addEventListener(
            "click",
            function () {

                document.body.classList.remove(
                    "sidebar-open"
                );

            }
        );

    }


    /* -----------------------------
       LOGOUT
    ----------------------------- */

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


    /* -----------------------------
       STUDENT SEARCH
    ----------------------------- */

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


    /* -----------------------------
       ADD STUDENT
    ----------------------------- */

    const addStudentBtn =
        document.getElementById(
            "addStudentBtn"
        );


    if (addStudentBtn) {

        addStudentBtn.addEventListener(
            "click",
            function () {

                showSection(
                    "add-student"
                );

                resetAddStudentForm();

            }
        );

    }


    /* -----------------------------
       ADD STAFF
    ----------------------------- */

    const addStaffBtn =
        document.getElementById(
            "addStaffBtn"
        );


    if (addStaffBtn) {

        addStaffBtn.addEventListener(
            "click",
            function () {

                showSection(
                    "add-staff"
                );

                resetAddStaffForm();

            }
        );

    }


    /* -----------------------------
       ADD STUDENT FORM
    ----------------------------- */

    const studentForm =
        document.getElementById(
            "studentForm"
        );


    if (studentForm) {

        studentForm.addEventListener(
            "submit",
            handleAddStudent
        );

    }


    /* -----------------------------
       ADD STAFF FORM
    ----------------------------- */

    const staffForm =
        document.getElementById(
            "staffForm"
        );


    if (staffForm) {

        staffForm.addEventListener(
            "submit",
            handleAddStaff
        );

    }


    /* -----------------------------
       EDIT STUDENT FORM
    ----------------------------- */

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


    /* -----------------------------
       EDIT STAFF FORM
    ----------------------------- */

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


    /* -----------------------------
       RESET PASSWORD FORM
    ----------------------------- */

    const resetPasswordForm =
        document.getElementById(
            "resetPasswordForm"
        );


    if (resetPasswordForm) {

        resetPasswordForm.addEventListener(
            "submit",
            handleResetPassword
        );

    }


    /* -----------------------------
       CLOSE STUDENT EDIT
    ----------------------------- */

    bindClick(
        "closeStudentEditModal",
        closeStudentEditModal
    );

    bindClick(
        "cancelStudentEdit",
        closeStudentEditModal
    );


    /* -----------------------------
       CLOSE STAFF EDIT
    ----------------------------- */

    bindClick(
        "closeStaffEditModal",
        closeStaffEditModal
    );

    bindClick(
        "cancelStaffEdit",
        closeStaffEditModal
    );


    /* -----------------------------
       CLOSE RESET MODAL
    ----------------------------- */

    bindClick(
        "closeResetPasswordModal",
        closeResetPasswordModal
    );

    bindClick(
        "cancelResetPassword",
        closeResetPasswordModal
    );


    /* -----------------------------
       DYNAMIC BUTTONS
    ----------------------------- */

    document.addEventListener(
        "click",
        handleDynamicButton
    );


    /* -----------------------------
       MODAL BACKDROP
    ----------------------------- */

    document
        .querySelectorAll(".modal")
        .forEach(function (modal) {

            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target === modal
                    ) {

                        modal.classList.remove(
                            "show"
                        );

                        modal.style.display =
                            "none";

                    }

                }
            );

        });

}


/* =========================================================
   DYNAMIC TABLE BUTTONS
========================================================= */

function handleDynamicButton(event) {

    const button =
        event.target.closest("button");


    if (!button) {
        return;
    }


    /* แก้ไขนักศึกษา */

    if (
        button.dataset.action ===
        "edit-student"
    ) {

        editStudent(
            button.dataset.id
        );

        return;
    }


    /* รีเซ็ตรหัสนักศึกษา */

    if (
        button.dataset.action ===
        "reset-student"
    ) {

        openDirectResetModal(
            button.dataset.id
        );

        return;
    }


    /* แก้ไข Staff */

    if (
        button.dataset.action ===
        "edit-staff"
    ) {

        editStaff(
            button.dataset.id
        );

        return;
    }


    /* ลบ Staff */

    if (
        button.dataset.action ===
        "delete-staff"
    ) {

        deleteStaff(
            button.dataset.id
        );

        return;
    }


    /* อนุมัติ Reset */

    if (
        button.dataset.action ===
        "approve-reset"
    ) {

        approveResetRequest(
            button.dataset.id
        );

        return;
    }


    /* ปฏิเสธ Reset */

    if (
        button.dataset.action ===
        "reject-reset"
    ) {

        rejectResetRequest(
            button.dataset.id
        );

        return;
    }

}


/* =========================================================
   SECTION
========================================================= */

function showSection(sectionName) {

    const name =
        String(
            sectionName || ""
        ).trim();


    if (!name) {
        return;
    }


    const cleanName =
        name.replace(
            /^section-/,
            ""
        );


    const section =
        document.getElementById(
            "section-" + cleanName
        );


    if (!section) {

        console.warn(
            "SECTION NOT FOUND:",
            "section-" + cleanName
        );

        return;
    }


    document
        .querySelectorAll(
            ".admin-section"
        )
        .forEach(function (item) {

            item.classList.remove(
                "active"
            );

            item.style.display =
                "none";

        });


    section.classList.add(
        "active"
    );

    section.style.display =
        "";


    document
        .querySelectorAll(
            ".nav-item[data-section]"
        )
        .forEach(function (button) {

            button.classList.remove(
                "active"
            );


            if (
                button.getAttribute(
                    "data-section"
                ) === cleanName
            ) {

                button.classList.add(
                    "active"
                );

            }

        });


    updatePageHeader(
        cleanName
    );


    document.body.classList.remove(
        "sidebar-open"
    );


    if (
        cleanName === "students"
    ) {

        loadStudents();

    }


    if (
        cleanName === "staff"
    ) {

        loadStaff();

    }


    if (
        cleanName === "reset-password"
    ) {

        loadResetRequests();

    }

}


/* =========================================================
   PAGE HEADER
========================================================= */

function updatePageHeader(name) {

    const title =
        document.getElementById(
            "pageTitle"
        );


    const subtitle =
        document.getElementById(
            "pageSubtitle"
        );


    const pages = {

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
            "สร้างบัญชีนักศึกษาใหม่"
        ],

        "reset-password": [
            "รีเซ็ตรหัสผ่าน",
            "จัดการคำร้องรีเซ็ตรหัสผ่าน"
        ],

        staff: [
            "ข้อมูล Staff",
            "จัดการบัญชี Staff"
        ],

        "add-staff": [
            "เพิ่ม Staff",
            "สร้างบัญชี Staff ใหม่"
        ]

    };


    const data =
        pages[name] ||
        pages.dashboard;


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
   SESSION
========================================================= */

async function checkAdminSession() {

    const token =
        getToken();


    if (!token) {

        redirectToLogin();

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
                isSessionExpired(
                    result
                )
            ) {

                handleSessionExpired();

                return;
            }


            throw new Error(
                result.message ||
                "ตรวจสอบ Session ไม่สำเร็จ"
            );

        }


        await Promise.all([

            loadStudents(),

            loadStaff(),

            loadResetRequests()

        ]);


        updateDashboardStats();


    } catch (error) {

        console.error(
            "SESSION ERROR:",
            error
        );


        showMessage(
            error.message ||
            "ไม่สามารถเชื่อมต่อระบบได้",
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
            JSON.parse(raw);


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

        console.warn(
            "ADMIN DATA ERROR:",
            error
        );

    }

}


/* =========================================================
   API
========================================================= */

async function apiRequest(data) {

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
                    JSON.stringify(data)

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
        "ADMIN API:",
        data.action,
        result
    );


    return result;

}


/* =========================================================
   SESSION HELPERS
========================================================= */

function getToken() {

    return String(
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        ) || ""
    ).trim();

}


function isSessionExpired(result) {

    return !!(
        result &&
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


/* =========================================================
   LOAD STUDENTS
========================================================= */

async function loadStudents() {

    const token =
        getToken();


    if (!token) {
        return;
    }


    try {

        tableMessage(
            "studentsTableBody",
            9,
            "กำลังโหลดข้อมูลนักศึกษา..."
        );


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
                isSessionExpired(
                    result
                )
            ) {

                handleSessionExpired();

                return;
            }


            throw new Error(
                result.message ||
                "โหลดข้อมูลนักศึกษาไม่สำเร็จ"
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


    } catch (error) {

        console.error(
            "LOAD STUDENTS ERROR:",
            error
        );


        tableMessage(
            "studentsTableBody",
            9,
            error.message ||
            "โหลดข้อมูลนักศึกษาไม่สำเร็จ"
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


    if (!list.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-cell">
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


function createStudentRow(student) {

    const id =
        String(
            student.student_id || ""
        ).trim();


    const thaiName = [

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


    const status =
        student.status ||
        "นักศึกษาปกติ";


    return `
        <tr>

            <td>
                <strong>
                    ${escapeHtml(id || "-")}
                </strong>
            </td>

            <td>
                ${escapeHtml(
                    thaiName || "-"
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
                    class="status-badge ${statusClass(status)}"
                >
                    ${escapeHtml(status)}
                </span>
            </td>

            <td>
                ${escapeHtml(
                    formatDate(
                        student.issue_date
                    )
                )}
            </td>

            <td>
                ${escapeHtml(
                    formatDate(
                        student.expire_date
                    )
                )}
            </td>

            <td>

                <div class="action-buttons">

                    <button
                        type="button"
                        class="small-btn edit-btn"
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
                        🔑 รีเซ็ต
                    </button>

                </div>

            </td>

        </tr>
    `;

}


/* =========================================================
   EDIT STUDENT
========================================================= */

function editStudent(studentId) {

    const id =
        String(
            studentId || ""
        ).trim();


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


    editingStudentId =
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


    const modal =
        document.getElementById(
            "studentEditModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

        modal.style.display =
            "flex";

    }

}


/* =========================================================
   UPDATE STUDENT
========================================================= */

async function handleUpdateStudent(event) {

    event.preventDefault();


    if (!editingStudentId) {

        showMessage(
            "ไม่พบข้อมูลนักศึกษา",
            "error"
        );

        return;
    }


    const token =
        getToken();


    if (!token) {

        handleSessionExpired();

        return;
    }


    const data = {

        action:
            "adminUpdateStudent",

        token:
            token,

        student_id:
            editingStudentId,

        prefix_th:
            valueOf(
                "editStudentPrefix"
            ),

        firstname_th:
            valueOf(
                "editStudentFirstnameTh"
            ),

        lastname_th:
            valueOf(
                "editStudentLastnameTh"
            ),

        firstname_en:
            valueOf(
                "editStudentFirstnameEn"
            ),

        lastname_en:
            valueOf(
                "editStudentLastnameEn"
            ),

        department:
            valueOf(
                "editStudentDepartment"
            ),

        phone:
            valueOf(
                "editStudentPhone"
            ),

        status:
            valueOf(
                "editStudentStatus"
            ),

        issue_date:
            valueOf(
                "editStudentIssueDate"
            ),

        expire_date:
            valueOf(
                "editStudentExpireDate"
            ),

        photo_url:
            valueOf(
                "editStudentPhoto"
            )

    };


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
            "updateStudentBtn"
        );


    setButtonLoading(
        button,
        true,
        "กำลังบันทึก..."
    );


    try {

        const result =
            await apiRequest(data);


        if (
            !result ||
            result.success !== true
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
                result.message ||
                "แก้ไขข้อมูลนักศึกษาไม่สำเร็จ"
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
            "แก้ไขข้อมูลนักศึกษาไม่สำเร็จ",
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
   CLOSE STUDENT EDIT
========================================================= */

function closeStudentEditModal() {

    const modal =
        document.getElementById(
            "studentEditModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

        modal.style.display =
            "none";

    }


    editingStudentId = "";

}


/* =========================================================
   ADD STUDENT
========================================================= */

async function handleAddStudent(event) {

    event.preventDefault();


    const token =
        getToken();


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
            valueOf("studentId"),

        password:
            valueOf("studentPassword"),

        prefix_th:
            valueOf("studentPrefix"),

        firstname_th:
            valueOf("studentFirstnameTh"),

        lastname_th:
            valueOf("studentLastnameTh"),

        firstname_en:
            valueOf("studentFirstnameEn"),

        lastname_en:
            valueOf("studentLastnameEn"),

        department:
            valueOf("studentDepartment"),

        phone:
            valueOf("studentPhone"),

        status:
            valueOf("studentStatus") ||
            "นักศึกษาปกติ",

        issue_date:
            valueOf("studentIssueDate"),

        expire_date:
            valueOf("studentExpireDate"),

        photo_url:
            valueOf("studentPhoto")

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
            await apiRequest(data);


        if (
            !result ||
            result.success !== true
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
                result.message ||
                "เพิ่มนักศึกษาไม่สำเร็จ"
            );

        }


        showMessage(
            "เพิ่มนักศึกษาสำเร็จ",
            "success"
        );


        resetAddStudentForm();


        await loadStudents();


        showSection(
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
   RESET ADD STUDENT
========================================================= */

function resetAddStudentForm() {

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
   STUDENT PASSWORD RESET
========================================================= */

function openDirectResetModal(studentId) {

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
        "รีเซ็ตรหัสผ่านโดย Admin"
    );


    const modal =
        document.getElementById(
            "resetPasswordModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

        modal.style.display =
            "flex";

    }

}


function closeResetPasswordModal() {

    const modal =
        document.getElementById(
            "resetPasswordModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

        modal.style.display =
            "none";

    }

}


/* =========================================================
   RESET PASSWORD
========================================================= */

async function handleResetPassword(event) {

    event.preventDefault();


    const token =
        getToken();


    if (!token) {

        handleSessionExpired();

        return;
    }


    const studentId =
        valueOf(
            "resetStudentId"
        );


    const requestId =
        valueOf(
            "resetRequestId"
        );


    const newPassword =
        valueOf(
            "newPassword"
        );


    const note =
        valueOf(
            "resetNote"
        );


    if (!studentId) {

        showMessage(
            "ไม่พบรหัสนักศึกษา",
            "error"
        );

        return;
    }


    if (
        !newPassword ||
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
                isSessionExpired(
                    result
                )
            ) {

                handleSessionExpired();

                return;
            }


            throw new Error(
                result.message ||
                "รีเซ็ตรหัสผ่านไม่สำเร็จ"
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

    }

}


/* =========================================================
   LOAD RESET REQUESTS
========================================================= */

async function loadResetRequests() {

    const token =
        getToken();


    if (!token) {
        return;
    }


    try {

        tableMessage(
            "resetRequestsTableBody",
            8,
            "กำลังโหลดคำร้อง..."
        );


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
                isSessionExpired(
                    result
                )
            ) {

                handleSessionExpired();

                return;
            }


            throw new Error(
                result.message ||
                "โหลดคำร้องไม่สำเร็จ"
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
            "RESET REQUEST ERROR:",
            error
        );


        tableMessage(
            "resetRequestsTableBody",
            8,
            error.message ||
            "ไม่สามารถโหลดคำร้องได้"
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


    if (!resetRequestsCache.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">
                    ไม่พบคำร้องรีเซ็ตรหัสผ่าน
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        resetRequestsCache
            .map(
                function (request) {

                    const status =
                        String(
                            request.status || ""
                        )
                        .trim()
                        .toUpperCase();


                    let actions =
                        "-";


                    if (
                        status ===
                        "PENDING"
                    ) {

                        actions = `

                            <div
                                class="action-buttons"
                            >

                                <button
                                    type="button"
                                    class="small-btn edit-btn"
                                    data-action="approve-reset"
                                    data-id="${escapeAttr(
                                        request.request_id
                                    )}"
                                >
                                    ✅ อนุมัติ
                                </button>

                                <button
                                    type="button"
                                    class="small-btn reset-btn"
                                    data-action="reject-reset"
                                    data-id="${escapeAttr(
                                        request.request_id
                                    )}"
                                >
                                    ❌ ปฏิเสธ
                                </button>

                            </div>

                        `;

                    }


                    return `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    request.request_id ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    request.student_id ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    request.reason ||
                                    "-"
                                )}
                            </td>

                            <td>

                                <span
                                    class="status-badge ${statusClass(
                                        status
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
                                    request.requested_at ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    request.processed_at ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    request.processed_by ||
                                    "-"
                                )}
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
   APPROVE RESET
========================================================= */

async function approveResetRequest(
    requestId
) {

    if (
        !confirm(
            "ต้องการอนุมัติคำร้องนี้หรือไม่?"
        )
    ) {

        return;
    }


    const token =
        getToken();


    if (!token) {

        handleSessionExpired();

        return;
    }


    try {

        const result =
            await apiRequest({

                action:
                    "adminApproveReset",

                token:
                    token,

                request_id:
                    requestId

            });


        if (
            !result ||
            result.success !== true
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
                result.message ||
                "อนุมัติคำร้องไม่สำเร็จ"
            );

        }


        showMessage(
            "อนุมัติคำร้องสำเร็จ",
            "success"
        );


        await loadResetRequests();


    } catch (error) {

        showMessage(
            error.message ||
            "อนุมัติคำร้องไม่สำเร็จ",
            "error"
        );

    }

}


/* =========================================================
   REJECT RESET
========================================================= */

async function rejectResetRequest(
    requestId
) {

    const note =
        prompt(
            "กรุณาระบุเหตุผลที่ปฏิเสธ",
            "ไม่อนุมัติคำร้อง"
        );


    if (note === null) {
        return;
    }


    const token =
        getToken();


    if (!token) {

        handleSessionExpired();

        return;
    }


    try {

        const result =
            await apiRequest({

                action:
                    "adminRejectReset",

                token:
                    token,

                request_id:
                    requestId,

                note:
                    note

            });


        if (
            !result ||
            result.success !== true
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
                result.message ||
                "ปฏิเสธคำร้องไม่สำเร็จ"
            );

        }


        showMessage(
            "ปฏิเสธคำร้องสำเร็จ",
            "success"
        );


        await loadResetRequests();


    } catch (error) {

        showMessage(
            error.message ||
            "ปฏิเสธคำร้องไม่สำเร็จ",
            "error"
        );

    }

}


/* =========================================================
   LOAD STAFF
========================================================= */

async function loadStaff() {

    const token =
        getToken();


    if (!token) {
        return;
    }


    try {

        tableMessage(
            "staffTableBody",
            6,
            "กำลังโหลดข้อมูล Staff..."
        );


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
                isSessionExpired(
                    result
                )
            ) {

                handleSessionExpired();

                return;
            }


            throw new Error(
                result.message ||
                "โหลด Staff ไม่สำเร็จ"
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


        tableMessage(
            "staffTableBody",
            6,
            error.message ||
            "โหลด Staff ไม่สำเร็จ"
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


    if (!staffCache.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
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
                        String(
                            staff.admin_id ||
                            ""
                        ).trim();


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
                                        staff.role ||
                                        "STAFF"
                                    )}
                                </span>

                            </td>

                            <td>

                                <span
                                    class="status-badge ${statusClass(
                                        staff.status ||
                                        "ACTIVE"
                                    )}"
                                >
                                    ${escapeHtml(
                                        staff.status ||
                                        "-"
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
                                        data-id="${escapeAttr(
                                            id
                                        )}"
                                    >
                                        ✏️ แก้ไข
                                    </button>

                                    <button
                                        type="button"
                                        class="small-btn reset-btn"
                                        data-action="delete-staff"
                                        data-id="${escapeAttr(
                                            id
                                        )}"
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
   EDIT STAFF
========================================================= */

function editStaff(adminId) {

    const id =
        String(
            adminId || ""
        ).trim();


    const staff =
        staffCache.find(
            function (item) {

                return String(
                    item.admin_id ||
                    ""
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


    editingStaffId =
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
        String(
            staff.role ||
            "STAFF"
        ).toUpperCase()
    );

    setValue(
        "editStaffStatus",
        String(
            staff.status ||
            "ACTIVE"
        ).toUpperCase()
    );


    const modal =
        document.getElementById(
            "staffEditModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

        modal.style.display =
            "flex";

    }

}


/* =========================================================
   UPDATE STAFF
========================================================= */

async function handleUpdateStaff(event) {

    event.preventDefault();


    if (!editingStaffId) {

        showMessage(
            "ไม่พบ Staff",
            "error"
        );

        return;
    }


    const token =
        getToken();


    if (!token) {

        handleSessionExpired();

        return;
    }


    const data = {

        action:
            "adminUpdateStaff",

        token:
            token,

        admin_id:
            editingStaffId,

        username:
            valueOf(
                "editStaffUsername"
            ),

        name:
            valueOf(
                "editStaffName"
            ),

        role:
            valueOf(
                "editStaffRole"
            ),

        status:
            valueOf(
                "editStaffStatus"
            )

    };


    if (!data.name) {

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
            await apiRequest(
                data
            );


        if (
            !result ||
            result.success !== true
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
                result.message ||
                "แก้ไข Staff ไม่สำเร็จ"
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
   CLOSE STAFF EDIT
========================================================= */

function closeStaffEditModal() {

    const modal =
        document.getElementById(
            "staffEditModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

        modal.style.display =
            "none";

    }


    editingStaffId = "";

}


/* =========================================================
   ADD STAFF
========================================================= */

async function handleAddStaff(event) {

    event.preventDefault();


    const token =
        getToken();


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
            valueOf(
                "staffUsername"
            ),

        password:
            valueOf(
                "staffPassword"
            ),

        name:
            valueOf(
                "staffName"
            ),

        role:
            valueOf(
                "staffRole"
            ) ||
            "STAFF",

        status:
            valueOf(
                "staffStatus"
            ) ||
            "ACTIVE"

    };


    if (!data.username) {

        showMessage(
            "กรุณากรอก Username",
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


    if (!data.name) {

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
            await apiRequest(
                data
            );


        if (
            !result ||
            result.success !== true
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
                result.message ||
                "เพิ่ม Staff ไม่สำเร็จ"
            );

        }


        showMessage(
            "เพิ่ม Staff สำเร็จ",
            "success"
        );


        resetAddStaffForm();


        await loadStaff();


        showSection(
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

function resetAddStaffForm() {

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
   DELETE STAFF
========================================================= */

async function deleteStaff(adminId) {

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
                    item.admin_id ||
                    ""
                ).trim() === id;

            }
        );


    const username =
        staff
            ? staff.username || id
            : id;


    if (
        !confirm(
            "ต้องการลบ Staff นี้หรือไม่?\n\n" +
            "Username: " +
            username
        )
    ) {

        return;
    }


    const token =
        getToken();


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
                    id

            });


        if (
            !result ||
            result.success !== true
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
                result.message ||
                "ลบ Staff ไม่สำเร็จ"
            );

        }


        showMessage(
            "ลบ Staff สำเร็จ",
            "success"
        );


        await loadStaff();


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

    }

}


/* =========================================================
   DASHBOARD STATS
========================================================= */

function updateDashboardStats() {

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
                    ||
                    status ===
                    "นักศึกษาปกติ"
                );

            }
        ).length;


    const pendingResets =
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
        studentsCache.length
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
        "pendingResets",
        pendingResets
    );

}


/* =========================================================
   LOGOUT
========================================================= */

async function handleLogout() {

    if (
        !confirm(
            "ต้องการออกจากระบบ Admin หรือไม่?"
        )
    ) {

        return;
    }


    const token =
        getToken();


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
                "LOGOUT API ERROR:",
                error
            );

        }

    }


    sessionStorage.removeItem(
        CONFIG.ADMIN_SESSION_KEY
    );

    sessionStorage.removeItem(
        CONFIG.ADMIN_KEY
    );


    redirectToLogin();

}


/* =========================================================
   BASIC HELPERS
========================================================= */

function bindClick(id, handler) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.addEventListener(
            "click",
            handler
        );

    }

}


function setText(id, value) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value == null
                ? ""
                : String(value);

    }

}


function setValue(id, value) {

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


function valueOf(id) {

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


function tableMessage(
    id,
    colspan,
    message
) {

    const tbody =
        document.getElementById(
            id
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
                ${escapeHtml(message)}
            </td>

        </tr>

    `;

}


/* =========================================================
   BUTTON LOADING
========================================================= */

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


/* =========================================================
   DATE
========================================================= */

function toInputDate(value) {

    if (!value) {
        return "";
    }


    const text =
        String(value).trim();


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            text
        )
    ) {

        return text;

    }


    const match =
        text.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
        );


    if (match) {

        return (
            match[3] +
            "-" +
            String(
                match[2]
            ).padStart(2, "0") +
            "-" +
            String(
                match[1]
            ).padStart(2, "0")
        );

    }


    return "";

}


function formatDate(value) {

    if (!value) {
        return "-";
    }


    const text =
        String(value).trim();


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
   STATUS
========================================================= */

function statusClass(status) {

    const value =
        String(
            status || ""
        )
        .trim()
        .toUpperCase();


    if (
        value === "ACTIVE" ||
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


    if (
        value === "PENDING"
    ) {

        return "status-pending";

    }


    return "status-default";

}


/* =========================================================
   MESSAGE
========================================================= */

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


    box.textContent =
        message || "";


    box.className =
        "message-box";


    if (type) {

        box.classList.add(
            type
        );

    }


    if (message) {

        clearTimeout(
            showMessage.timer
        );


        showMessage.timer =
            setTimeout(
                function () {

                    box.textContent =
                        "";

                    box.className =
                        "message-box";

                },
                5000
            );

    }

}


/* =========================================================
   ESCAPE
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

    return escapeHtml(value);

}


/* =========================================================
   GLOBAL
========================================================= */

window.showSection =
    showSection;

window.editStudent =
    editStudent;

window.editStaff =
    editStaff;

window.deleteStaff =
    deleteStaff;

window.openDirectResetModal =
    openDirectResetModal;

window.closeStudentEditModal =
    closeStudentEditModal;

window.closeStaffEditModal =
    closeStaffEditModal;

window.closeResetPasswordModal =
    closeResetPasswordModal;

window.loadStudents =
    loadStudents;

window.loadStaff =
    loadStaff;

window.loadResetRequests =
    loadResetRequests;


/* =========================================================
   END
========================================================= */
