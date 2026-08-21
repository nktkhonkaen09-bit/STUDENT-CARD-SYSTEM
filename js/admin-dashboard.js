/*******************************************************
 * ADMIN DASHBOARD
 * js/admin-dashboard.js
 *
 * Version: Stable Session
 *
 * ใช้ร่วมกับ:
 *   - js/config.js
 *   - admin-dashboard.html
 *   - css/admin-dashboard.css
 *******************************************************/


/* =====================================================
   GLOBAL
===================================================== */

let studentsCache = [];
let staffCache = [];
let editingStudentId = null;
let isCheckingSession = false;


/* =====================================================
   DOM READY
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    console.log("=================================");
    console.log("ADMIN DASHBOARD START");
    console.log("=================================");

    /*
     * ตรวจ CONFIG
     */
    if (typeof CONFIG === "undefined") {

        console.error("CONFIG NOT FOUND");

        showMessage(
            "ไม่พบ config.js",
            "error"
        );

        return;
    }


    /*
     * ตรวจ API
     */
    if (!CONFIG.API_URL) {

        console.error("API_URL NOT FOUND");

        showMessage(
            "ไม่พบ API_URL",
            "error"
        );

        return;
    }


    /*
     * ตรวจ Session
     */
    checkAdminSession();


    /*
     * Event
     */
    setupEvents();

});


/* =====================================================
   SETUP EVENTS
===================================================== */

function setupEvents() {

    /*
     * Logout
     */
    const logoutBtn =
        document.getElementById("logoutBtn");

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
        document.getElementById("studentSearch");

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
     * Add Student
     */
    const addStudentBtn =
        document.getElementById("addStudentBtn");

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
        document.getElementById("addStaffBtn");

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
   CHECK ADMIN SESSION
===================================================== */

async function checkAdminSession() {

    if (isCheckingSession) {
        return;
    }

    isCheckingSession = true;


    const token =
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        );


    console.log(
        "ADMIN SESSION TOKEN:",
        token ? "FOUND" : "NOT FOUND"
    );


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
     * แสดงข้อมูล Admin จาก Browser ก่อน
     */
    loadAdminDisplay();


    /*
     * สำคัญ:
     *
     * ไม่ใช้ adminGetStudents
     * เป็นตัวตรวจ Session โดยตรง
     *
     * ให้ลองโหลดข้อมูลจริง
     */
    try {

        await loadStudents();


        /*
         * ถ้าโหลดนักศึกษาได้
         * แสดงว่า Session ใช้งานได้
         */
        await loadStaff();


        showMessage(
            "เข้าสู่ระบบ Admin สำเร็จ",
            "success"
        );


    } catch (error) {

        console.error(
            "ADMIN SESSION CHECK ERROR",
            error
        );

    } finally {

        isCheckingSession = false;

    }

}


/* =====================================================
   LOAD ADMIN DISPLAY
===================================================== */

function loadAdminDisplay() {

    const raw =
        sessionStorage.getItem(
            CONFIG.ADMIN_KEY
        );


    if (!raw) {

        console.warn(
            "ADMIN DATA NOT FOUND"
        );

        return;

    }


    try {

        const admin =
            JSON.parse(raw);


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
                admin.username ||
                "Admin";

        }


        if (roleElement) {

            roleElement.textContent =
                admin.role ||
                "ADMIN";

        }


    } catch (error) {

        console.error(
            "ADMIN DATA PARSE ERROR",
            error
        );

    }

}


/* =====================================================
   API REQUEST
===================================================== */

async function apiRequest(data) {

    console.log(
        "API REQUEST:",
        data.action
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
        "API RESPONSE:",
        data.action,
        result
    );


    return result;

}


/* =====================================================
   SESSION EXPIRED
===================================================== */

function isSessionExpired(result) {

    if (!result) {
        return false;
    }


    /*
     * รองรับหลายรูปแบบ
     */

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
    ) {

        return true;

    }


    return false;

}


/* =====================================================
   HANDLE SESSION EXPIRED
===================================================== */

