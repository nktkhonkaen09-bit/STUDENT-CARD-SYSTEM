/*******************************************************
 * ADMIN DASHBOARD
 * File: js/admin-dashboard.js
 *
 * ใช้ร่วมกับ:
 *   - config.js
 *   - admin-dashboard.html
 *   - admin-dashboard.css
 *
 * ระบบ:
 *   1. ตรวจสอบ Admin Session
 *   2. แสดงข้อมูล Admin
 *   3. โหลดนักศึกษา
 *   4. ค้นหานักศึกษา
 *   5. เพิ่มนักศึกษา
 *   6. แก้ไขนักศึกษา
 *   7. รีเซ็ตรหัสผ่านนักศึกษา
 *   8. โหลด Staff
 *   9. เพิ่ม Staff
 *  10. Logout
 *******************************************************/


"use strict";


/* =====================================================
   GLOBAL STATE
===================================================== */

let studentsCache = [];

let staffCache = [];

let editingStudentId = null;

let isStudentSaving = false;

let isStaffSaving = false;

let isLoggingOut = false;

let sessionExpiredHandled = false;


/* =====================================================
   DOM READY
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "================================="
        );

        console.log(
            "ADMIN DASHBOARD JS READY"
        );

        console.log(
            "================================="
        );


        /*
         * ตรวจ CONFIG
         */

        if (
            typeof CONFIG === "undefined"
        ) {

            console.error(
                "CONFIG is not defined"
            );

            showMessage(
                "ไม่พบ config.js กรุณาตรวจสอบไฟล์",
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
                "CONFIG.API_URL is empty"
            );

            showMessage(
                "ไม่พบ API_URL ใน config.js",
                "error"
            );

            return;

        }


        /*
         * เริ่มระบบ
         */

        setupEvents();

        checkAdminSession();

    }
);


/* =====================================================
   SETUP EVENTS
===================================================== */

function setupEvents() {


    /* -----------------------------------------------
       LOGOUT
    ------------------------------------------------ */

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


    /* -----------------------------------------------
       STUDENT SEARCH
    ------------------------------------------------ */

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


    /* -----------------------------------------------
       ADD STUDENT
    ------------------------------------------------ */

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


    /* -----------------------------------------------
       CLOSE STUDENT MODAL
    ------------------------------------------------ */

    const closeStudentModal =
        document.getElementById(
            "closeStudentModal"
        );


    if (closeStudentModal) {

        closeStudentModal.addEventListener(
            "click",
            closeStudentModalHandler
        );

    }


    const closeStudentModal2 =
        document.getElementById(
            "closeStudentModal2"
        );


    if (closeStudentModal2) {

        closeStudentModal2.addEventListener(
            "click",
            closeStudentModalHandler
        );

    }


    /* -----------------------------------------------
       STUDENT FORM
    ------------------------------------------------ */

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


    /* -----------------------------------------------
       ADD STAFF
    ------------------------------------------------ */

    const addStaffBtn =
        document.getElementById(
            "addStaffBtn"
        );


    if (addStaffBtn) {

        addStaffBtn.addEventListener(
            "click",
            openStaffModal
        );

    }


    /* -----------------------------------------------
       CLOSE STAFF MODAL
    ------------------------------------------------ */

    const closeStaffModal =
        document.getElementById(
            "closeStaffModal"
        );


    if (closeStaffModal) {

        closeStaffModal.addEventListener(
            "click",
            closeStaffModalHandler
        );

    }


    const closeStaffModal2 =
        document.getElementById(
            "closeStaffModal2"
        );


    if (closeStaffModal2) {

        closeStaffModal2.addEventListener(
            "click",
            closeStaffModalHandler
        );

    }


    /* -----------------------------------------------
       STAFF FORM
    ------------------------------------------------ */

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


    /* -----------------------------------------------
       CLICK OUTSIDE STUDENT MODAL
    ------------------------------------------------ */

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

                    closeStudentModalHandler();

                }

            }
        );

    }


    /* -----------------------------------------------
       CLICK OUTSIDE STAFF MODAL
    ------------------------------------------------ */

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

                    closeStaffModalHandler();

                }

            }
        );

    }


    /* -----------------------------------------------
       ESC KEY
    ------------------------------------------------ */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !== "Escape"
            ) {

                return;

            }


            closeStudentModalHandler();

            closeStaffModalHandler();

        }
    );

}


