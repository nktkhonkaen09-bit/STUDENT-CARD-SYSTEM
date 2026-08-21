/*******************************************************
 * ADMIN DASHBOARD
 *
 * รองรับ
 *
 * - Admin Session
 * - Logout
 * - Student list
 * - Search student
 * - Add student
 * - Edit student
 * - Reset student password
 * - Password reset requests
 * - Approve request
 * - Reject request
 * - Reset password from request
 * - Staff list
 * - Add staff
 *******************************************************/


/*******************************************************
 * CONFIG
 *******************************************************/

const ADMIN_CONFIG = {

  /*
   * ถ้า js/config.js ของคุณมี API_URL
   * ระบบจะใช้ค่าจาก CONFIG.API_URL ก่อน
   */

  API_URL:
    (
      typeof CONFIG !== "undefined" &&
      CONFIG.API_URL
    )
      ? CONFIG.API_URL
      : "",


  SESSION_KEY:
    (
      typeof CONFIG !== "undefined" &&
      CONFIG.ADMIN_SESSION_KEY
    )
      ? CONFIG.ADMIN_SESSION_KEY
      : "admin_session",


  ADMIN_KEY:
    (
      typeof CONFIG !== "undefined" &&
      CONFIG.ADMIN_KEY
    )
      ? CONFIG.ADMIN_KEY
      : "admin_data"

};


/*******************************************************
 * STATE
 *******************************************************/

let students = [];

let resetRequests = [];

let staffList = [];

let editingStudentId = "";

let resettingStudentId = "";

let selectedResetRequest = null;


/*******************************************************
 * DOM READY
 *******************************************************/

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initAdminDashboard();

  }
);


/*******************************************************
 * INIT
 *******************************************************/

async function initAdminDashboard() {

  /*
   * ตรวจ API
   */

  if (!ADMIN_CONFIG.API_URL) {

    showMessage(
      "ไม่พบ API_URL กรุณาตรวจสอบ js/config.js",
      "error"
    );

    return;

  }


  /*
   * ตรวจ Session
   */

  const token =
    getAdminToken();


  if (!token) {

    redirectToLogin();

    return;

  }


  /*
   * แสดงข้อมูล Admin
   */

  loadAdminInfo();


  /*
   * Event
   */

  bindEvents();


  /*
   * โหลดข้อมูล
   */

  await Promise.allSettled([

    loadStudents(),

    loadResetRequests(),

    loadStaff()

  ]);

}


/*******************************************************
 * GET TOKEN
 *******************************************************/

function getAdminToken() {

  return String(

    sessionStorage.getItem(
      ADMIN_CONFIG.SESSION_KEY
    ) || ""

  ).trim();

}


/*******************************************************
 * GET ADMIN DATA
 *******************************************************/

function getAdminData() {

  try {

    const raw =
      sessionStorage.getItem(
        ADMIN_CONFIG.ADMIN_KEY
      );


    if (!raw) {

      return {};

    }


    return JSON.parse(raw) || {};

  } catch (error) {

    console.error(
      "ADMIN DATA ERROR",
      error
    );


    return {};

  }

}


/*******************************************************
 * LOAD ADMIN INFO
 *******************************************************/

function loadAdminInfo() {

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

}


/*******************************************************
 * BIND EVENTS
 *******************************************************/

function bindEvents() {


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
   * Student search
   */

  const studentSearch =
    document.getElementById(
      "studentSearch"
    );


  if (studentSearch) {

    studentSearch.addEventListener(
      "input",
      renderStudents
    );

  }


  /*
   * Refresh students
   */

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


  /*
   * Add student
   */

  const addStudentBtn =
    document.getElementById(
      "addStudentBtn"
    );


  if (addStudentBtn) {

    addStudentBtn.addEventListener(
      "click",
      openAddStudentModal
    );

  }


  /*
   * Student form
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
   * Close student modal
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
   * Reset password
   */

  bindClick(
    "closeResetPasswordModal",
    closeResetPasswordModal
  );


  bindClick(
    "closeResetPasswordModal2",
    closeResetPasswordModal
  );


  const resetPasswordForm =
    document.getElementById(
      "resetPasswordForm"
    );


  if (resetPasswordForm) {

    resetPasswordForm.addEventListener(
      "submit",
      handleDirectResetPassword
    );

  }


  /*
   * Reset requests
   */

  bindClick(
    "refreshResetBtn",
    loadResetRequests
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
    "approveRequestBtn",
    handleApproveRequest
  );


  bindClick(
    "rejectRequestBtn",
    handleRejectRequest
  );


  /*
   * Request password
   */

  bindClick(
    "closeRequestPasswordModal",
    closeRequestPasswordModal
  );


  bindClick(
    "closeRequestPasswordModal2",
    closeRequestPasswordModal
  );


  const requestPasswordForm =
    document.getElementById(
      "requestPasswordForm"
    );


  if (requestPasswordForm) {

    requestPasswordForm.addEventListener(
      "submit",
      handleRequestPasswordSubmit
    );

  }


  /*
   * Staff
   */

  bindClick(
    "refreshStaffBtn",
    loadStaff
  );


  bindClick(
    "addStaffBtn",
    openAddStaffModal
  );


  bindClick(
    "closeStaffModal",
    closeStaffModal
  );


  bindClick(
    "closeStaffModal2",
    closeStaffModal
  );


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
   * Close modal when clicking background
   */

  document
    .querySelectorAll(".modal")
    .forEach(
      function (modal) {

        modal.addEventListener(
          "click",
          function (event) {

            if (
              event.target === modal
            ) {

              modal.classList.remove(
                "show"
              );

            }

          }
        );

      }
    );

}


