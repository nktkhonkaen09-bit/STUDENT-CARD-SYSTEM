/* ============================================================
 * STUDENT CARD SYSTEM
 * ADMIN DASHBOARD
 *
 * VERSION: 2.0 - CLEAN / STABLE
 *
 * ใช้กับ admin-dashboard.html ชุดปัจจุบัน
 *
 * Backend actions ที่ใช้:
 * ------------------------------------------------------------
 * adminGetStudents
 * adminAddStudent
 * adminUpdateStudent
 *
 * adminGetStaff
 * adminAddStaff
 * adminUpdateStaff
 * adminDeleteStaff
 *
 * adminGetResetRequests
 * adminApproveReset
 * adminRejectReset
 * adminResetPassword
 * adminDirectResetStudentPassword
 *
 * adminLogout
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

let studentModalMode = "add";
let staffModalMode = "add";

let isBusy = false;


/* ============================================================
 * START
 * ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "ADMIN DASHBOARD JS LOADED - CLEAN VERSION"
        );

        initAdminDashboard();

    }
);


/* ============================================================
 * INITIALIZE
 * ============================================================ */

async function initAdminDashboard() {

    bindNavigation();
    bindButtons();
    bindForms();
    bindTableActions();
    bindModalBackdrops();

    loadAdminProfile();

    const token = getAdminToken();

    if (!token) {

        console.warn(
            "ADMIN SESSION NOT FOUND"
        );

        redirectToLogin();

        return;
    }

    await loadAllData();

}


/* ============================================================
 * ADMIN SESSION
 * ============================================================ */

function getAdminToken() {

    try {

        if (
            typeof CONFIG !== "undefined" &&
            CONFIG.ADMIN_SESSION_KEY
        ) {

            return sessionStorage.getItem(
                CONFIG.ADMIN_SESSION_KEY
            );

        }

    } catch (error) {

        console.error(
            "GET ADMIN TOKEN ERROR",
            error
        );

    }

    return (
        sessionStorage.getItem(
            "adminSessionId"
        ) ||
        sessionStorage.getItem(
            "admin_session"
        ) ||
        sessionStorage.getItem(
            "adminToken"
        ) ||
        ""
    );

}


function isSessionExpired(result) {

    if (!result) {
        return false;
    }

    const code =
        String(
            result.code || ""
        )
        .toUpperCase();

    const message =
        String(
            result.message || ""
        )
        .toLowerCase();

    return (
        code.includes("SESSION") ||
        code.includes("EXPIRED") ||
        message.includes("session") ||
        message.includes("หมดอายุ")
    );

}


function handleSessionExpired() {

    console.warn(
        "ADMIN SESSION EXPIRED"
    );

    showMessage(
        "Session ของ Admin หมดอายุ กรุณาเข้าสู่ระบบใหม่",
        "error"
    );

    setTimeout(
        redirectToLogin,
        1200
    );

}


function redirectToLogin() {

    window.location.replace(
        "admin-login.html"
    );

}


/* ============================================================
 * API
 * ============================================================ */

async function apiRequest(data) {

    if (
        typeof CONFIG === "undefined" ||
        !CONFIG.API_URL
    ) {

        throw new Error(
            "ไม่พบ CONFIG.API_URL"
        );

    }

    const payload = {
        ...data
    };

    if (!payload.token) {

        payload.token =
            getAdminToken();

    }

    console.log(
        "ADMIN API REQUEST:",
        payload.action
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
            JSON.parse(text);

    } catch (error) {

        console.error(
            "INVALID API RESPONSE:",
            text
        );

        throw new Error(
            "API ส่งข้อมูลกลับมาไม่ใช่ JSON"
        );

    }


    console.log(
        "ADMIN API:",
        payload.action,
        result
    );


    if (
        result &&
        !result.success &&
        isSessionExpired(result)
    ) {

        handleSessionExpired();

    }


    return result;

}


/* ============================================================
 * LOAD ALL
 * ============================================================ */