/* =====================================================
   CHECK ADMIN SESSION
===================================================== */

async function checkAdminSession() {

    const token =
        getAdminToken();


    /*
     * ไม่มี Token
     */

    if (!token) {

        console.warn(
            "ADMIN SESSION NOT FOUND"
        );

        redirectToLogin();

        return;

    }


    /*
     * แสดงข้อมูล Admin ทันที
     */

    loadAdminDisplay();


    /*
     * โหลดข้อมูล
     */

    try {

        await loadStudents();

        /*
         * ถ้า Session ถูกล้างระหว่างโหลด
         * หยุดทันที
         */

        if (
            !getAdminToken()
        ) {

            return;

        }


        await loadStaff();

    } catch (error) {

        console.error(
            "CHECK ADMIN SESSION ERROR",
            error
        );


        /*
         * ถ้าเป็น Session หมดอายุ
         */

        if (
            isSessionExpiredError(
                error
            )
        ) {

            handleSessionExpired();

            return;

        }


        showMessage(
            "ไม่สามารถโหลดข้อมูลจากระบบได้",
            "error"
        );

    }

}


/* =====================================================
   GET ADMIN TOKEN
===================================================== */

function getAdminToken() {

    if (
        typeof CONFIG === "undefined"
    ) {

        return "";

    }


    const key =
        CONFIG.ADMIN_SESSION_KEY ||
        "admin_session";


    return (
        sessionStorage.getItem(
            key
        ) || ""
    ).trim();

}


/* =====================================================
   GET ADMIN DATA
===================================================== */

function getAdminData() {

    if (
        typeof CONFIG === "undefined"
    ) {

        return null;

    }


    const key =
        CONFIG.ADMIN_KEY ||
        "admin_data";


    const raw =
        sessionStorage.getItem(
            key
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
            "ADMIN DATA JSON ERROR",
            error
        );

        return null;

    }

}


/* =====================================================
   LOAD ADMIN DISPLAY
===================================================== */

function loadAdminDisplay() {

    const admin =
        getAdminData();


    const nameElement =
        document.getElementById(
            "adminName"
        );


    const roleElement =
        document.getElementById(
            "adminRole"
        );


    if (!admin) {

        if (nameElement) {

            nameElement.textContent =
                "Admin";

        }


        if (roleElement) {

            roleElement.textContent =
                "ADMIN";

        }


        return;

    }


    const name =
        admin.name ||
        admin.full_name ||
        admin.displayName ||
        admin.username ||
        "Admin";


    const role =
        admin.role ||
        "ADMIN";


    if (nameElement) {

        nameElement.textContent =
            name;

    }


    if (roleElement) {

        roleElement.textContent =
            role;

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
            "API INVALID JSON",
            text
        );

        throw new Error(
            "API ส่งข้อมูลกลับมาไม่ถูกต้อง"
        );

    }


    console.log(
        "[API]",
        data.action,
        result
    );


    return result;

}


/* =====================================================
   SESSION EXPIRED CHECK
===================================================== */

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
        code ===
        "UNAUTHORIZED"
    ) {

        return true;

    }


    if (
        code ===
        "INVALID_TOKEN"
    ) {

        return true;

    }


    /*
     * รองรับ Backend ที่ส่งข้อความแทน code
     */

    if (
        message.includes(
            "session expired"
        )
    ) {

        return true;

    }


    if (
        message.includes(
            "invalid token"
        )
    ) {

        return true;

    }


    if (
        message.includes(
            "unauthorized"
        )
    ) {

        return true;

    }


    if (
        message.includes(
            "หมดอายุ"
        )
    ) {

        return true;

    }


    return false;

}


/* =====================================================
   SESSION EXPIRED ERROR
===================================================== */