/*******************************************************
 * BIND CLICK
 *******************************************************/

function bindClick(
  id,
  handler
) {

  const element =
    document.getElementById(id);


  if (element) {

    element.addEventListener(
      "click",
      handler
    );

  }

}


/*******************************************************
 * API REQUEST
 *******************************************************/

async function apiRequest(
  action,
  payload
) {

  const token =
    getAdminToken();


  const body =
    Object.assign(
      {},
      payload || {},
      {
        action: action,
        token: token
      }
    );


  const response =
    await fetch(
      ADMIN_CONFIG.API_URL,
      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "text/plain;charset=utf-8"

        },

        body:
          JSON.stringify(body)

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


  if (
    result &&
    (
      result.code ===
        "ADMIN_SESSION_EXPIRED" ||

      result.code ===
        "ADMIN_SESSION_INVALID"
    )
  ) {

    sessionStorage.removeItem(
      ADMIN_CONFIG.SESSION_KEY
    );

    sessionStorage.removeItem(
      ADMIN_CONFIG.ADMIN_KEY
    );


    redirectToLogin();


    throw new Error(
      "ADMIN_SESSION_EXPIRED"
    );

  }


  return result;

}


/*******************************************************
 * REDIRECT LOGIN
 *******************************************************/

function redirectToLogin() {

  window.location.replace(
    "admin-login.html"
  );

}


/*******************************************************
 * LOGOUT
 *******************************************************/

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


  try {

    if (token) {

      await apiRequest(
        "adminLogout",
        {}
      );

    }

  } catch (error) {

    console.warn(
      "LOGOUT API ERROR",
      error
    );

  }


  sessionStorage.removeItem(
    ADMIN_CONFIG.SESSION_KEY
  );


  sessionStorage.removeItem(
    ADMIN_CONFIG.ADMIN_KEY
  );


  redirectToLogin();

}


/*******************************************************
 * LOAD STUDENTS
 *******************************************************/

async function loadStudents() {

  const tbody =
    document.getElementById(
      "studentsTableBody"
    );


  if (tbody) {

    tbody.innerHTML = `

      <tr>
        <td
          colspan="9"
          class="empty-row"
        >
          กำลังโหลดข้อมูลนักศึกษา...
        </td>
      </tr>

    `;

  }


  try {

    const result =
      await apiRequest(
        "adminGetStudents",
        {}
      );


    if (
      !result ||
      !result.success
    ) {

      throw new Error(
        result &&
        result.message
          ? result.message
          : "ไม่สามารถโหลดข้อมูลนักศึกษาได้"
      );

    }


    students =
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
      error.message ===
      "ADMIN_SESSION_EXPIRED"
    ) {

      return;

    }


    if (tbody) {

      tbody.innerHTML = `

        <tr>
          <td
            colspan="9"
            class="empty-row"
          >
            ไม่สามารถโหลดข้อมูลนักศึกษาได้
            <br>
            ${escapeHtml(error.message)}
          </td>
        </tr>

      `;

    }

  }

}


