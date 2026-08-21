/*******************************************************
 * ADMIN DASHBOARD
 * js/admin-dashboard.js
 *
 * ใช้ร่วมกับ:
 *   config.js
 *   admin-dashboard.html
 *
 * รองรับ:
 *   - Admin Session
 *   - Dashboard
 *   - Students
 *   - Add Student
 *   - Edit Student
 *   - Direct Reset Student Password
 *   - Password Reset Requests
 *   - Approve Reset
 *   - Reject Reset
 *   - Reset Approved Request
 *   - Staff
 *   - Add Staff
 *   - Logout
 *******************************************************/


/* =====================================================
   GLOBAL
===================================================== */

let studentsCache = [];

let staffCache = [];

let resetRequestsCache = [];

let currentSection = "dashboard";


/* =====================================================
   SECTION CONFIG
===================================================== */

const SECTION_INFO = {

    dashboard: {
        title: "Dashboard",
        subtitle: "ภาพรวมระบบ"
    },

    students: {
        title: "ข้อมูลนักศึกษา",
        subtitle: "ค้นหา แก้ไข และจัดการข้อมูลนักศึกษา"
    },

    "add-student": {
        title: "เพิ่มนักศึกษา",
        subtitle: "สร้างหรือแก้ไขบัญชีนักศึกษา"
    },

    "reset-password": {
        title: "รีเซ็ตรหัสผ่าน",
        subtitle: "ตรวจสอบและดำเนินการคำร้องรีเซ็ตรหัสผ่าน"
    },

    staff: {
        title: "ข้อมูล Staff",
        subtitle: "จัดการบัญชีผู้ดูแลระบบและเจ้าหน้าที่"
    },

    "add-staff": {
        title: "เพิ่ม Staff",
        subtitle: "สร้างบัญชี Staff ใหม่เข้าสู่ระบบ"
    }

};


/* =====================================================
   READY
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "ADMIN DASHBOARD JS READY"
        );


        if (
            typeof CONFIG === "undefined"
        ) {

            console.error(
                "ไม่พบ CONFIG จาก config.js"
            );

            showMessage(
                "ไม่พบไฟล์ config.js",
                "error"
            );

            return;

        }


        if (
            !CONFIG.API_URL
        ) {

            showMessage(
                "ไม่พบ API_URL",
                "error"
            );

            return;

        }


        setupNavigation();

        setupEvents();

        loadAdminDisplay();

        checkAdminSession();

    }
);


/* =====================================================
   GET TOKEN
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
   SETUP NAVIGATION
===================================================== */

function setupNavigation() {

    const items =
        document.querySelectorAll(
            "[data-section]"
        );


    items.forEach(
        function (item) {

            item.addEventListener(
                "click",
                function () {

                    const section =
                        item.getAttribute(
                            "data-section"
                        );


                    if (!section) {

                        return;

                    }


                    showSection(
                        section
                    );

                }
            );

        }
    );


    const sidebarToggle =
        document.getElementById(
            "sidebarToggle"
        );


    if (sidebarToggle) {

        sidebarToggle.addEventListener(
            "click",
            toggleSidebar
        );

    }


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeSidebar
        );

    }

}


/* =====================================================
   SHOW SECTION
===================================================== */

function showSection(
    section
) {

    if (
        !SECTION_INFO[section]
    ) {

        section =
            "dashboard";

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
            "section-" + section
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
            function (item) {

                item.classList.toggle(
                    "active",
                    item.getAttribute(
                        "data-section"
                    ) === section
                );

            }
        );


    const info =
        SECTION_INFO[section];


    const pageTitle =
        document.getElementById(
            "pageTitle"
        );


    const pageSubtitle =
        document.getElementById(
            "pageSubtitle"
        );


    if (pageTitle) {

        pageTitle.textContent =
            info.title;

    }


    if (pageSubtitle) {

        pageSubtitle.textContent =
            info.subtitle;

    }


    closeSidebar();


    /*
     * โหลดข้อมูลเมื่อเข้า section
     */

    if (
        section === "students"
    ) {

        renderStudents(
            getInputValue(
                "studentSearch"
            )
        );

    }


    if (
        section === "reset-password"
    ) {

        renderResetRequests();

    }


    if (
        section === "staff"
    ) {

        renderStaff();

    }

}