function isSessionExpiredError(
    error
) {

    if (!error) {

        return false;

    }


    const message =
        String(
            error.message ||
            ""
        )
        .toLowerCase();


    return (

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

    );

}


/* =====================================================
   HANDLE SESSION EXPIRED
===================================================== */

function handleSessionExpired() {

    /*
     * ป้องกัน alert / redirect ซ้ำ
     */

    if (
        sessionExpiredHandled
    ) {

        return;

    }


    sessionExpiredHandled =
        true;


    console.warn(
        "ADMIN SESSION EXPIRED"
    );


    clearAdminSession();


    alert(
        "Session ของ Admin หมดอายุ กรุณาเข้าสู่ระบบใหม่"
    );


    redirectToLogin();

}


/* =====================================================
   CLEAR ADMIN SESSION
===================================================== */

function clearAdminSession() {

    const sessionKey =
        (
            CONFIG &&
            CONFIG.ADMIN_SESSION_KEY
        )
        ||
        "admin_session";


    const adminKey =
        (
            CONFIG &&
            CONFIG.ADMIN_KEY
        )
        ||
        "admin_data";


    sessionStorage.removeItem(
        sessionKey
    );


    sessionStorage.removeItem(
        adminKey
    );

}


/* =====================================================
   REDIRECT LOGIN
===================================================== */

function redirectToLogin() {

    /*
     * ป้องกัน redirect ซ้ำ
     */

    if (
        window.location.pathname
            .toLowerCase()
            .includes(
                "admin-login.html"
            )
    ) {

        return;

    }


    window.location.replace(
        "admin-login.html"
    );

}


/* =====================================================
   LOAD STUDENTS
===================================================== */

async function loadStudents() {

    const tbody =
        document.getElementById(
            "studentsTableBody"
        );


    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    setStudentLoading(
        true
    );


    try {

        const result =
            await apiRequest({

                action:
                    "adminGetStudents",

                token:
                    token

            });


        /*
         * ตรวจ Session
         */

        if (
            isSessionExpired(
                result
            )
        ) {

            handleSessionExpired();

            return;

        }


        /*
         * API Error
         */

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


        /*
         * รองรับหลายรูปแบบ
         */

        if (
            Array.isArray(
                result.students
            )
        ) {

            studentsCache =
                result.students;

        } else if (
            result.data &&
            Array.isArray(
                result.data.students
            )
        ) {

            studentsCache =
                result.data.students;

        } else if (
            Array.isArray(
                result.data
            )
        ) {

            studentsCache =
                result.data;

        } else {

            studentsCache =
                [];

        }


        renderStudents();


    } catch (error) {

        console.error(
            "LOAD STUDENTS ERROR",
            error
        );


        if (
            isSessionExpiredError(
                error
            )
        ) {

            handleSessionExpired();

            return;

        }


        renderStudentsError();


        showMessage(
            error.message ||
            "ไม่สามารถโหลดข้อมูลนักศึกษาได้",
            "error"
        );

    } finally {

        setStudentLoading(
            false
        );

    }

}