/*******************************************************
 * RENDER STUDENTS
 *******************************************************/

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


  const search =
    searchInput
      ? searchInput.value
          .trim()
          .toLowerCase()
      : "";


  const filtered =
    students.filter(
      function(student) {

        if (!search) {

          return true;

        }


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


  if (!filtered.length) {

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
    filtered
      .map(
        function(student) {

          return `

            <tr>

              <td class="student-id-cell">
                ${escapeHtml(
                  student.student_id
                )}
              </td>

              <td>
                ${escapeHtml(
                  [
                    student.prefix_th,
                    student.firstname_th,
                    student.lastname_th
                  ]
                  .filter(Boolean)
                  .join(" ")
                )}
              </td>

              <td>
                ${escapeHtml(
                  [
                    student.firstname_en,
                    student.lastname_en
                  ]
                  .filter(Boolean)
                  .join(" ")
                )}
              </td>

              <td>
                ${escapeHtml(
                  student.department
                )}
              </td>

              <td>
                ${escapeHtml(
                  student.phone
                )}
              </td>

              <td>
                ${renderStatus(
                  student.status
                )}
              </td>

              <td>
                ${escapeHtml(
                  student.issue_date
                )}
              </td>

              <td>
                ${escapeHtml(
                  student.expire_date
                )}
              </td>

              <td class="action-column">

                <div class="action-buttons">

                  <button
                    type="button"
                    class="small-primary-btn"
                    data-action="edit-student"
                    data-id="${escapeAttribute(
                      student.student_id
                    )}"
                  >
                    แก้ไข
                  </button>


                  <button
                    type="button"
                    class="warning-btn"
                    data-action="reset-student"
                    data-id="${escapeAttribute(
                      student.student_id
                    )}"
                  >
                    รีเซ็ตรหัสผ่าน
                  </button>

                </div>

              </td>

            </tr>

          `;

        }
      )
      .join("");


  /*
   * Bind dynamic buttons
   */

  tbody
    .querySelectorAll(
      "[data-action='edit-student']"
    )
    .forEach(
      function(button) {

        button.addEventListener(
          "click",
          function() {

            openEditStudentModal(
              button.dataset.id
            );

          }
        );

      }
    );


  tbody
    .querySelectorAll(
      "[data-action='reset-student']"
    )
    .forEach(
      function(button) {

        button.addEventListener(
          "click",
          function() {

            openResetPasswordModal(
              button.dataset.id
            );

          }
        );

      }
    );

}


/*******************************************************
 * STATUS
 *******************************************************/

function renderStatus(status) {

  const value =
    String(
      status || ""
    ).trim();


  const upper =
    value.toUpperCase();


  let className =
    "status-active";


  if (
    upper === "INACTIVE"
  ) {

    className =
      "status-inactive";

  }


  if (
    upper === "SUSPENDED" ||
    upper === "DISABLED"
  ) {

    className =
      "status-danger";

  }


  return `

    <span
      class="status-badge ${className}"
    >
      ${escapeHtml(
        value || "-"
      )}
    </span>

  `;

}


/*******************************************************
 * OPEN ADD STUDENT
 *******************************************************/

function openAddStudentModal() {

  editingStudentId =
    "";


  const title =
    document.getElementById(
      "studentModalTitle"
    );


  if (title) {

    title.textContent =
      "เพิ่มนักศึกษา";

  }


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


  const studentIdInput =
    document.getElementById(
      "studentId"
    );


  if (studentIdInput) {

    studentIdInput
      .classList
      .remove(
        "readonly-input"
      );

    studentIdInput.disabled =
      false;

  }


  setStudentModalButton(
    "บันทึกนักศึกษา"
  );


  openModal(
    "studentModal"
  );

}


/*******************************************************
 * OPEN EDIT STUDENT
 *******************************************************/

function openEditStudentModal(
  studentId
) {

  const student =
    students.find(
      function(item) {

        return String(
          item.student_id
        ).trim()
        === String(
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


  editingStudentId =
    String(
      student.student_id
    ).trim();


  const title =
    document.getElementById(
      "studentModalTitle"
    );


  if (title) {

    title.textContent =
      "แก้ไขข้อมูลนักศึกษา";

  }


  setValue(
    "studentId",
    student.student_id
  );


  setValue(
    "studentPrefix",
    student.prefix_th
  );


  setValue(
    "studentFirstnameTh",
    student.firstname_th
  );


  setValue(
    "studentLastnameTh",
    student.lastname_th
  );


  setValue(
    "studentFirstnameEn",
    student.firstname_en
  );


  setValue(
    "studentLastnameEn",
    student.lastname_en
  );


  setValue(
    "studentDepartment",
    student.department
  );


  setValue(
    "studentPhone",
    student.phone
  );


  setValue(
    "studentStatus",
    student.status ||
    "นักศึกษาปกติ"
  );


  setValue(
    "studentIssueDate",
    convertDateForInput(
      student.issue_date
    )
  );


  setValue(
    "studentExpireDate",
    convertDateForInput(
      student.expire_date
    )
  );


  setValue(
    "studentPhoto",
    student.photo_url
  );


  setValue(
    "studentPassword",
    ""
  );


  /*
   * ห้ามแก้ student_id
   * ตอนแก้ไข
   */

  const studentIdInput =
    document.getElementById(
      "studentId"
    );


  if (studentIdInput) {

    studentIdInput
      .classList
      .add(
        "readonly-input"
      );

    studentIdInput.disabled =
      true;

  }


  setStudentModalButton(
    "บันทึกการแก้ไข"
  );


  openModal(
    "studentModal"
  );

}


/*******************************************************
 * STUDENT MODAL BUTTON
 *******************************************************/

function setStudentModalButton(
  text
) {

  const button =
    document.getElementById(
      "saveStudentBtn"
    );


  if (button) {

    button.textContent =
      text;

  }

}


/*******************************************************
 * STUDENT FORM SUBMIT
 *******************************************************/

async function handleStudentSubmit(
  event
) {

  event.preventDefault();


  const studentId =
    getValue(
      "studentId"
    ).trim();


  const password =
    getValue(
      "studentPassword"
    );


  if (!studentId) {

    showMessage(
      "กรุณากรอกรหัสนักศึกษา",
      "error"
    );

    return;

  }


  const data = {

    student_id:
      studentId,

    prefix_th:
      getValue(
        "studentPrefix"
      ),

    firstname_th:
      getValue(
        "studentFirstnameTh"
      ).trim(),

    lastname_th:
      getValue(
        "studentLastnameTh"
      ).trim(),

    firstname_en:
      getValue(
        "studentFirstnameEn"
      ).trim(),

    lastname_en:
      getValue(
        "studentLastnameEn"
      ).trim(),

    department:
      getValue(
        "studentDepartment"
      ).trim(),

    phone:
      getValue(
        "studentPhone"
      ).trim(),

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
      ).trim()

  };


  if (
    !data.firstname_th ||
    !data.lastname_th
  ) {

    showMessage(
      "กรุณากรอกชื่อและนามสกุล",
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
    editingStudentId
      ? "กำลังบันทึก..."
      : "กำลังเพิ่ม..."
  );


  try {


    /*
     * EDIT
     */

    if (editingStudentId) {

      const result =
        await apiRequest(
          "adminUpdateStudent",
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
            : "บันทึกข้อมูลไม่สำเร็จ"
        );

      }


      showMessage(
        "แก้ไขข้อมูลนักศึกษาสำเร็จ",
        "success"
      );


      closeStudentModal();


      await loadStudents();


      return;

    }


    /*
     * ADD
     */

    if (!password) {

      throw new Error(
        "กรุณากำหนดรหัสผ่านเริ่มต้น"
      );

    }


    data.password =
      password;


    const result =
      await apiRequest(
        "adminAddStudent",
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
      "เพิ่มนักศึกษาสำเร็จ",
      "success"
    );


    closeStudentModal();


    await loadStudents();


  } catch (error) {

    console.error(
      "STUDENT SAVE ERROR",
      error
    );


    if (
      error.message !==
      "ADMIN_SESSION_EXPIRED"
    ) {

      showMessage(
        error.message ||
        "เกิดข้อผิดพลาด",
        "error"
      );

    }

  } finally {

    setButtonLoading(
      button,
      false,
      editingStudentId
        ? "บันทึกการแก้ไข"
        : "บันทึกนักศึกษา"
    );

  }

}


/*******************************************************
 * CLOSE STUDENT MODAL
 *******************************************************/

function closeStudentModal() {

  closeModal(
    "studentModal"
  );


  editingStudentId =
    "";

}


/*******************************************************
 * OPEN DIRECT RESET
 *******************************************************/

function openResetPasswordModal(
  studentId
) {

  resettingStudentId =
    String(
      studentId || ""
    ).trim();


  setText(
    "resetStudentId",
    resettingStudentId
  );


  setValue(
    "newStudentPassword",
    "123456"
  );


  openModal(
    "resetPasswordModal"
  );

}


/*******************************************************
 * CLOSE DIRECT RESET
 *******************************************************/

function closeResetPasswordModal() {

  closeModal(
    "resetPasswordModal"
  );


  resettingStudentId =
    "";

}


/*******************************************************
 * DIRECT RESET PASSWORD
 *******************************************************/

async function handleDirectResetPassword(
  event
) {

  event.preventDefault();


  if (!resettingStudentId) {

    showMessage(
      "ไม่พบรหัสนักศึกษา",
      "error"
    );

    return;

  }


  const password =
    getValue(
      "newStudentPassword"
    );


  if (
    password.length < 4
  ) {

    showMessage(
      "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร",
      "error"
    );

    return;

  }


  const button =
    document.getElementById(
      "confirmResetPasswordBtn"
    );


  setButtonLoading(
    button,
    true,
    "กำลังรีเซ็ต..."
  );


  try {

    /*
     * การ reset ตรงจากหน้า Student
     * Code.gs ปัจจุบันมี API
     * adminResetPassword
     *
     * แต่ API นี้รับ request_id
     *
     * ดังนั้นเราจะค้นคำร้องก่อน
     */

    const matchingRequest =
      resetRequests.find(
        function(item) {

          return String(
            item.student_id
          ).trim()
          === resettingStudentId &&
          String(
            item.status
          ).trim().toUpperCase()
          === "APPROVED";

        }
      );


    if (!matchingRequest) {

      /*
       * หากไม่มีคำร้อง APPROVED
       * Code.gs ปัจจุบันไม่อนุญาต
       * ให้ adminResetPassword
       * ทำงานโดยตรง
       */

      throw new Error(
        "ระบบปัจจุบันกำหนดให้รีเซ็ตรหัสผ่านผ่านคำร้องที่อนุมัติแล้ว กรุณาใช้ส่วนคำร้องลืมรหัสผ่าน"
      );

    }


    const result =
      await apiRequest(
        "adminResetPassword",
        {

          request_id:
            matchingRequest.request_id,

          newPassword:
            password,

          note:
            "รีเซ็ตรหัสผ่านจาก Admin"

        }
      );


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


    closeResetPasswordModal();


    await loadResetRequests();


  } catch (error) {

    console.error(
      "DIRECT RESET ERROR",
      error
    );


    if (
      error.message !==
      "ADMIN_SESSION_EXPIRED"
    ) {

      showMessage(
        error.message ||
        "รีเซ็ตรหัสผ่านไม่สำเร็จ",
        "error"
      );

    }

  } finally {

    setButtonLoading(
      button,
      false,
      "รีเซ็ตรหัสผ่าน"
    );

  }

}


/*******************************************************
 * LOAD RESET REQUESTS
 *******************************************************/

async function loadResetRequests() {

  const tbody =
    document.getElementById(
      "resetRequestsTableBody"
    );


  if (tbody) {

    tbody.innerHTML = `

      <tr>
        <td
          colspan="8"
          class="empty-row"
        >
          กำลังโหลดคำร้อง...
        </td>
      </tr>

    `;

  }


  try {

    const result =
      await apiRequest(
        "adminGetResetRequests",
        {}
      );


    if (
      !result ||
      !result.success
    ) {

      throw new Error(
        result &&
        result.message
          ? result.message
          : "ไม่สามารถโหลดคำร้องได้"
      );

    }


    resetRequests =
      Array.isArray(
        result.requests
      )
        ? result.requests
        : [];


    renderResetRequests();

  } catch (error) {

    console.error(
      "LOAD RESET REQUESTS ERROR",
      error
    );


    if (
      error.message ===
      "ADMIN_SESSION_EXPIRED"
    ) {

      return;

    }


    if (tbody) {

      tbody.innerHTML = `

        <tr>
          <td
            colspan="8"
            class="empty-row"
          >
            ไม่สามารถโหลดคำร้องได้
            <br>
            ${escapeHtml(error.message)}
          </td>
        </tr>

      `;

    }

  }

}


/*******************************************************
 * RENDER RESET REQUESTS
 *******************************************************/

function renderResetRequests() {

  const tbody =
    document.getElementById(
      "resetRequestsTableBody"
    );


  if (!tbody) {

    return;

  }


  if (!resetRequests.length) {

    tbody.innerHTML = `

      <tr>
        <td
          colspan="8"
          class="empty-row"
        >
          ยังไม่มีคำร้องลืมรหัสผ่าน
        </td>
      </tr>

    `;

    return;

  }


  tbody.innerHTML =
    resetRequests
      .map(
        function(request) {

          const status =
            String(
              request.status || ""
            ).trim().toUpperCase();


          let actionHtml =
            "-";


          if (
            status === "PENDING"
          ) {

            actionHtml = `

              <div class="action-buttons">

                <button
                  type="button"
                  class="success-btn"
                  data-action="request-process"
                  data-id="${escapeAttribute(
                    request.request_id
                  )}"
                >
                  ตรวจสอบ
                </button>

              </div>

            `;

          }


          if (
            status === "APPROVED"
          ) {

            actionHtml = `

              <div class="action-buttons">

                <button
                  type="button"
                  class="small-primary-btn"
                  data-action="request-reset"
                  data-id="${escapeAttribute(
                    request.request_id
                  )}"
                >
                  ตั้งรหัสผ่าน
                </button>

              </div>

            `;

          }


          return `

            <tr>

              <td>
                ${escapeHtml(
                  request.request_id
                )}
              </td>

              <td class="student-id-cell">
                ${escapeHtml(
                  request.student_id
                )}
              </td>

              <td>
                ${escapeHtml(
                  request.reason ||
                  request.note
                )}
              </td>

              <td>
                ${renderRequestStatus(
                  status
                )}
              </td>

              <td>
                ${escapeHtml(
                  request.requested_at
                )}
              </td>

              <td>
                ${escapeHtml(
                  request.processed_at
                )}
              </td>

              <td>
                ${escapeHtml(
                  request.processed_by
                )}
              </td>

              <td class="action-column">

                ${actionHtml}

              </td>

            </tr>

          `;

        }
      )
      .join("");


  tbody
    .querySelectorAll(
      "[data-action='request-process']"
    )
    .forEach(
      function(button) {

        button.addEventListener(
          "click",
          function() {

            openResetRequestModal(
              button.dataset.id
            );

          }
        );

      }
    );


  tbody
    .querySelectorAll(
      "[data-action='request-reset']"
    )
    .forEach(
      function(button) {

        button.addEventListener(
          "click",
          function() {

            openRequestPasswordModal(
              button.dataset.id
            );

          }
        );

      }
    );

}


/*******************************************************
 * REQUEST STATUS
 *******************************************************/

function renderRequestStatus(
  status
) {

  let className =
    "status-inactive";


  if (
    status === "APPROVED" ||
    status === "RESET"
  ) {

    className =
      "status-active";

  }


  if (
    status === "REJECTED"
  ) {

    className =
      "status-danger";

  }


  return `

    <span
      class="status-badge ${className}"
    >
      ${escapeHtml(
        status || "-"
      )}
    </span>

  `;

}


/*******************************************************
 * OPEN RESET REQUEST
 *******************************************************/

function openResetRequestModal(
  requestId
) {

  selectedResetRequest =
    resetRequests.find(
      function(item) {

        return String(
          item.request_id
        ).trim()
        === String(
          requestId
        ).trim();

      }
    );


  if (!selectedResetRequest) {

    showMessage(
      "ไม่พบคำร้อง",
      "error"
    );

    return;

  }


  setText(
    "requestModalId",
    selectedResetRequest.request_id
  );


  setText(
    "requestModalStudentId",
    selectedResetRequest.student_id
  );


  setText(
    "requestModalReason",
    selectedResetRequest.reason ||
    selectedResetRequest.note ||
    "-"
  );


  setValue(
    "requestNote",
    ""
  );


  openModal(
    "resetRequestModal"
  );

}


/*******************************************************
 * CLOSE RESET REQUEST
 *******************************************************/

function closeResetRequestModal() {

  closeModal(
    "resetRequestModal"
  );


  selectedResetRequest =
    null;

}


/*******************************************************
 * APPROVE REQUEST
 *******************************************************/

async function handleApproveRequest() {

  if (!selectedResetRequest) {

    return;

  }


  const confirmed =
    window.confirm(
      "ต้องการอนุมัติคำร้องนี้หรือไม่?"
    );


  if (!confirmed) {

    return;

  }


  const note =
    getValue(
      "requestNote"
    ).trim();


  const button =
    document.getElementById(
      "approveRequestBtn"
    );


  setButtonLoading(
    button,
    true,
    "กำลังอนุมัติ..."
  );


  try {

    const result =
      await apiRequest(
        "adminApproveReset",
        {

          request_id:
            selectedResetRequest.request_id,

          note:
            note

        }
      );


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
      "อนุมัติคำร้องสำเร็จ",
      "success"
    );


    closeResetRequestModal();


    await loadResetRequests();


  } catch (error) {

    console.error(
      "APPROVE REQUEST ERROR",
      error
    );


    if (
      error.message !==
      "ADMIN_SESSION_EXPIRED"
    ) {

      showMessage(
        error.message,
        "error"
      );

    }

  } finally {

    setButtonLoading(
      button,
      false,
      "อนุมัติ"
    );

  }

}


/*******************************************************
 * REJECT REQUEST
 *******************************************************/

async function handleRejectRequest() {

  if (!selectedResetRequest) {

    return;

  }


  const confirmed =
    window.confirm(
      "ต้องการปฏิเสธคำร้องนี้หรือไม่?"
    );


  if (!confirmed) {

    return;

  }


  const note =
    getValue(
      "requestNote"
    ).trim();


  const button =
    document.getElementById(
      "rejectRequestBtn"
    );


  setButtonLoading(
    button,
    true,
    "กำลังปฏิเสธ..."
  );


  try {

    const result =
      await apiRequest(
        "adminRejectReset",
        {

          request_id:
            selectedResetRequest.request_id,

          note:
            note

        }
      );


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
      "ปฏิเสธคำร้องสำเร็จ",
      "success"
    );


    closeResetRequestModal();


    await loadResetRequests();


  } catch (error) {

    console.error(
      "REJECT REQUEST ERROR",
      error
    );


    if (
      error.message !==
      "ADMIN_SESSION_EXPIRED"
    ) {

      showMessage(
        error.message,
        "error"
      );

    }

  } finally {

    setButtonLoading(
      button,
      false,
      "ปฏิเสธ"
    );

  }

}


/*******************************************************
 * OPEN REQUEST PASSWORD MODAL
 *******************************************************/

function openRequestPasswordModal(
  requestId
) {

  selectedResetRequest =
    resetRequests.find(
      function(item) {

        return String(
          item.request_id
        ).trim()
        === String(
          requestId
        ).trim();

      }
    );


  if (!selectedResetRequest) {

    showMessage(
      "ไม่พบคำร้อง",
      "error"
    );

    return;

  }


  setText(
    "requestPasswordStudentId",
    selectedResetRequest.student_id
  );


  setValue(
    "requestNewPassword",
    "123456"
  );


  openModal(
    "requestPasswordModal"
  );

}


/*******************************************************
 * CLOSE REQUEST PASSWORD
 *******************************************************/

function closeRequestPasswordModal() {

  closeModal(
    "requestPasswordModal"
  );

}


/*******************************************************
 * REQUEST PASSWORD SUBMIT
 *******************************************************/

async function handleRequestPasswordSubmit(
  event
) {

  event.preventDefault();


  if (!selectedResetRequest) {

    return;

  }


  const password =
    getValue(
      "requestNewPassword"
    );


  if (
    password.length < 4
  ) {

    showMessage(
      "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร",
      "error"
    );

    return;

  }


  const button =
    document.getElementById(
      "confirmRequestPasswordBtn"
    );


  setButtonLoading(
    button,
    true,
    "กำลังตั้งรหัสผ่าน..."
  );


  try {

    const result =
      await apiRequest(
        "adminResetPassword",
        {

          request_id:
            selectedResetRequest.request_id,

          newPassword:
            password,

          note:
            "ตั้งรหัสผ่านใหม่โดย Admin"

        }
      );


    if (
      !result ||
      !result.success
    ) {

      throw new Error(
        result &&
        result.message
          ? result.message
          : "ตั้งรหัสผ่านไม่สำเร็จ"
      );

    }


    showMessage(
      "ตั้งรหัสผ่านใหม่สำเร็จ",
      "success"
    );


    closeRequestPasswordModal();


    await loadResetRequests();


  } catch (error) {

    console.error(
      "REQUEST PASSWORD ERROR",
      error
    );


    if (
      error.message !==
      "ADMIN_SESSION_EXPIRED"
    ) {

      showMessage(
        error.message,
        "error"
      );

    }

  } finally {

    setButtonLoading(
      button,
      false,
      "ตั้งรหัสผ่าน"
    );

  }

}


/*******************************************************
 * LOAD STAFF
 *
 * รองรับ API:
 *
 * adminGetStaff
 *
 * ถ้า Code.gs ยังไม่มี
 * จะแสดงข้อความแจ้งเตือนแทน
 *******************************************************/

async function loadStaff() {

  const tbody =
    document.getElementById(
      "staffTableBody"
    );


  if (tbody) {

    tbody.innerHTML = `

      <tr>
        <td
          colspan="5"
          class="empty-row"
        >
          กำลังโหลดข้อมูล Staff...
        </td>
      </tr>

    `;

  }


  try {

    const result =
      await apiRequest(
        "adminGetStaff",
        {}
      );


    if (
      !result ||
      !result.success
    ) {

      throw new Error(
        result &&
        result.message
          ? result.message
          : "API ยังไม่รองรับการโหลด Staff"
      );

    }


    staffList =
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


    if (
      error.message ===
      "ADMIN_SESSION_EXPIRED"
    ) {

      return;

    }


    if (tbody) {

      tbody.innerHTML = `

        <tr>
          <td
            colspan="5"
            class="empty-row"
          >
            ยังไม่สามารถโหลด Staff ได้
            <br>
            <small>
              ${escapeHtml(
                error.message
              )}
            </small>
          </td>
        </tr>

      `;

    }

  }

}


/*******************************************************
 * RENDER STAFF
 *******************************************************/

function renderStaff() {

  const tbody =
    document.getElementById(
      "staffTableBody"
    );


  if (!tbody) {

    return;

  }


  if (!staffList.length) {

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
    staffList
      .map(
        function(staff) {

          return `

            <tr>

              <td>
                ${escapeHtml(
                  staff.admin_id
                )}
              </td>

              <td>
                ${escapeHtml(
                  staff.username
                )}
              </td>

              <td>
                ${escapeHtml(
                  staff.name
                )}
              </td>

              <td>
                ${escapeHtml(
                  staff.role
                )}
              </td>

              <td>
                ${renderStatus(
                  staff.status
                )}
              </td>

            </tr>

          `;

        }
      )
      .join("");

}


/*******************************************************
 * OPEN STAFF MODAL
 *******************************************************/

function openAddStaffModal() {

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


  openModal(
    "staffModal"
  );

}


/*******************************************************
 * CLOSE STAFF
 *******************************************************/

function closeStaffModal() {

  closeModal(
    "staffModal"
  );

}


/*******************************************************
 * STAFF SUBMIT
 *******************************************************/

async function handleStaffSubmit(
  event
) {

  event.preventDefault();


  const username =
    getValue(
      "staffUsername"
    ).trim();


  const password =
    getValue(
      "staffPassword"
    );


  const name =
    getValue(
      "staffName"
    ).trim();


  if (
    !username ||
    !password ||
    !name
  ) {

    showMessage(
      "กรุณากรอกข้อมูล Staff ให้ครบ",
      "error"
    );

    return;

  }


  if (
    password.length < 4
  ) {

    showMessage(
      "รหัสผ่าน Staff ต้องมีอย่างน้อย 4 ตัวอักษร",
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
        "adminAddStaff",
        {

          username:
            username,

          password:
            password,

          name:
            name,

          role:
            getValue(
              "staffRole"
            ),

          status:
            getValue(
              "staffStatus"
            )

        }
      );


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


    closeStaffModal();


    await loadStaff();


  } catch (error) {

    console.error(
      "ADD STAFF ERROR",
      error
    );


    if (
      error.message !==
      "ADMIN_SESSION_EXPIRED"
    ) {

      showMessage(
        error.message,
        "error"
      );

    }

  } finally {

    setButtonLoading(
      button,
      false,
      "บันทึก Staff"
    );

  }

}


/*******************************************************
 * OPEN MODAL
 *******************************************************/

function openModal(id) {

  const modal =
    document.getElementById(
      id
    );


  if (modal) {

    modal.classList.add(
      "show"
    );

  }

}


/*******************************************************
 * CLOSE MODAL
 *******************************************************/

function closeModal(id) {

  const modal =
    document.getElementById(
      id
    );


  if (modal) {

    modal.classList.remove(
      "show"
    );

  }

}


/*******************************************************
 * SET VALUE
 *******************************************************/

function setValue(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.value =
      value == null
        ? ""
        : value;

  }

}


/*******************************************************
 * GET VALUE
 *******************************************************/

function getValue(id) {

  const element =
    document.getElementById(
      id
    );


  if (!element) {

    return "";

  }


  return String(
    element.value || ""
  );

}


/*******************************************************
 * SET TEXT
 *******************************************************/

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
      value == null
        ? ""
        : value;

  }

}