async function loadAllData() {

    setConnection(
        "กำลังโหลดข้อมูล..."
    );


    try {

        await loadStudents(
            false
        );

        await loadStaff(
            false
        );

        await loadResetRequests(
            false
        );

        updateDashboardStats();

        setConnection(
            "● ระบบพร้อมใช้งาน",
            true
        );

        console.log(
            "ADMIN SESSION OK"
        );


    } catch (error) {

        console.error(
            "LOAD ALL DATA ERROR",
            error
        );

        setConnection(
            "● โหลดข้อมูลบางส่วนไม่สำเร็จ",
            false
        );

        showMessage(
            error.message ||
            "ไม่สามารถโหลดข้อมูลได้",
            "error"
        );

    }

}


/* ============================================================
 * LOAD STUDENTS
 * ============================================================ */

async function loadStudents(
    showLoading = true
) {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    if (showLoading) {

        renderLoading(
            "studentsTableBody",
            9
        );

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
                isSessionExpired(result)
            ) {

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
        )
        .toLowerCase();


    let list =
        studentsCache.slice();


    if (search) {

        list =
            list.filter(
                function (student) {

                    const text =
                        [
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

    const id =
        String(
            student.student_id ||
            ""
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
        String(
            student.status ||
            ""
        );


    const statusClass =
        getStatusClass(
            status
        );


    return `
        <tr>

            <td>
                ${escapeHtml(id)}
            </td>

            <td>
                ${escapeHtml(fullName || "-")}
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
                <span class="status-badge ${statusClass}">
                    ${escapeHtml(status || "-")}
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

                <div class="table-actions">

                    <button
                        type="button"
                        class="secondary-btn table-btn"
                        data-action="edit-student"
                        data-student-id="${escapeAttr(id)}"
                    >
                        ✏️ แก้ไข
                    </button>

                    <button
                        type="button"
                        class="secondary-btn table-btn"
                        data-action="reset-student"
                        data-student-id="${escapeAttr(id)}"
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


    if (
        !data.student_id
    ) {

        showMessage(
            "กรุณากรอกรหัสนักศึกษา",
            "error"
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

        return;

    }


    if (
        data.password.length < 4
    ) {

        showMessage(
            "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร",
            "error"
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
        getElement(
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

    }

}


/* ============================================================
 * OPEN STUDENT MODAL
 * ============================================================ */

function openStudentModal(
    student = null
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
        student;


    studentModalMode =
        student
            ? "edit"
            : "add";


    setText(
        "studentModalTitle",
        student
            ? "แก้ไขข้อมูลนักศึกษา"
            : "เพิ่มนักศึกษา"
    );


    clearStudentModal();


    if (student) {

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


        /*
         * ไม่เติม password เดิม
         */
        setValue(
            "modalStudentPassword",
            ""
        );


        /*
         * ตอนแก้ไขไม่ให้เปลี่ยน student_id
         */
        const idInput =
            getElement(
                "modalStudentId"
            );

        if (idInput) {

            idInput.readOnly =
                true;

        }

    } else {

        const idInput =
            getElement(
                "modalStudentId"
            );

        if (idInput) {

            idInput.readOnly =
                false;

        }

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


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


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


    if (!studentId) {

        showMessage(
            "กรุณากรอกรหัสนักศึกษา",
            "error"
        );

        return;

    }


    if (!firstname) {

        showMessage(
            "กรุณากรอกชื่อ",
            "error"
        );

        return;

    }


    if (!lastname) {

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
            studentModalMode === "edit"
                ? "adminUpdateStudent"
                : "adminAddStudent",

        token:
            token,

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


    if (
        studentModalMode === "add"
    ) {

        data.password =
            password ||
            "123456";

    } else if (
        password
    ) {

        data.password =
            password;

    }


    if (
        data.password &&
        data.password.length < 4
    ) {

        showMessage(
            "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร",
            "error"
        );

        return;

    }


    const button =
        getElement(
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

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "บันทึกข้อมูลนักศึกษาไม่สำเร็จ"
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
            "SAVE STUDENT ERROR",
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

    }

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


    currentStaff =
        staff;


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


    if (staff) {

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
         * ตอนแก้ไข Username ไม่ควรเปลี่ยน
         */
        const usernameInput =
            getElement(
                "staffUsername"
            );

        if (usernameInput) {

            usernameInput.readOnly =
                true;

        }


        /*
         * ตอนแก้ไข password ไม่บังคับ
         */
        const passwordInput =
            getElement(
                "staffPassword"
            );

        if (passwordInput) {

            passwordInput.required =
                false;

            passwordInput.placeholder =
                "เว้นว่างหากไม่ต้องการเปลี่ยน";

        }

    } else {

        const usernameInput =
            getElement(
                "staffUsername"
            );

        if (usernameInput) {

            usernameInput.readOnly =
                false;

        }


        const passwordInput =
            getElement(
                "staffPassword"
            );

        if (passwordInput) {

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


    const name =
        getValue(
            "staffName"
        );


    const password =
        getRawValue(
            "staffPassword"
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


    if (!name) {

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


    const data = {

        action:
            staffModalMode === "add"
                ? "adminAddStaff"
                : "adminUpdateStaff",

        token:
            token,

        username:
            username,

        name:
            name,

        role:
            role,

        status:
            status

    };


    if (password) {

        data.password =
            password;

    }


    const button =
        getElement(
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

    }

}


/* ============================================================
 * LOAD STAFF
 * ============================================================ */

async function loadStaff(
    showLoading = true
) {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    if (showLoading) {

        renderLoading(
            "staffTableBody",
            6
        );

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
                isSessionExpired(result)
            ) {

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


/* ============================================================
 * RENDER STAFF
 * ============================================================ */

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
        )
        .toLowerCase();


    let list =
        staffCache.slice();


    if (search) {

        list =
            list.filter(
                function (staff) {

                    const text =
                        [
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
        String(
            staff.admin_id ||
            ""
        );


    const username =
        String(
            staff.username ||
            ""
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
                    adminId || "-"
                )}
            </td>

            <td>
                ${escapeHtml(
                    username
                )}
            </td>

            <td>
                ${escapeHtml(
                    staff.name || "-"
                )}
            </td>

            <td>
                ${escapeHtml(
                    staff.role || "-"
                )}
            </td>

            <td>
                <span class="status-badge ${getStatusClass(status)}">
                    ${escapeHtml(status)}
                </span>
            </td>

            <td>

                <div class="table-actions">

                    <button
                        type="button"
                        class="secondary-btn table-btn"
                        data-action="edit-staff"
                        data-username="${escapeAttr(username)}"
                    >
                        ✏️ แก้ไข
                    </button>

                    ${
                        String(
                            staff.role || ""
                        ).toUpperCase()
                        === "STAFF"
                            ? `
                                <button
                                    type="button"
                                    class="danger-btn table-btn"
                                    data-action="delete-staff"
                                    data-admin-id="${escapeAttr(adminId)}"
                                    data-username="${escapeAttr(username)}"
                                >
                                    🗑️ ลบ
                                </button>
                              `
                            : ""
                    }

                </div>

            </td>

        </tr>
    `;

}


/* ============================================================
 * LOAD RESET REQUESTS
 * ============================================================ */

async function loadResetRequests(
    showLoading = true
) {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    if (showLoading) {

        renderLoading(
            "resetRequestsTableBody",
            9
        );

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
                isSessionExpired(result)
            ) {

                return;

            }

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "โหลดคำขอรีเซ็ตรหัสผ่านไม่สำเร็จ"
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
            "LOAD RESET REQUESTS ERROR",
            error
        );

        renderError(
            "resetRequestsTableBody",
            9,
            error.message ||
            "โหลดคำขอรีเซ็ตรหัสผ่านไม่สำเร็จ"
        );

        throw error;

    }

}


/* ============================================================
 * RENDER RESET REQUESTS
 * ============================================================ */

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
        )
        .toLowerCase();


    const filter =
        getValue(
            "resetRequestStatusFilter"
        )
        .toUpperCase();


    let list =
        resetRequestsCache.slice();


    if (search) {

        list =
            list.filter(
                function (request) {

                    const text =
                        [
                            request.request_id,
                            request.student_id,
                            request.reason,
                            request.note,
                            request.status
                        ]
                        .join(" ")
                        .toLowerCase();


                    return text.includes(
                        search
                    );

                }
            );

    }


    if (filter) {

        list =
            list.filter(
                function (request) {

                    return (
                        String(
                            request.status ||
                            ""
                        )
                        .toUpperCase()
                        === filter
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
                    ไม่พบคำขอรีเซ็ตรหัสผ่าน
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
        String(
            request.request_id ||
            ""
        );


    const studentId =
        String(
            request.student_id ||
            ""
        );


    const status =
        String(
            request.status ||
            ""
        );


    const statusUpper =
        status.toUpperCase();


    let actionHtml =
        "";


    if (
        statusUpper ===
        "PENDING"
    ) {

        actionHtml = `
            <button
                type="button"
                class="primary-btn table-btn"
                data-action="process-reset"
                data-request-id="${escapeAttr(requestId)}"
            >
                🔑 ดำเนินการ
            </button>
        `;

    } else if (
        statusUpper ===
        "APPROVED"
    ) {

        actionHtml = `
            <button
                type="button"
                class="primary-btn table-btn"
                data-action="reset-approved"
                data-request-id="${escapeAttr(requestId)}"
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
                data-request-id="${escapeAttr(requestId)}"
            >
                👁️ ดู
            </button>
        `;

    }


    return `
        <tr>

            <td>
                ${escapeHtml(
                    requestId
                )}
            </td>

            <td>
                ${escapeHtml(
                    studentId
                )}
            </td>

            <td>
                ${escapeHtml(
                    request.reason ||
                    "-"
                )}
            </td>

            <td>
                <span class="status-badge ${getStatusClass(status)}">
                    ${escapeHtml(
                        status || "-"
                    )}
                </span>
            </td>

            <td>
                ${escapeHtml(
                    formatDateTime(
                        request.requested_at
                    )
                )}
            </td>

            <td>
                ${escapeHtml(
                    formatDateTime(
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

            <td>
                ${actionHtml}
            </td>

        </tr>
    `;

}


/* ============================================================
 * PASSWORD RESET REQUEST MODAL
 * ============================================================ */

function openResetRequestModal(
    request
) {

    if (!request) {

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


    if (details) {

        details.innerHTML = `
            <div class="reset-detail-row">
                <strong>Request ID</strong>
                <span>
                    ${escapeHtml(
                        request.request_id ||
                        "-"
                    )}
                </span>
            </div>

            <div class="reset-detail-row">
                <strong>รหัสนักศึกษา</strong>
                <span>
                    ${escapeHtml(
                        request.student_id ||
                        "-"
                    )}
                </span>
            </div>

            <div class="reset-detail-row">
                <strong>เหตุผล</strong>
                <span>
                    ${escapeHtml(
                        request.reason ||
                        "-"
                    )}
                </span>
            </div>

            <div class="reset-detail-row">
                <strong>สถานะ</strong>
                <span>
                    ${escapeHtml(
                        request.status ||
                        "-"
                    )}
                </span>
            </div>

            <div class="reset-detail-row">
                <strong>วันที่ร้องขอ</strong>
                <span>
                    ${escapeHtml(
                        formatDateTime(
                            request.requested_at
                        )
                    )}
                </span>
            </div>

            <div class="reset-detail-row">
                <strong>ผู้ดำเนินการ</strong>
                <span>
                    ${escapeHtml(
                        request.processed_by ||
                        "-"
                    )}
                </span>
            </div>
        `;

    }


    setValue(
        "resetRequestNote",
        ""
    );


    const processButton =
        getElement(
            "processResetRequestBtn"
        );


    if (processButton) {

        processButton.textContent =
            String(
                request.status ||
                ""
            ).toUpperCase()
            === "APPROVED"
                ? "🔑 รีเซ็ตรหัสผ่าน"
                : "✅ อนุมัติคำร้อง";

        processButton.disabled =
            false;

    }


    /*
     * เพิ่มปุ่ม Reject เฉพาะ PENDING
     */
    removeDynamicRejectButton();


    if (
        String(
            request.status ||
            ""
        ).toUpperCase()
        === "PENDING"
    ) {

        const rejectButton =
            document.createElement(
                "button"
            );


        rejectButton.type =
            "button";

        rejectButton.id =
            "dynamicRejectResetBtn";

        rejectButton.className =
            "danger-btn";

        rejectButton.textContent =
            "❌ ปฏิเสธคำร้อง";


        rejectButton.addEventListener(
            "click",
            handleRejectCurrentReset
        );


        if (processButton) {

            processButton
                .parentElement
                .insertBefore(
                    rejectButton,
                    processButton
                );

        }

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


    const status =
        String(
            currentResetRequest.status ||
            ""
        )
        .toUpperCase();


    const note =
        getValue(
            "resetRequestNote"
        );


    if (
        status === "PENDING"
    ) {

        await approveResetRequest(
            currentResetRequest.request_id,
            note
        );

        return;

    }


    if (
        status === "APPROVED"
    ) {

        await resetApprovedRequest(
            currentResetRequest.request_id,
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

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const button =
        getElement(
            "processResetRequestBtn"
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

    }

}


/* ============================================================
 * REJECT RESET
 * ============================================================ */

async function handleRejectCurrentReset() {

    if (
        !currentResetRequest
    ) {

        return;

    }


    const requestId =
        currentResetRequest.request_id;


    const note =
        getValue(
            "resetRequestNote"
        );


    const ok =
        confirm(
            "ต้องการปฏิเสธคำขอ Password Reset นี้หรือไม่?"
        );


    if (!ok) {

        return;

    }


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const button =
        getElement(
            "dynamicRejectResetBtn"
        );


    setButtonLoading(
        button,
        true,
        "กำลังดำเนินการ..."
    );


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
            "❌ ปฏิเสธคำร้อง"
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

    const newPassword =
        prompt(
            "กรอกรหัสผ่านใหม่\n\nถ้ากด OK โดยไม่กรอก ระบบจะใช้รหัสผ่านเริ่มต้นของระบบ"
        );


    if (
        newPassword === null
    ) {

        return;

    }


    if (
        newPassword &&
        newPassword.length < 4
    ) {

        showMessage(
            "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร",
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


    const button =
        getElement(
            "processResetRequestBtn"
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

                newPassword:
                    newPassword || "",

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


        let message =
            result.message ||
            "รีเซ็ตรหัสผ่านสำเร็จ";


        if (
            result.password
        ) {

            message +=
                "\nรหัสผ่านใหม่: " +
                result.password;

        }


        alert(
            message
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


    } catch (error) {

        console.error(
            "RESET APPROVED REQUEST ERROR",
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

    }

}


/* ============================================================
 * DIRECT STUDENT PASSWORD RESET
 * ============================================================ */

async function directResetStudentPassword(
    studentId
) {

    if (!studentId) {

        showMessage(
            "ไม่พบรหัสนักศึกษา",
            "error"
        );

        return;

    }


    const newPassword =
        prompt(
            "รีเซ็ตรหัสผ่านนักศึกษา\n\nรหัสนักศึกษา: " +
            studentId +
            "\n\nกรอกรหัสผ่านใหม่\nถ้ากด OK โดยไม่กรอก ระบบจะใช้รหัสผ่านเริ่มต้น"
        );


    if (
        newPassword === null
    ) {

        return;

    }


    if (
        newPassword &&
        newPassword.length < 4
    ) {

        showMessage(
            "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร",
            "error"
        );

        return;

    }


    const ok =
        confirm(
            "ยืนยันรีเซ็ตรหัสผ่านนักศึกษา\n\n" +
            studentId
        );


    if (!ok) {

        return;

    }


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    try {

        setConnection(
            "กำลังรีเซ็ตรหัสผ่าน..."
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
                    newPassword || "",

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


        let message =
            result.message ||
            "รีเซ็ตรหัสผ่านสำเร็จ";


        if (
            result.password
        ) {

            message +=
                "\nรหัสผ่านใหม่: " +
                result.password;

        }


        alert(
            message
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

    }

}


/* ============================================================
 * DELETE STAFF
 * ============================================================ */

async function deleteStaff(
    adminId,
    username
) {

    if (!adminId) {

        showMessage(
            "ไม่พบ Admin ID ของ Staff",
            "error"
        );

        return;

    }


    const ok =
        confirm(
            "ยืนยันการลบ Staff\n\n" +
            (username || adminId) +
            "\n\nการลบไม่สามารถย้อนกลับได้"
        );


    if (!ok) {

        return;

    }


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    try {

        setConnection(
            "กำลังลบ Staff..."
        );


        const result =
            await apiRequest({

                action:
                    "adminDeleteStaff",

                token:
                    token,

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


                        if (!section) {
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
    section
) {

    const sectionMap = {

        dashboard:
            "section-dashboard",

        students:
            "section-students",

        "add-student":
            "section-add-student",

        staff:
            "section-staff",

        "reset-requests":
            "section-reset-requests"

    };


    const sectionId =
        sectionMap[
            section
        ];


    if (!sectionId) {

        console.warn(
            "UNKNOWN ADMIN SECTION:",
            section
        );

        return;

    }


    const target =
        getElement(
            sectionId
        );


    if (!target) {

        console.error(
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
            function (element) {

                element.classList.remove(
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
            function (element) {

                element.classList.toggle(
                    "active",
                    element.dataset.section === section
                );

            }
        );


    updatePageTitle(
        section
    );


    /*
     * โหลดใหม่เมื่อเข้าแต่ละเมนู
     */
    if (
        section === "students"
    ) {

        loadStudents(
            false
        )
        .catch(
            console.error
        );

    }


    if (
        section === "staff"
    ) {

        loadStaff(
            false
        )
        .catch(
            console.error
        );

    }


    if (
        section === "reset-requests"
    ) {

        loadResetRequests(
            false
        )
        .catch(
            console.error
        );

    }


    /*
     * ปิด sidebar บนมือถือ
     */
    const sidebar =
        getElement(
            "adminSidebar"
        );


    if (
        sidebar &&
        window.innerWidth <= 900
    ) {

        sidebar.classList.remove(
            "open"
        );

    }

}


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
        titles[
            section
        ] ||
        titles.dashboard;


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
 * BUTTON BINDING
 * ============================================================ */

function bindButtons() {

    bindClick(
        "addStudentBtn",
        function () {

            openStudentModal();

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
        "processResetRequestBtn",
        handleProcessResetRequest
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
        "logoutBtn",
        handleLogout
    );


    bindClick(
        "sidebarToggle",
        toggleSidebar
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


    if (studentForm) {

        studentForm.addEventListener(
            "submit",
            handleAddStudent
        );

    }


    const studentModalForm =
        getElement(
            "studentModalForm"
        );


    if (studentModalForm) {

        studentModalForm.addEventListener(
            "submit",
            handleStudentModalSubmit
        );

    }


    const staffForm =
        getElement(
            "staffForm"
        );


    if (staffForm) {

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


            if (!button) {
                return;
            }


            const action =
                button.dataset.action;


            if (
                action ===
                "edit-student"
            ) {

                const id =
                    button.dataset.studentId;


                const student =
                    findStudent(
                        id
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

                return;

            }


            if (
                action ===
                "reset-student"
            ) {

                directResetStudentPassword(
                    button.dataset.studentId
                );

                return;

            }


            if (
                action ===
                "edit-staff"
            ) {

                const username =
                    button.dataset.username;


                const staff =
                    findStaffByUsername(
                        username
                    );


                if (!staff) {

                    showMessage(
                        "ไม่พบข้อมูล Staff",
                        "error"
                    );

                    return;

                }


                openStaffModal(
                    staff
                );

                return;

            }


            if (
                action ===
                "delete-staff"
            ) {

                deleteStaff(
                    button.dataset.adminId,
                    button.dataset.username
                );

                return;

            }


            if (
                action ===
                "process-reset"
            ) {

                const request =
                    findResetRequest(
                        button.dataset.requestId
                    );


                openResetRequestModal(
                    request
                );

                return;

            }


            if (
                action ===
                "reset-approved"
            ) {

                const request =
                    findResetRequest(
                        button.dataset.requestId
                    );


                openResetRequestModal(
                    request
                );

                return;

            }


            if (
                action ===
                "view-reset"
            ) {

                const request =
                    findResetRequest(
                        button.dataset.requestId
                    );


                openResetRequestModal(
                    request
                );

                return;

            }

        }
    );

}


/* ============================================================
 * SEARCH
 * ============================================================ */

function bindSearch() {

    const studentSearch =
        getElement(
            "studentSearch"
        );


    if (studentSearch) {

        studentSearch.addEventListener(
            "input",
            renderStudents
        );

    }


    const staffSearch =
        getElement(
            "staffSearch"
        );


    if (staffSearch) {

        staffSearch.addEventListener(
            "input",
            renderStaff
        );

    }


    const resetSearch =
        getElement(
            "resetRequestSearch"
        );


    if (resetSearch) {

        resetSearch.addEventListener(
            "input",
            renderResetRequests
        );

    }


    const resetFilter =
        getElement(
            "resetRequestStatusFilter"
        );


    if (resetFilter) {

        resetFilter.addEventListener(
            "change",
            renderResetRequests
        );

    }

}


/* ============================================================
 * MODAL BACKDROPS
 * ============================================================ */

function bindModalBackdrops() {

    [
        "studentModal",
        "staffModal",
        "resetRequestModal"
    ]
    .forEach(
        function (id) {

            const modal =
                getElement(id);


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


/* ============================================================
 * MODAL HELPERS
 * ============================================================ */

function showModal(
    id
) {

    const modal =
        getElement(id);


    if (!modal) {

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
        getElement(id);


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
        id ===
        "studentModal"
    ) {

        currentStudent =
            null;

    }


    if (
        id ===
        "staffModal"
    ) {

        currentStaff =
            null;

    }


    if (
        id ===
        "resetRequestModal"
    ) {

        currentResetRequest =
            null;

        removeDynamicRejectButton();

    }

}


function removeDynamicRejectButton() {

    const button =
        getElement(
            "dynamicRejectResetBtn"
        );


    if (button) {

        button.remove();

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


    const idInput =
        getElement(
            "modalStudentId"
        );


    if (idInput) {

        idInput.readOnly =
            false;

    }

}


/* ============================================================
 * CLEAR STAFF MODAL
 * ============================================================ */

function clearStaffModal() {

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
        "ACTIVE"
    );


    const usernameInput =
        getElement(
            "staffUsername"
        );


    if (usernameInput) {

        usernameInput.readOnly =
            false;

    }


    const passwordInput =
        getElement(
            "staffPassword"
        );


    if (passwordInput) {

        passwordInput.required =
            true;

        passwordInput.placeholder =
            "รหัสผ่าน";

    }

}


/* ============================================================
 * ADD STUDENT FORM RESET
 * ============================================================ */

function resetStudentAddForm() {

    const form =
        getElement(
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
 * FIND DATA
 * ============================================================ */

function findStudent(
    studentId
) {

    const id =
        String(
            studentId || ""
        ).trim();


    return (
        studentsCache.find(
            function (student) {

                return (
                    String(
                        student.student_id ||
                        ""
                    ).trim()
                    === id
                );

            }
        ) ||
        null
    );

}


function findStaffByUsername(
    username
) {

    const value =
        String(
            username || ""
        ).trim();


    return (
        staffCache.find(
            function (staff) {

                return (
                    String(
                        staff.username ||
                        ""
                    ).trim()
                    === value
                );

            }
        ) ||
        null
    );

}


function findResetRequest(
    requestId
) {

    const id =
        String(
            requestId || ""
        ).trim();


    return (
        resetRequestsCache.find(
            function (request) {

                return (
                    String(
                        request.request_id ||
                        ""
                    ).trim()
                    === id
                );

            }
        ) ||
        null
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
                    String(
                        student.status ||
                        ""
                    )
                    .trim()
                    .toUpperCase();


                return (
                    status ===
                    "นักศึกษาปกติ".toUpperCase()
                    ||
                    status ===
                    "ACTIVE"
                );

            }
        ).length;


    const totalStaff =
        staffCache.length;


    const pendingReset =
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
        pendingReset
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


    if (!badge) {
        return;
    }


    const pending =
        resetRequestsCache.filter(
            function (request) {

                return (
                    String(
                        request.status ||
                        ""
                    )
                    .toUpperCase()
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

    let raw = null;


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
            "ADMIN PROFILE READ ERROR",
            error
        );

    }


    if (!raw) {

        raw =
            sessionStorage.getItem(
                "admin"
            );

    }


    if (!raw) {
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
            "ADMIN PROFILE PARSE ERROR",
            error
        );

    }

}


/* ============================================================
 * LOGOUT
 * ============================================================ */

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
            "ADMIN LOGOUT API ERROR",
            error
        );

    } finally {

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
                "SESSION CLEAR ERROR",
                error
            );

        }


        sessionStorage.removeItem(
            "adminSessionId"
        );

        sessionStorage.removeItem(
            "admin_session"
        );

        sessionStorage.removeItem(
            "adminToken"
        );

        sessionStorage.removeItem(
            "admin"
        );


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


    if (!sidebar) {
        return;
    }


    sidebar.classList.toggle(
        "open"
    );

}


/* ============================================================
 * SEARCH BIND
 *
 * แยกไว้ท้ายไฟล์เพื่อให้มั่นใจว่า
 * DOM โหลดครบก่อน
 * ============================================================ */

setTimeout(
    function () {

        bindSearch();

    },
    0
);


/* ============================================================
 * UI HELPERS
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
        getElement(id);


    if (
        !element
    ) {

        console.warn(
            "BUTTON NOT FOUND:",
            id
        );

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
        getElement(id);


    if (!element) {
        return "";
    }


    return String(
        element.value ||
        ""
    ).trim();

}


function getRawValue(
    id
) {

    const element =
        getElement(id);


    if (!element) {
        return "";
    }


    return String(
        element.value ||
        ""
    );

}


function setValue(
    id,
    value
) {

    const element =
        getElement(id);


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
        getElement(id);


    if (!element) {
        return;
    }


    element.textContent =
        value == null
            ? ""
            : value;

}


function setConnection(
    text,
    good = true
) {

    const element =
        getElement(
            "connectionStatus"
        );


    if (!element) {
        return;
    }


    element.textContent =
        text;


    element.classList.toggle(
        "error",
        !good
    );

}


function showMessage(
    message,
    type = "info"
) {

    const box =
        getElement(
            "messageBox"
        );


    if (!box) {

        if (
            type === "error"
        ) {

            console.error(
                message
            );

        } else {

            console.log(
                message
            );

        }

        return;

    }


    box.textContent =
        message || "";


    box.className =
        "message-box " +
        type;


    box.classList.add(
        "show"
    );


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        setTimeout(
            function () {

                box.classList.remove(
                    "show"
                );

            },
            4000
        );

}


function setButtonLoading(
    button,
    loading,
    text
) {

    if (!button) {
        return;
    }


    if (
        loading
    ) {

        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
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
            button.dataset.originalText ||
            "บันทึก";

    }

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


    if (!tbody) {
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
                    message ||
                    "เกิดข้อผิดพลาด"
                )}
            </td>
        </tr>
    `;

}


/* ============================================================
 * STATUS
 * ============================================================ */

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
        value ===
            "นักศึกษาปกติ".toUpperCase() ||
        value === "APPROVED" ||
        value === "RESET"
    ) {

        return "status-active";

    }


    if (
        value === "PENDING" ||
        value === "PROCESSING"
    ) {

        return "status-pending";

    }


    if (
        value === "INACTIVE" ||
        value === "REJECTED" ||
        value === "พ้นสภาพ".toUpperCase()
    ) {

        return "status-inactive";

    }


    return "status-default";

}


/* ============================================================
 * DATE
 * ============================================================ */

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


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            text
        )
    ) {

        return text;

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return text;

    }


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
        date.getFullYear()
    );

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


    const text =
        String(
            value
        ).trim();


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return text;

    }


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


function normalizeDateForInput(
    value
) {

    if (
        !value
    ) {

        return "";

    }


    const text =
        String(
            value
        ).trim();


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            text
        )
    ) {

        return text;

    }


    const match =
        text.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        );


    if (match) {

        let year =
            Number(
                match[3]
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
            year +
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


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return (
        date.getFullYear() +
        "-" +
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        ) +
        "-" +
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )
    );

}


/* ============================================================
 * SECURITY / HTML ESCAPE
 * ============================================================ */

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


function escapeAttr(
    value
) {

    return escapeHtml(
        value
    );

}


/* ============================================================
 * FINAL START LOG
 * ============================================================ */

console.log(
    "ADMIN DASHBOARD JS READY"
);