/* =====================================================
   RENDER STUDENTS
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


    /*
     * Search
     */

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
                    .map(
                        function (value) {

                            return (
                                value == null
                                    ? ""
                                    : String(
                                        value
                                    )
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


    /*
     * Empty
     */

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


    /*
     * Render
     */

    tbody.innerHTML =
        list
            .map(
                createStudentRow
            )
            .join("");

}


/* =====================================================
   CREATE STUDENT ROW
===================================================== */

function createStudentRow(
    student
) {

    const rawStudentId =
        student.student_id ||
        student.studentId ||
        "";


    const studentId =
        escapeHtml(
            rawStudentId
        );


    const fullname =
        [

            student.prefix_th,

            student.firstname_th,

            student.lastname_th

        ]
        .filter(
            function (value) {

                return (
                    value !== null &&
                    value !== undefined &&
                    String(value).trim() !== ""
                );

            }
        )
        .join(" ");


    const englishName =
        [

            student.firstname_en,

            student.lastname_en

        ]
        .filter(
            function (value) {

                return (
                    value !== null &&
                    value !== undefined &&
                    String(value).trim() !== ""
                );

            }
        )
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


    const safeId =
        escapeHtml(
            rawStudentId
        );


    /*
     * ใช้ data-student-id
     * แทนการเอา ID ไปใส่ onclick
     *
     * ป้องกันปัญหาเครื่องหมาย ' และ "
     */

    return `

        <tr>

            <td
                data-label="รหัสนักศึกษา"
            >

                <strong>
                    ${studentId || "-"}
                </strong>

            </td>


            <td
                data-label="ชื่อ-นามสกุล"
            >

                ${escapeHtml(
                    fullname || "-"
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
            >

                <div class="action-buttons">

                    <button
                        type="button"
                        class="small-btn edit-btn"
                        data-action="edit"
                        data-student-id="${safeId}"
                    >
                        แก้ไข
                    </button>


                    <button
                        type="button"
                        class="small-btn reset-btn"
                        data-action="reset-password"
                        data-student-id="${safeId}"
                    >
                        รีเซ็ตรหัสผ่าน
                    </button>

                </div>

            </td>

        </tr>

    `;

}


/* =====================================================
   STUDENT TABLE EVENTS
===================================================== */

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


        if (!studentId) {

            return;

        }


        if (
            action === "edit"
        ) {

            editStudent(
                studentId
            );

        }


        if (
            action ===
            "reset-password"
        ) {

            resetStudentPassword(
                studentId
            );

        }

    }
);


/* =====================================================
   STUDENT LOADING
===================================================== */