/*******************************************************
 * DATE FOR INPUT
 *
 * รองรับ
 *
 * dd/MM/yyyy
 * dd/MM/yyyy HH:mm:ss
 * yyyy-MM-dd
 * yyyy-MM-dd HH:mm:ss
 *******************************************************/

function convertDateForInput(
  value
) {

  if (!value) {

    return "";

  }


  const text =
    String(value).trim();


  /*
   * yyyy-MM-dd
   */

  let match =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );


  if (match) {

    return (
      match[1] +
      "-" +
      match[2] +
      "-" +
      match[3]
    );

  }


  /*
   * dd/MM/yyyy
   */

  match =
    text.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
    );


  if (match) {

    const day =
      match[1]
        .padStart(2, "0");


    const month =
      match[2]
        .padStart(2, "0");


    let year =
      Number(
        match[3]
      );


    /*
     * กรณีเป็น พ.ศ.
     */

    if (year > 2400) {

      year -= 543;

    }


    return (
      year +
      "-" +
      month +
      "-" +
      day
    );

  }


  return "";

}


/*******************************************************
 * BUTTON LOADING
 *******************************************************/

function setButtonLoading(
  button,
  loading,
  loadingText
) {

  if (!button) {

    return;

  }


  if (loading) {

    button.disabled =
      true;

    button.dataset.originalText =
      button.textContent;

    button.textContent =
      loadingText;

  } else {

    button.disabled =
      false;

    button.textContent =
      button.dataset.originalText ||
      button.textContent;

  }

}


/*******************************************************
 * MESSAGE
 *******************************************************/

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


  box.classList.add(
    "show"
  );


  clearTimeout(
    showMessage.timer
  );


  showMessage.timer =
    setTimeout(
      function() {

        box.classList.remove(
          "show"
        );

      },
      5000
    );

}


/*******************************************************
 * ESCAPE HTML
 *******************************************************/

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


/*******************************************************
 * ESCAPE ATTRIBUTE
 *******************************************************/

function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}
