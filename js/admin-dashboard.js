/*******************************************************
 * ADMIN DASHBOARD
 * js/admin-dashboard.js
 *
 * ระบบ:
 * 1. ตรวจสอบ Admin Session
 * 2. แสดงข้อมูล Admin
 * 3. โหลดนักศึกษา
 * 4. ค้นหานักศึกษา
 * 5. เพิ่มนักศึกษา
 * 6. แก้ไขนักศึกษา
 * 7. รีเซ็ตรหัสผ่านนักศึกษา
 * 8. โหลด Staff
 * 9. เพิ่ม Staff
 * 10. Logout
 *******************************************************/


/* =====================================================
   GLOBAL
===================================================== */

let studentsCache = [];

let staffCache = [];

let editingStudentId = null;

let isDashboardLoading = false;


/* =====================================================
   DOM READY
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "ADMIN DASHBOARD READY"
        );


        /*
         * ตรวจ CONFIG
         */

        if (
            typeof CONFIG === "undefined"
        ) {

            console.error(
                "CONFIG ไม่ถูกโหลด"
            );

            showMessage(
                "ไม่พบ config.js",
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
                "ไม่พบ CONFIG.API_URL"
            );

            showMessage(
                "ไม่พบ API URL",
                "error"
            );

            return;

        }


        /*
         * ผูก Event
         */

        setupEvents();


        /*
         * เริ่มระบบ
         */

        initializeDashboard();

    }
);


/* =====================================================
   INITIALIZE DASHBOARD
===================================================== */

async function initializeDashboard() {

    if (isDashboardLoading) {

        return;

    }


    isDashboardLoading = true;


    try {

        /*
         * ตรวจ Session ก่อน
         */

        const token =
            getAdminToken();


        if (!token) {

            redirectToLogin();

            return;

        }


        /*
         * แสดง Admin จาก SessionStorage
         */

        loadAdminDisplay();


        /*
         * ตรวจ Session กับ Server
         */

        const valid =
            await verifyAdminSession();


        if (!valid) {

            return;

        }


        /*
         * โหลดข้อมูล
         */

        await loadStudents();

        await loadStaff();


    } catch (error) {

        console.error(
            "INITIALIZE DASHBOARD ERROR",
            error
        );


        showMessage(
            "ไม่สามารถโหลดข้อมูล Dashboard ได้",
            "error"
        );


    } finally {

        isDashboardLoading = false;

    }

}


/* =====================================================
   SETUP EVENTS
===================================================== */

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
     * Search
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
                    this.value
                );

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
     * Close Student
     */

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
     * Add Staff
     */

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


    /*
     * Close Staff
     */

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
     * Click outside modal
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

                    closeStudentModalHandler();

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

                    closeStaffModalHandler();

                }

            }
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


    return (
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        ) || ""
    );

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


    const raw =
        sessionStorage.getItem(
            CONFIG.ADMIN_KEY
        );


    if (!raw) {

        return null;

    }


    try {

        return JSON.parse(raw);

    } catch (error) {

        console.error(
            "ADMIN DATA PARSE ERROR",
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


    if (!admin) {

        return;

    }


    const nameElement =
        document.getElementById(
            "adminName"
        );


    const roleElement =
        document.getElementById(
            "adminRole"
        );


    if (nameElement) {

        nameElement.textContent =
            admin.name ||
            admin.fullname ||
            admin.username ||
            "Admin";

    }


    if (roleElement) {

        roleElement.textContent =
            admin.role ||
            "ADMIN";

    }

}


/* =====================================================
   VERIFY ADMIN SESSION
===================================================== */

async function verifyAdminSession() {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return false;

    }


    try {

        /*
         * ใช้ API ที่มีอยู่แล้ว
         * เป็นการตรวจว่า Token ยังใช้งานได้
         */

        const result =
            await apiRequest({

                action:
                    "adminGetStudents",

                token:
                    token

            });


        if (
            result &&
            result.success
        ) {

            /*
             * ยังไม่ต้องเก็บข้อมูลตรงนี้
             * loadStudents() จะโหลดจริงอีกครั้ง
             */

            return true;

        }


        /*
         * Session หมดอายุ
         */

        if (
            isSessionExpired(
                result
            )
        ) {

            handleSessionExpired();

            return false;

        }


        /*
         * กรณี Backend ส่ง unauthorized
         */

        if (
            isUnauthorizedResult(
                result
            )
        ) {

            handleSessionExpired();

            return false;

        }


        /*
         * ถ้า API ตอบ error แบบอื่น
         * ให้แจ้ง แต่ยังไม่ล้าง Session
         */

        console.warn(
            "VERIFY SESSION RESULT",
            result
        );


        return true;


    } catch (error) {

        console.error(
            "VERIFY SESSION ERROR",
            error
        );


        showMessage(
            "ไม่สามารถตรวจสอบ Session ได้",
            "error"
        );


        return false;

    }

}