function setStudentLoading(
    loading
) {

    const tbody =
        document.getElementById(
            "studentsTableBody"
        );


    if (!tbody) {

        return;

    }


    if (!loading) {

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

}


/* =====================================================
   STUDENT ERROR
===================================================== */

function renderStudentsError() {

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
                class="error-row"
            >

                ไม่สามารถโหลดข้อมูลนักศึกษาได้

            </td>

        </tr>

    `;

}


/* =====================================================
   OPEN STUDENT MODAL
===================================================== */

function openStudentModal(
    student
) {

    const modal =
        document.getElementById(
            "studentModal"
        );


    if (!modal) {

        return;

    }


    /*
     * Reset Form ก่อน
     */

    resetStudentForm();


    editingStudentId =
        null;


    /*
     * ADD MODE
     */

    if (!student) {

        const title =
            modal.querySelector(
                ".modal-header h2"
            );


        if (title) {

            title.textContent =
                "เพิ่มนักศึกษา";

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
        student.student_id;


    setInputValue(
        "studentId",
        student.student_id
    );


    setInputValue(
        "studentPassword",
        ""
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
        student.status
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
     * Title
     */

    const title =
        modal.querySelector(
            ".modal-header h2"
        );


    if (title) {

        title.textContent =
            "แก้ไขข้อมูลนักศึกษา";

    }


    /*
     * Student ID readonly
     */

    const idInput =
        document.getElementById(
            "studentId"
        );


    if (idInput) {

        idInput.readOnly =
            true;

    }


    /*
     * Password
     */

    const passwordInput =
        document.getElementById(
            "studentPassword"
        );


    if (passwordInput) {

        passwordInput.required =
            false;

        passwordInput.placeholder =
            "เว้นว่างหากไม่ต้องการเปลี่ยนรหัสผ่าน";

    }


    /*
     * Save Button
     */

    const saveBtn =
        document.getElementById(
            "saveStudentBtn"
        );


    if (saveBtn) {

        saveBtn.textContent =
            "บันทึกการแก้ไข";

    }


    modal.classList.add(
        "show"
    );

}


/* =====================================================
   EDIT STUDENT
===================================================== */

function editStudent(
    studentId
) {

    const target =
        String(
            studentId || ""
        )
        .trim();


    const student =
        studentsCache.find(
            function (item) {

                return String(
                    item.student_id ||
                    item.studentId ||
                    ""
                )
                .trim()
                ===
                target;

            }
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


/* =====================================================
   CLOSE STUDENT MODAL
===================================================== */

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


/* =====================================================
   RESET STUDENT FORM
===================================================== */

function resetStudentForm() {

    const form =
        document.getElementById(
            "studentForm"
        );


    if (form) {

        form.reset();

    }


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


    const saveBtn =
        document.getElementById(
            "saveStudentBtn"
        );


    if (saveBtn) {

        saveBtn.textContent =
            "บันทึกนักศึกษา";

    }

}


/* =====================================================
   HANDLE STUDENT SUBMIT
===================================================== */

async function handleStudentSubmit(
    event
) {

    event.preventDefault();


    if (
        isStudentSaving
    ) {

        return;

    }


    const token =
        getAdminToken();


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


    const prefix =
        getInputValue(
            "studentPrefix"
        );


    const firstnameTh =
        getInputValue(
            "studentFirstnameTh"
        );


    const lastnameTh =
        getInputValue(
            "studentLastnameTh"
        );


    const firstnameEn =
        getInputValue(
            "studentFirstnameEn"
        );


    const lastnameEn =
        getInputValue(
            "studentLastnameEn"
        );


    const department =
        getInputValue(
            "studentDepartment"
        );


    const phone =
        getInputValue(
            "studentPhone"
        );


    const status =
        getInputValue(
            "studentStatus"
        );


    const issueDate =
        getInputValue(
            "studentIssueDate"
        );


    const expireDate =
        getInputValue(
            "studentExpireDate"
        );


    const photoUrl =
        getInputValue(
            "studentPhoto"
        );


    /*
     * Validation
     */

    if (!studentId) {

        showMessage(
            "กรุณากรอกรหัสนักศึกษา",
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

            token:
                token,

            student_id:
                studentId,

            password:
                password,

            prefix_th:
                prefix,

            firstname_th:
                firstnameTh,

            lastname_th:
                lastnameTh,

            firstname_en:
                firstnameEn,

            lastname_en:
                lastnameEn,

            department:
                department,

            phone:
                phone,

            status:
                status,

            issue_date:
                issueDate,

            expire_date:
                expireDate,

            photo_url:
                photoUrl

        });


        return;

    }


    /*
     * EDIT
     */

    await updateStudent({

        token:
            token,

        student_id:
            editingStudentId,

        prefix_th:
            prefix,

        firstname_th:
            firstnameTh,

        lastname_th:
            lastnameTh,

        firstname_en:
            firstnameEn,

        lastname_en:
            lastnameEn,

        department:
            department,

        phone:
            phone,

        status:
            status,

        issue_date:
            issueDate,

        expire_date:
            expireDate,

        photo_url:
            photoUrl

    });

}


/* =====================================================
   ADD STUDENT
===================================================== */

async function addStudent(
    data
) {

    if (
        isStudentSaving
    ) {

        return;

    }


    isStudentSaving =
        true;


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
                    data.token,

                student_id:
                    data.student_id,

                password:
                    data.password,

                prefix_th:
                    data.prefix_th,

                firstname_th:
                    data.firstname_th,

                lastname_th:
                    data.lastname_th,

                firstname_en:
                    data.firstname_en,

                lastname_en:
                    data.lastname_en,

                department:
                    data.department,

                phone:
                    data.phone,

                status:
                    data.status,

                issue_date:
                    data.issue_date,

                expire_date:
                    data.expire_date,

                photo_url:
                    data.photo_url

            });


        if (
            isSessionExpired(
                result
            )
        ) {

            handleSessionExpired();

            return;

        }


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
            "เพิ่มนักศึกษาสำเร็จ",
            "success"
        );


        closeStudentModalHandler();


        await loadStudents();


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

        isStudentSaving =
            false;


        setButtonLoading(
            button,
            false,
            "บันทึกนักศึกษา"
        );

    }

}


/* =====================================================
   UPDATE STUDENT
===================================================== */

async function updateStudent(
    data
) {

    if (
        isStudentSaving
    ) {

        return;

    }


    isStudentSaving =
        true;


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

                token:
                    data.token,

                student_id:
                    data.student_id,

                prefix_th:
                    data.prefix_th,

                firstname_th:
                    data.firstname_th,

                lastname_th:
                    data.lastname_th,

                firstname_en:
                    data.firstname_en,

                lastname_en:
                    data.lastname_en,

                department:
                    data.department,

                phone:
                    data.phone,

                status:
                    data.status,

                issue_date:
                    data.issue_date,

                expire_date:
                    data.expire_date,

                photo_url:
                    data.photo_url

            });


        if (
            isSessionExpired(
                result
            )
        ) {

            handleSessionExpired();

            return;

        }


        if (
            !result ||
            !result.success
        ) {

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


        closeStudentModalHandler();


        await loadStudents();


    } catch (error) {

        console.error(
            "UPDATE STUDENT ERROR",
            error
        );


        showMessage(
            error.message ||
            "แก้ไขข้อมูลไม่สำเร็จ",
            "error"
        );

    } finally {

        isStudentSaving =
            false;


        setButtonLoading(
            button,
            false,
            "บันทึกการแก้ไข"
        );

    }

}


/* =====================================================
   RESET STUDENT PASSWORD
===================================================== */

async function resetStudentPassword(
    studentId
) {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const target =
        String(
            studentId || ""
        ).trim();


    if (!target) {

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
                    item.student_id ||
                    item.studentId ||
                    ""
                )
                .trim()
                ===
                target;

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
        window.confirm(

            "ต้องการรีเซ็ตรหัสผ่านนักศึกษาหรือไม่?\n\n" +

            "รหัสนักศึกษา: " +
            target +

            (
                name
                    ? "\nชื่อ: " +
                      name
                    : ""
            ) +

            "\n\n" +

            "รหัสผ่านใหม่จะเป็น: 123456"

        );


    if (!confirmed) {

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
                    target,

                newPassword:
                    "123456"

            });


        if (
            isSessionExpired(
                result
            )
        ) {

            handleSessionExpired();

            return;

        }


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


        showMessage(
            "รีเซ็ตรหัสผ่านสำเร็จ รหัสผ่านใหม่คือ 123456",
            "success"
        );


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

    }

}


/* =====================================================
   LOAD STAFF
===================================================== */

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
                colspan="5"
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
            isSessionExpired(
                result
            )
        ) {

            handleSessionExpired();

            return;

        }


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "ไม่สามารถโหลด Staff ได้"
            );

        }


        if (
            Array.isArray(
                result.staff
            )
        ) {

            staffCache =
                result.staff;

        } else if (
            result.data &&
            Array.isArray(
                result.data.staff
            )
        ) {

            staffCache =
                result.data.staff;

        } else if (
            Array.isArray(
                result.data
            )
        ) {

            staffCache =
                result.data;

        } else {

            staffCache =
                [];

        }


        renderStaff();


    } catch (error) {

        console.error(
            "LOAD STAFF ERROR",
            error
        );


        if (
            isSessionExpiredError(
                error
            )
        ) {

            handleSessionExpired();

            return;

        }


        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="error-row"
                >

                    ยังไม่สามารถโหลดข้อมูล Staff ได้

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


/* =====================================================
   RENDER STAFF
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
        staffCache.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
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

                    const adminId =
                        staff.admin_id ||
                        staff.adminId ||
                        "-";


                    const username =
                        staff.username ||
                        "-";


                    const name =
                        staff.name ||
                        staff.full_name ||
                        "-";


                    const role =
                        staff.role ||
                        "STAFF";


                    const status =
                        staff.status ||
                        "-";


                    return `

                        <tr>

                            <td>

                                ${escapeHtml(
                                    adminId
                                )}

                            </td>


                            <td>

                                <strong>

                                    ${escapeHtml(
                                        username
                                    )}

                                </strong>

                            </td>


                            <td>

                                ${escapeHtml(
                                    name
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

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =====================================================
   OPEN STAFF MODAL
===================================================== */

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


/* =====================================================
   CLOSE STAFF MODAL
===================================================== */

function closeStaffModalHandler() {

    const modal =
        document.getElementById(
            "staffModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    const form =
        document.getElementById(
            "staffForm"
        );


    if (form) {

        form.reset();

    }

}


/* =====================================================
   HANDLE STAFF SUBMIT
===================================================== */

async function handleStaffSubmit(
    event
) {

    event.preventDefault();


    if (
        isStaffSaving
    ) {

        return;

    }


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
        );


    const status =
        getInputValue(
            "staffStatus"
        );


    /*
     * Validation
     */

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


    isStaffSaving =
        true;


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
            isSessionExpired(
                result
            )
        ) {

            handleSessionExpired();

            return;

        }


        if (
            !result ||
            !result.success
        ) {

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


        closeStaffModalHandler();


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

        isStaffSaving =
            false;


        setButtonLoading(
            button,
            false,
            "บันทึก Staff"
        );

    }

}


/* =====================================================
   LOGOUT
===================================================== */

async function handleLogout() {

    if (
        isLoggingOut
    ) {

        return;

    }


    const confirmed =
        window.confirm(
            "ต้องการออกจากระบบ Admin หรือไม่?"
        );


    if (!confirmed) {

        return;

    }


    isLoggingOut =
        true;


    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    if (logoutBtn) {

        logoutBtn.disabled =
            true;

        logoutBtn.textContent =
            "กำลังออกจากระบบ...";

    }


    const token =
        getAdminToken();


    /*
     * แจ้ง Backend
     *
     * ถ้า Backend ไม่มี action adminLogout
     * ก็ยังล้าง Session ฝั่ง Browser ได้
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
     * ไปหน้า Login
     */

    window.location.replace(
        "admin-login.html"
    );

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
   INPUT GET
===================================================== */

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


/* =====================================================
   INPUT SET
===================================================== */

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
        value == null
            ? ""
            : value;

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
            !button.disabled
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

    }

}


/* =====================================================
   DATE DISPLAY
===================================================== */

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
            ).split("-");


        return (

            parts[2] +
            "/" +
            parts[1] +
            "/" +
            parts[0]

        );

    }


    /*
     * Google Date string
     *
     * Date(...)
     */

    const googleDate =
        text.match(
            /^Date\((\d+),(\d+),(\d+)\)$/
        );


    if (googleDate) {

        const year =
            Number(
                googleDate[1]
            );


        const month =
            Number(
                googleDate[2]
            ) + 1;


        const day =
            Number(
                googleDate[3]
            );


        return (

            String(day).padStart(
                2,
                "0"
            ) +

            "/" +

            String(month).padStart(
                2,
                "0"
            ) +

            "/" +

            year

        );

    }


    return text;

}