/* =====================================================
   SIDEBAR
===================================================== */

function toggleSidebar() {

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


function closeSidebar() {

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
   SETUP EVENTS
===================================================== */

function setupEvents() {


    /* Logout */

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


    /* Student search */

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


    /* Add student */

    const addStudentBtn =
        document.getElementById(
            "addStudentBtn"
        );


    if (addStudentBtn) {

        addStudentBtn.addEventListener(
            "click",
            function () {

                resetStudentEditor();

                showSection(
                    "add-student"
                );

            }
        );

    }


    /* Refresh students */

    const refreshStudentsBtn =
        document.getElementById(
            "refreshStudentsBtn"
        );


    if (refreshStudentsBtn) {

        refreshStudentsBtn.addEventListener(
            "click",
            loadStudents
        );

    }


    /* Student form */

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


    /* Cancel student */

    const cancelStudentEditBtn =
        document.getElementById(
            "cancelStudentEditBtn"
        );


    if (cancelStudentEditBtn) {

        cancelStudentEditBtn.addEventListener(
            "click",
            function () {

                resetStudentEditor();

                showSection(
                    "students"
                );

            }
        );

    }


    /* Reset requests */

    const refreshResetRequestsBtn =
        document.getElementById(
            "refreshResetRequestsBtn"
        );


    if (refreshResetRequestsBtn) {

        refreshResetRequestsBtn.addEventListener(
            "click",
            loadResetRequests
        );

    }


    /* Staff */

    const refreshStaffBtn =
        document.getElementById(
            "refreshStaffBtn"
        );


    if (refreshStaffBtn) {

        refreshStaffBtn.addEventListener(
            "click",
            loadStaff
        );

    }


    const addStaffBtn =
        document.getElementById(
            "addStaffBtn"
        );


    if (addStaffBtn) {

        addStaffBtn.addEventListener(
            "click",
            function () {

                resetStaffForm();

                showSection(
                    "add-staff"
                );

            }
        );

    }


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


    const resetStaffFormBtn =
        document.getElementById(
            "resetStaffFormBtn"
        );


    if (resetStaffFormBtn) {

        resetStaffFormBtn.addEventListener(
            "click",
            function () {

                setTimeout(
                    resetStaffForm,
                    0
                );

            }
        );

    }

}


/* =====================================================
   CHECK SESSION
===================================================== */

async function checkAdminSession() {

    const token =
        getAdminToken();


    if (!token) {

        redirectToLogin();

        return;

    }


    loadAdminDisplay();


    /*
     * ใช้ adminGetStudents เป็น API ตรวจ Session
     * เพราะ backend ของคุณรองรับ action นี้อยู่แล้ว
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


            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "ไม่สามารถตรวจสอบ Session ได้"
            );

        }


        /*
         * ใช้ข้อมูลชุดแรกเลย
         * ไม่เรียก adminGetStudents ซ้ำ
         */

        studentsCache =
            Array.isArray(
                result.students
            )
                ? result.students
                : [];


        renderStudents();

        updateDashboardStats();


        /*
         * โหลดอีก 2 กลุ่ม
         */

        await Promise.all([
            loadStaff(),
            loadResetRequests()
        ]);


        updateDashboardStats();

    } catch (error) {

        console.error(
            "CHECK ADMIN SESSION ERROR",
            error
        );


        showMessage(
            error.message ||
            "ไม่สามารถเชื่อมต่อระบบได้",
            "error"
        );

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
            "ADMIN DATA ERROR",
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
        "ADMIN API:",
        data.action,
        result
    );


    return result;

}


/* =====================================================
   SESSION
===================================================== */

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
              class="loading-cell"
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


        renderStudents(
            getInputValue(
                "studentSearch"
            )
        );


        updateDashboardStats();


    } catch (error) {

        console.error(
            "LOAD STUDENTS ERROR",
            error
        );


        if (tbody) {

            tbody.innerHTML = `

              <tr>

                <td
                  colspan="9"
                  class="error-cell"
                >
                  ${escapeHtml(
                    error.message ||
                    "ไม่สามารถโหลดข้อมูลนักศึกษาได้"
                  )}
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
        list
            .map(
                createStudentRow
            )
            .join("");

}


/* =====================================================
   STUDENT ROW
===================================================== */

function createStudentRow(
    student
) {

    const id =
        String(
            student.student_id || ""
        );


    const fullname = [

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

        <td
          data-label="รหัสนักศึกษา"
          class="text-strong"
        >
          ${escapeHtml(id)}
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
              student.department || "-"
          )}
        </td>


        <td data-label="โทรศัพท์">
          ${escapeHtml(
              student.phone || "-"
          )}
        </td>


        <td data-label="สถานะ">

          <span
            class="status-badge ${getStatusClass(status)}"
          >
            ${escapeHtml(status)}
          </span>

        </td>


        <td data-label="วันออกบัตร">
          ${escapeHtml(
              formatDisplayDate(
                  student.issue_date
              )
          )}
        </td>


        <td data-label="วันหมดอายุ">
          ${escapeHtml(
              formatDisplayDate(
                  student.expire_date
              )
          )}
        </td>


        <td
          data-label="จัดการ"
          class="actions-cell"
        >

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
              data-action="reset-student-password"
              data-id="${escapeHtml(id)}"
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
            button.getAttribute(
                "data-action"
            );


        const studentId =
            button.getAttribute(
                "data-id"
            );


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
            "reset-student-password"
        ) {

            resetStudentPassword(
                studentId
            );

        }


        if (
            action ===
            "approve-reset"
        ) {

            approveResetRequest(
                button.getAttribute(
                    "data-request-id"
                )
            );

        }


        if (
            action ===
            "reject-reset"
        ) {

            rejectResetRequest(
                button.getAttribute(
                    "data-request-id"
                )
            );

        }


        if (
            action ===
            "execute-reset"
        ) {

            executeApprovedReset(
                button.getAttribute(
                    "data-request-id"
                )
            );

        }

    }
);


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


    setInputValue(
        "editingStudentId",
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


    const idInput =
        document.getElementById(
            "studentId"
        );


    if (idInput) {

        idInput.readOnly =
            true;

    }


    const passwordInput =
        document.getElementById(
            "studentPassword"
        );


    if (passwordInput) {

        passwordInput.required =
            false;

        passwordInput.placeholder =
            "เว้นว่างหากไม่ต้องการเปลี่ยน";

    }


    const title =
        document.getElementById(
            "studentFormTitle"
        );


    const subtitle =
        document.getElementById(
            "studentFormSubtitle"
        );


    const button =
        document.getElementById(
            "saveStudentBtn"
        );


    if (title) {

        title.textContent =
            "แก้ไขข้อมูลนักศึกษา";

    }


    if (subtitle) {

        subtitle.textContent =
            "แก้ไขข้อมูลนักศึกษาโดยไม่เปลี่ยนรหัสผ่าน";

    }


    if (button) {

        button.textContent =
            "บันทึกการแก้ไข";

    }


    showSection(
        "add-student"
    );

}


/* =====================================================
   RESET STUDENT EDITOR
===================================================== */

function resetStudentEditor() {

    const form =
        document.getElementById(
            "studentForm"
        );


    if (form) {

        form.reset();

    }


    setInputValue(
        "editingStudentId",
        ""
    );


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


    const title =
        document.getElementById(
            "studentFormTitle"
        );


    const subtitle =
        document.getElementById(
            "studentFormSubtitle"
        );


    const button =
        document.getElementById(
            "saveStudentBtn"
        );


    if (title) {

        title.textContent =
            "เพิ่มนักศึกษา";

    }


    if (subtitle) {

        subtitle.textContent =
            "สร้างบัญชีนักศึกษาใหม่เข้าสู่ระบบ";

    }


    if (button) {

        button.textContent =
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


    const editingId =
        getInputValue(
            "editingStudentId"
        );


    const studentId =
        getInputValue(
            "studentId"
        );


    const password =
        getInputValue(
            "studentPassword"
        );


    const data = {

        token:
            token,

        student_id:
            editingId ||
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


    if (!studentId) {

        showMessage(
            "กรุณากรอกรหัสนักศึกษา",
            "error"
        );

        return;

    }


    if (
        !getInputValue(
            "studentFirstnameTh"
        )
    ) {

        showMessage(
            "กรุณากรอกชื่อ",
            "error"
        );

        return;

    }


    if (
        !getInputValue(
            "studentLastnameTh"
        )
    ) {

        showMessage(
            "กรุณากรอกนามสกุล",
            "error"
        );

        return;

    }


    if (!editingId) {

        if (!password) {

            showMessage(
                "กรุณากรอกรหัสผ่านเริ่มต้น",
                "error"
            );

            return;

        }


        data.password =
            password;


        await addStudent(
            data
        );

    } else {

        /*
         * ถ้าผู้ใช้กรอกรหัสผ่าน
         * จะส่งไปเปลี่ยนด้วย
         */

        if (password) {

            data.password =
                password;

        }


        await updateStudent(
            data
        );

    }

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

                ...data

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


        resetStudentEditor();

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

                ...data

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


        resetStudentEditor();

        await loadStudents();

        showSection(
            "students"
        );


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
   DIRECT RESET STUDENT PASSWORD
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
                ).trim()
                ===
                String(
                    studentId
                ).trim();

            }
        );


    const fullname =
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
                fullname
                    ? "\nชื่อ: " +
                      fullname
                    : ""
            ) +

            "\n\nรหัสผ่านใหม่จะเป็น: 123456"

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
            "RESET STUDENT PASSWORD ERROR",
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
   LOAD RESET REQUESTS
===================================================== */

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

        tbody.innerHTML = `

          <tr>

            <td
              colspan="6"
              class="loading-cell"
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
            "LOAD RESET REQUESTS ERROR",
            error
        );


        if (tbody) {

            tbody.innerHTML = `

              <tr>

                <td
                  colspan="6"
                  class="error-cell"
                >
                  ${escapeHtml(
                    error.message ||
                    "โหลดคำร้องไม่สำเร็จ"
                  )}
                </td>

              </tr>

            `;

        }


        showMessage(
            error.message ||
            "ไม่สามารถโหลดคำร้องรีเซ็ตรหัสผ่านได้",
            "error"
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
        resetRequestsCache.length === 0
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


/* =====================================================
   RESET REQUEST ROW
===================================================== */

function createResetRequestRow(
    request
) {

    const requestId =
        String(
            request.request_id || ""
        );


    const studentId =
        String(
            request.student_id || "-"
        );


    const reason =
        request.reason ||
        request.note ||
        "-";


    const status =
        String(
            request.status || "-"
        )
        .trim()
        .toUpperCase();


    let actions = "";


    if (
        status === "PENDING"
    ) {

        actions = `

          <div class="action-buttons">

            <button
              type="button"
              class="small-btn approve-btn"
              data-action="approve-reset"
              data-request-id="${escapeHtml(requestId)}"
            >
              อนุมัติ
            </button>

            <button
              type="button"
              class="small-btn reject-btn"
              data-action="reject-reset"
              data-request-id="${escapeHtml(requestId)}"
            >
              ปฏิเสธ
            </button>

          </div>

        `;

    } else if (
        status === "APPROVED"
    ) {

        actions = `

          <button
            type="button"
            class="small-btn reset-btn"
            data-action="execute-reset"
            data-request-id="${escapeHtml(requestId)}"
          >
            รีเซ็ตรหัสผ่าน
          </button>

        `;

    } else if (
        status === "RESET"
    ) {

        actions = `

          <span class="completed-text">
            ดำเนินการแล้ว
          </span>

        `;

    } else {

        actions = `

          <span class="muted-text">
            ${escapeHtml(status)}
          </span>

        `;

    }


    return `

      <tr>

        <td
          data-label="Request ID"
          class="request-id"
        >
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
            class="status-badge ${getResetStatusClass(status)}"
          >
            ${escapeHtml(status)}
          </span>

        </td>


        <td data-label="วันที่ร้องขอ">
          ${escapeHtml(
              request.requested_at || "-"
          )}
        </td>


        <td
          data-label="ดำเนินการ"
          class="actions-cell"
        >
          ${actions}
        </td>

      </tr>

    `;

}


/* =====================================================
   APPROVE RESET
===================================================== */

async function approveResetRequest(
    requestId
) {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const confirmed =
        confirm(
            "ต้องการอนุมัติคำร้องนี้หรือไม่?\n\n" +
            requestId
        );


    if (!confirmed) {

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
                    requestId,

                note:
                    "อนุมัติคำร้อง"

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
                    : "อนุมัติคำร้องไม่สำเร็จ"
            );

        }


        showMessage(
            "อนุมัติคำร้องสำเร็จ",
            "success"
        );


        await loadResetRequests();

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

    }

}