function handleSessionExpired() {

    console.warn(
        "ADMIN SESSION EXPIRED"
    );


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
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        );


    if (!token) {

        handleSessionExpired();

        return;

    }


    setStudentLoading(true);


    try {

        const result =
            await apiRequest({

                action:
                    "adminGetStudents",

                token:
                    token

            });


        /*
         * Session หมดอายุจริง
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
         * เก็บข้อมูล
         */
        studentsCache =
            Array.isArray(
                result.students
            )
                ? result.students
                : [];


        renderStudents();


        console.log(
            "STUDENTS:",
            studentsCache.length
        );


    } catch (error) {

        console.error(
            "LOAD STUDENTS ERROR",
            error
        );


        renderStudentsError();


        throw error;

    } finally {

        setStudentLoading(false);

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


/* =====================================================
   CREATE STUDENT ROW
===================================================== */

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


    const status =
        student.status ||
        "นักศึกษาปกติ";


    return `

        <tr>

            <td>

                <strong>
                    ${escapeHtml(id)}
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

                <div class="action-buttons">

                    <button
                        type="button"
                        class="small-btn edit-btn"
                        onclick="editStudent('${escapeJs(id)}')"
                    >
                        แก้ไข
                    </button>


                    <button
                        type="button"
                        class="small-btn reset-btn"
                        onclick="resetStudentPassword('${escapeJs(id)}')"
                    >
                        รีเซ็ตรหัสผ่าน
                    </button>

                </div>

            </td>

        </tr>

    `;

}


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


    if (loading) {

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


    resetStudentForm();


    editingStudentId = null;


    /*
     * ADD
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
     * EDIT
     */

    editingStudentId =
        student.student_id;


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


    const title =
        modal.querySelector(
            ".modal-header h2"
        );


    if (title) {

        title.textContent =
            "แก้ไขข้อมูลนักศึกษา";

    }


    const idInput =
        document.getElementById(
            "studentId"
        );


    if (idInput) {

        idInput.readOnly = true;

    }


    const passwordInput =
        document.getElementById(
            "studentPassword"
        );


    if (passwordInput) {

        passwordInput.required = false;

        passwordInput.value = "";

        passwordInput.placeholder =
            "เว้นว่างหากไม่ต้องการเปลี่ยนรหัสผ่าน";

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
                ).trim()
                ===
                String(
                    studentId
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


    openStudentModal(
        student
    );

}


/* =====================================================
   CLOSE STUDENT
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


    editingStudentId = null;


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

        idInput.readOnly = false;

    }


    const passwordInput =
        document.getElementById(
            "studentPassword"
        );


    if (passwordInput) {

        passwordInput.required = true;

        passwordInput.placeholder = "";

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
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        );


    if (!token) {

        handleSessionExpired();

        return;

    }


    const data = {

        token: token,

        student_id:
            getInputValue("studentId"),

        password:
            getInputValue("studentPassword"),

        prefix_th:
            getInputValue("studentPrefix"),

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
                "กรุณากรอกรหัสผ่าน",
                "error"
            );

            return;

        }


        await addStudent(data);

        return;

    }


    /*
     * UPDATE
     */

    await updateStudent(data);

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
            isSessionExpired(result)
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
                    data.token,

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
            isSessionExpired(result)
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
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        );


    if (!token) {

        handleSessionExpired();

        return;

    }


    const confirmed =
        confirm(
            "ต้องการรีเซ็ตรหัสผ่านนักศึกษา\n\n" +
            "รหัสนักศึกษา: " +
            studentId +
            "\n\n" +
            "รหัสผ่านใหม่จะเป็น 123456"
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
            isSessionExpired(result)
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
            "รีเซ็ตรหัสผ่านสำเร็จ",
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
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        );


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
            isSessionExpired(result)
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

                    return `

                        <tr>

                            <td>

                                ${escapeHtml(
                                    staff.admin_id || "-"
                                )}

                            </td>

                            <td>

                                <strong>

                                    ${escapeHtml(
                                        staff.username || "-"
                                    )}

                                </strong>

                            </td>

                            <td>

                                ${escapeHtml(
                                    staff.name || "-"
                                )}

                            </td>

                            <td>

                                <span
                                    class="role-badge"
                                >

                                    ${escapeHtml(
                                        staff.role || "STAFF"
                                    )}

                                </span>

                            </td>

                            <td>

                                <span
                                    class="status-badge ${getStatusClass(
                                        staff.status
                                    )}"
                                >

                                    ${escapeHtml(
                                        staff.status || "-"
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
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        );


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
            isSessionExpired(result)
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
        confirm(
            "ต้องการออกจากระบบ Admin หรือไม่?"
        );


    if (!confirmed) {
        return;
    }


    const token =
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        );


    /*
     * แจ้ง API
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
                "LOGOUT API ERROR",
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
     * Login
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

        setTimeout(
            function () {

                if (
                    box.textContent ===
                    text
                ) {

                    box.textContent = "";

                    box.className =
                        "message-box";

                }

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
        document.getElementById(id);


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
        document.getElementById(id);


    if (!element) {
        return;
    }


    element.value =
        value == null
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

        button.disabled = true;

        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
                button.textContent;

        }


        button.textContent =
            text ||
            "กำลังดำเนินการ...";

    } else {

        button.disabled = false;

        button.textContent =
            button.dataset.originalText ||
            text ||
            "บันทึก";

        delete button.dataset.originalText;

    }

}


/* =====================================================
   DATE
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
        String(value).trim();


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


/* =====================================================
   JS ESCAPE
===================================================== */

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
 * END
 *******************************************************/