/* =====================================================
   DATE FOR INPUT
===================================================== */

function convertToInputDate(
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


    /*
     * Google Date
     */

    const googleDate =
        text.match(
            /^Date\((\d+),(\d+),(\d+)\)$/
        );


    if (googleDate) {

        const year =
            Number(
                googleDate[1]
            );


        const month =
            Number(
                googleDate[2]
            ) + 1;


        const day =
            Number(
                googleDate[3]
            );


        return (

            String(year) +

            "-" +

            String(month).padStart(
                2,
                "0"
            ) +

            "-" +

            String(day).padStart(
                2,
                "0"
            )

        );

    }


    /*
     * ISO DateTime
     */

    if (
        /^\d{4}-\d{2}-\d{2}T/.test(
            text
        )
    ) {

        return text.substring(
            0,
            10
        );

    }


    return "";

}


/* =====================================================
   STATUS CLASS
===================================================== */

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
        value ===
        "ACTIVE"
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


    if (
        value ===
        "นักศึกษาปกติ"
    ) {

        return "status-active";

    }


    return "status-default";

}


/* =====================================================
   HTML ESCAPE
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


/* =====================================================
   GLOBAL FUNCTIONS
===================================================== */

window.editStudent =
    editStudent;


window.resetStudentPassword =
    resetStudentPassword;


window.openStudentModal =
    openStudentModal;


window.openStaffModal =
    openStaffModal;


window.closeStudentModalHandler =
    closeStudentModalHandler;


window.closeStaffModalHandler =
    closeStaffModalHandler;


window.handleLogout =
    handleLogout;


/*******************************************************
 * END ADMIN DASHBOARD JS
 *******************************************************/