/* =====================================================
   REJECT RESET
===================================================== */

async function rejectResetRequest(
    requestId
) {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const note =
        prompt(
            "กรุณาระบุเหตุผลในการปฏิเสธ",
            "ไม่อนุมัติคำร้อง"
        );


    if (
        note === null
    ) {

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
                    note.trim()

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
                    : "ปฏิเสธคำร้องไม่สำเร็จ"
            );

        }


        showMessage(
            "ปฏิเสธคำร้องสำเร็จ",
            "success"
        );


        await loadResetRequests();

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

    }

}


/* =====================================================
   EXECUTE APPROVED RESET
===================================================== */

async function executeApprovedReset(
    requestId
) {

    const token =
        getAdminToken();


    if (!token) {

        handleSessionExpired();

        return;

    }


    const newPassword =
        prompt(
            "กรุณากำหนดรหัสผ่านใหม่\n\n" +
            "หากกด Cancel จะยกเลิก\n" +
            "หากเว้นว่าง ระบบจะใช้ 123456",
            "123456"
        );


    if (
        newPassword === null
    ) {

        return;

    }


    const password =
        newPassword.trim()
        ||
        "123456";


    if (
        password.length < 4
    ) {

        showMessage(
            "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร",
            "error"
        );

        return;

    }


    const confirmed =
        confirm(
            "ยืนยันการรีเซ็ตรหัสผ่าน?\n\n" +
            "Request ID: " +
            requestId +
            "\n" +
            "รหัสผ่านใหม่: " +
            password
        );


    if (!confirmed) {

        return;

    }


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
                    password,

                note:
                    "รีเซ็ตรหัสผ่านสำเร็จ"

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
            "รีเซ็ตรหัสผ่านสำเร็จ รหัสผ่านใหม่คือ " +
            (
                result.password ||
                password
            ),
            "success"
        );


        await loadResetRequests();

    } catch (error) {

        console.error(
            "EXECUTE RESET ERROR",
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

        tbody.innerHTML = `

          <tr>

            <td
              colspan="5"
              class="loading-cell"
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

        updateDashboardStats();


    } catch (error) {

        console.error(
            "LOAD STAFF ERROR",
            error
        );


        if (tbody) {

            tbody.innerHTML = `

              <tr>

                <td
                  colspan="5"
                  class="error-cell"
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
                function (staff) {

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
                              staff.admin_id ||
                              "-"
                          )}
                        </td>


                        <td class="text-strong">
                          ${escapeHtml(
                              staff.username ||
                              "-"
                          )}
                        </td>


                        <td>
                          ${escapeHtml(
                              staff.name ||
                              "-"
                          )}
                        </td>


                        <td>

                          <span class="role-badge">
                            ${escapeHtml(role)}
                          </span>

                        </td>


                        <td>

                          <span
                            class="status-badge ${getStatusClass(status)}"
                          >
                            ${escapeHtml(status)}
                          </span>

                        </td>

                      </tr>

                    `;

                }
            )
            .join("");

}


/* =====================================================
   STAFF FORM
===================================================== */

function resetStaffForm() {

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

}


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


        resetStaffForm();

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

        setButtonLoading(
            button,
            false,
            "บันทึก Staff"
        );

    }

}


/* =====================================================
   DASHBOARD STATS
===================================================== */

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
                    ||
                    status ===
                    "นักศึกษาปกติ".toUpperCase()
                );

            }
        ).length;


    const totalStaff =
        staffCache.length;


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
        "pendingResets",
        pendingResets
    );

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
        getAdminToken();


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
   HELPERS
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


    if (element) {

        element.textContent =
            String(
                value
            );

    }

}


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
        value ===
        "นักศึกษาปกติ".toUpperCase()
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


function getResetStatusClass(
    status
) {

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
        value === "APPROVED"
    ) {

        return "status-approved";

    }


    if (
        value === "RESET"
    ) {

        return "status-reset";

    }


    if (
        value === "REJECTED"
    ) {

        return "status-rejected";

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
   END
===================================================== */