/* =====================================================
   API REQUEST
===================================================== */

async function apiRequest(
    data
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


    if (!text) {

        throw new Error(
            "API ไม่ส่งข้อมูลกลับมา"
        );

    }


    let result;


    try {

        result =
            JSON.parse(text);

    } catch (error) {

        console.error(
            "API JSON ERROR",
            text
        );

        throw new Error(
            "API ส่งข้อมูลไม่ใช่ JSON"
        );

    }


    console.log(
        "API:",
        data.action,
        result
    );


    return result;

}


/* =====================================================
   SESSION CHECK
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


    return (

        code ===
        "ADMIN_SESSION_EXPIRED"

        ||

        code ===
        "SESSION_EXPIRED"

        ||

        code ===
        "UNAUTHORIZED"

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


/* =====================================================
   UNAUTHORIZED
===================================================== */

function isUnauthorizedResult(
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


    return (

        code ===
        "UNAUTHORIZED"

        ||

        code ===
        "INVALID_TOKEN"

        ||

        code ===
        "INVALID_ADMIN_TOKEN"

    );

}


/* =====================================================
   HANDLE SESSION EXPIRED
===================================================== */

function handleSessionExpired() {

    /*
     * ป้องกัน alert ซ้ำ
     */

    if (
        window.__ADMIN_SESSION_REDIRECTING
    ) {

        return;

    }


    window.__ADMIN_SESSION_REDIRECTING =
        true;


    /*
     * ล้าง Session
     */

    if (
        typeof CONFIG !== "undefined"
    ) {

        sessionStorage.removeItem(
            CONFIG.ADMIN_SESSION_KEY
        );

        sessionStorage.removeItem(
            CONFIG.ADMIN_KEY
        );

    }


    alert(
        "Session ของ Admin หมดอายุ กรุณาเข้าสู่ระบบใหม่"
    );


    redirectToLogin();

}


/* =====================================================
   REDIRECT LOGIN
===================================================== */

function redirectToLogin() {

    window.location.replace(
        "admin-login.html"
    );

}


/* =====================================================
   LOAD STUDENTS
===================================================== */

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


    } catch (error) {

        console.error(
            "LOAD STUDENTS ERROR",
            error
        );


        if (
            tbody
        ) {

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


        showMessage(
            error.message ||
            "ไม่สามารถโหลดข้อมูลนักศึกษาได้",
            "error"
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


    if (search) {

        list =
            list.filter(
                function (student) {

                    const searchableText = [

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
                        Boolean
                    )
                    .join(" ")
                    .toLowerCase();


                    return searchableText.includes(
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

                    ${
                        search
                            ? "ไม่พบข้อมูลที่ค้นหา"
                            : "ยังไม่มีข้อมูลนักศึกษา"
                    }

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


/* =====================================================
   CREATE STUDENT ROW
===================================================== */

function createStudentRow(
    student
) {

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


    /*
     * ใช้ data attribute
     * แทนการฝังข้อมูลลง HTML โดยตรง
     */

    const safeId =
        escapeHtml(
            studentId
        );


    return `

        <tr>

            <td data-label="รหัสนักศึกษา">

                <strong>
                    ${safeId}
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
   STUDENT TABLE ACTION
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
            action ===
            "edit"
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


    resetStudentForm();


    editingStudentId =
        null;


    const title =
        modal.querySelector(
            ".modal-header h2"
        );


    /*
     * ADD
     */

    if (!student) {

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
     * EDIT
     */

    editingStudentId =
        String(
            student.student_id
        );


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


    if (title) {

        title.textContent =
            "แก้ไขข้อมูลนักศึกษา";

    }


    /*
     * Student ID ห้ามแก้
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
     * Password ไม่ใช้ตอนแก้ไข
     */

    const passwordInput =
        document.getElementById(
            "studentPassword"
        );


    if (passwordInput) {

        passwordInput.required =
            false;

        passwordInput.placeholder =
            "เว้นว่าง หากไม่ต้องการเปลี่ยนรหัสผ่าน";

    }


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

    const student =
        studentsCache.find(
            function (item) {

                return String(
                    item.student_id
                )
                .trim()
                ===
                String(
                    studentId
                )
                .trim();

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
   STUDENT SUBMIT
===================================================== */

async function handleStudentSubmit(
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

        student_id:
            getInputValue(
                "studentId"
            ),

        password:
            getInputValue(
                "studentPassword"
            ),

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
     * Validation
     */

    if (!data.student_id) {

        showMessage(
            "กรุณากรอกรหัสนักศึกษา",
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


    /*
     * ADD
     */

    if (!editingStudentId) {

        if (!data.password) {

            showMessage(
                "กรุณากรอกรหัสผ่านเริ่มต้น",
                "error"
            );

            return;

        }


        await addStudent(
            data
        );


        return;

    }


    /*
     * EDIT
     */

    await updateStudent(
        data
    );

}


/* =====================================================
   ADD STUDENT
===================================================== */

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
        "กำลังบันทึก..."
    );


    try {

        const result =
            await apiRequest({

                action:
                    "adminAddStudent",

                token:
                    getAdminToken(),

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
                    getAdminToken(),

                student_id:
                    editingStudentId,

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
            "UPDATE STUDENT ERROR",
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


    const student =
        studentsCache.find(
            function (item) {

                return String(
                    item.student_id
                )
                .trim()
                ===
                String(
                    studentId
                )
                .trim();

            }
        );


    let name = "";


    if (student) {

        name =
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
                name
                    ? "\nชื่อ: " + name
                    : ""
            ) +

            "\n\n" +

            "รหัสผ่านใหม่: 123456"

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
                result?.message ||
                "รีเซ็ตรหัสผ่านไม่สำเร็จ"
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
                result?.message ||
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


    } catch (error) {

        console.error(
            "LOAD STAFF ERROR",
            error
        );


        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="error-row"
                >

                    ไม่สามารถโหลดข้อมูล Staff ได้

                </td>

            </tr>

        `;


        showMessage(
            error.message ||
            "ไม่สามารถโหลด Staff ได้",
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

                    ยังไม่มีข้อมูล Staff

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        staffCache
            .map(
                function (staff) {

                    const role =
                        staff.role ||
                        "STAFF";


                    const status =
                        staff.status ||
                        "ACTIVE";


                    return `

                        <tr>

                            <td>

                                ${escapeHtml(
                                    staff.admin_id ||
                                    "-"
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

}


/* =====================================================
   STAFF SUBMIT
===================================================== */

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
        );


    const status =
        getInputValue(
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
                result?.message ||
                "เพิ่ม Staff ไม่สำเร็จ"
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
     * แจ้ง Backend
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
                "ADMIN LOGOUT ERROR",
                error
            );

        }

    }


    /*
     * ล้าง Session
     */

    sessionStorage.removeItem(
        CONFIG.ADMIN_SESSION_KEY
    );


    sessionStorage.removeItem(
        CONFIG.ADMIN_KEY
    );


    /*
     * กลับหน้า Login
     */

    redirectToLogin();

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

        window.clearTimeout(
            showMessage.timer
        );


        showMessage.timer =
            window.setTimeout(
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


/* =====================================================
   INPUT
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


/* =====================================================
   BUTTON
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
                button.textContent.trim();

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
     * yyyy-MM-dd
     */

    if (
        /^\d{4}-\d{2}-\d{2}/.test(
            text
        )
    ) {

        const date =
            text.substring(
                0,
                10
            );


        const parts =
            date.split("-");


        return (

            parts[2] +
            "/" +
            parts[1] +
            "/" +
            parts[0]

        );

    }


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


    return text;

}


/* =====================================================
   DATE INPUT
===================================================== */

function convertToInputDate(
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


    /*
     * ISO Date
     */

    if (
        text.includes("T")
    ) {

        const iso =
            text.substring(
                0,
                10
            );


        if (
            /^\d{4}-\d{2}-\d{2}$/.test(
                iso
            )
        ) {

            return iso;

        }

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


/*******************************************************
 * END ADMIN DASHBOARD
 *******************************************************/
