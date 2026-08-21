/*******************************************************
 * STUDENT CARD SYSTEM
 * admin-dashboard.js
 *
 * ADMIN DASHBOARD
 *
 * รองรับ:
 *
 * - ตรวจสอบ Admin Session
 * - แสดง Admin
 * - Logout
 * - โหลดนักศึกษา
 * - ค้นหานักศึกษา
 * - แก้ไขนักศึกษา
 * - เพิ่มนักศึกษา
 * - รีเซ็ตรหัสผ่าน
 * - โหลดคำร้อง Reset Password
 * - เพิ่ม Staff
 * - โหลด Staff
 * - Modal
 *******************************************************/


/*******************************************************
 * GLOBAL STATE
 *******************************************************/

const ADMIN_DASHBOARD_STATE = {

  students: [],

  resetRequests: [],

  staff: [],

  editingStudentId: "",

  isLoadingStudents: false,

  isLoadingResetRequests: false,

  isLoadingStaff: false

};


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
 * INITIALIZE
 *******************************************************/

async function initAdminDashboard() {

  console.log(
    "ADMIN DASHBOARD: initializing..."
  );


  /*
   * ตรวจ CONFIG
   */

  if (
    typeof CONFIG === "undefined"
  ) {

    showDashboardMessage(
      "ไม่พบ CONFIG กรุณาตรวจสอบ config.js",
      "error"
    );

    return;

  }


  /*
   * ตรวจ Admin Token
   */

  const token =
    getAdminToken();


  const admin =
    getAdminData();


  if (
    !token
  ) {

    redirectToAdminLogin();

    return;

  }


  /*
   * แสดงข้อมูล Admin
   */

  renderAdminInfo(
    admin
  );


  /*
   * Event ต่าง ๆ
   */

  bindDashboardEvents();


  /*
   * โหลดนักศึกษา
   */

  await loadStudents();


  /*
   * โหลด Reset Requests
   */

  await loadResetRequests();


  /*
   * Staff
   *
   * Backend ต้องรองรับ API ก่อน
   */

  await loadStaff();

}


/*******************************************************
 * BIND EVENTS
 *******************************************************/

function bindDashboardEvents() {

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
      handleAdminLogout
    );

  }


  /*
   * Search
   */

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

  const closeStudentModal =
    document.getElementById(
      "closeStudentModal"
    );


  if (closeStudentModal) {

    closeStudentModal.addEventListener(
      "click",
      closeStudentModalWindow
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
      handleStudentFormSubmit
    );

  }


  /*
   * Close Student Modal 2
   */

  const closeStudentModal2 =
    document.getElementById(
      "closeStudentModal2"
    );


  if (closeStudentModal2) {

    closeStudentModal2.addEventListener(
      "click",
      closeStudentModalWindow
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
      closeStaffModalWindow
    );

  }


  /*
   * Close Staff Modal 2
   */

  const closeStaffModal2 =
    document.getElementById(
      "closeStaffModal2"
    );


  if (closeStaffModal2) {

    closeStaffModal2.addEventListener(
      "click",
      closeStaffModalWindow
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
      handleStaffFormSubmit
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

          closeStudentModalWindow();

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

          closeStaffModalWindow();

        }

      }
    );

  }

}


/*******************************************************
 * RENDER ADMIN INFO
 *******************************************************/

function renderAdminInfo(
  admin
) {

  admin =
    admin || {};


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


  if (nameElement) {

    nameElement.textContent =
      name;

  }


  if (roleElement) {

    roleElement.textContent =
      role;

  }

}


/*******************************************************
 * LOAD STUDENTS
 *******************************************************/

async function loadStudents() {

  if (
    ADMIN_DASHBOARD_STATE
      .isLoadingStudents
  ) {

    return;

  }


  ADMIN_DASHBOARD_STATE
    .isLoadingStudents = true;


  setStudentsLoading(
    true
  );


  try {

    const token =
      getAdminToken();


    if (!token) {

      redirectToAdminLogin();

      return;

    }


    const result =
      await apiRequest({

        action:
          "adminGetStudents",

        token:
          token

      });


    console.log(
      "ADMIN STUDENTS RESULT",
      result
    );


    /*
     * Session หมดอายุ
     */

    if (
      handleSessionExpired(
        result
      )
    ) {

      return;

    }


    if (
      !result ||
      !result.success
    ) {

      showDashboardMessage(
        result &&
        result.message
          ? result.message
          : "ไม่สามารถโหลดข้อมูลนักศึกษาได้",
        "error"
      );

      renderStudentsError();

      return;

    }


    ADMIN_DASHBOARD_STATE
      .students =
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


    renderStudentsError();


    showDashboardMessage(
      "ไม่สามารถโหลดข้อมูลนักศึกษาได้",
      "error"
    );


  } finally {

    ADMIN_DASHBOARD_STATE
      .isLoadingStudents = false;


    setStudentsLoading(
      false
    );

  }

}


/*******************************************************
 * RENDER STUDENTS
 *******************************************************/

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


  let students =
    ADMIN_DASHBOARD_STATE
      .students || [];


  const search =
    String(
      searchText == null
        ? (
            document.getElementById(
              "studentSearch"
            )?.value || ""
          )
        : searchText
    )
    .trim()
    .toLowerCase();


  if (search) {

    students =
      students.filter(
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


          return (
            text.indexOf(
              search
            ) !== -1
          );

        }
      );

  }


  /*
   * ไม่มีข้อมูล
   */

  if (
    students.length === 0
  ) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="8"
          style="text-align:center;"
        >
          ไม่พบข้อมูลนักศึกษา
        </td>

      </tr>

    `;

    return;

  }


  tbody.innerHTML =
    students
      .map(
        function (student) {

          return createStudentRow(
            student
          );

        }
      )
      .join("");


  /*
   * bind buttons
   */

  bindStudentRowButtons();

}


/*******************************************************
 * CREATE STUDENT ROW
 *******************************************************/

function createStudentRow(
  student
) {

  const studentId =
    escapeHtml(
      student.student_id || ""
    );


  const fullThaiName =
    [

      student.prefix_th,

      student.firstname_th,

      student.lastname_th

    ]
    .filter(Boolean)
    .join(" ");


  const fullEnglishName =
    [

      student.firstname_en,

      student.lastname_en

    ]
    .filter(Boolean)
    .join(" ");


  const department =
    escapeHtml(
      student.department || "-"
    );


  const phone =
    escapeHtml(
      student.phone || "-"
    );


  const status =
    escapeHtml(
      student.status || "-"
    );


  const issueDate =
    escapeHtml(
      formatDisplayDate(
        student.issue_date
      )
    );


  const expireDate =
    escapeHtml(
      formatDisplayDate(
        student.expire_date
      )
    );


  const statusClass =
    getStatusClass(
      student.status
    );


  return `

    <tr>

      <td
        data-label="รหัสนักศึกษา"
      >
        <strong>
          ${studentId}
        </strong>
      </td>


      <td
        data-label="ชื่อ-นามสกุล"
      >
        ${escapeHtml(
          fullThaiName || "-"
        )}
      </td>


      <td
        data-label="English Name"
      >
        ${escapeHtml(
          fullEnglishName || "-"
        )}
      </td>


      <td
        data-label="แผนก"
      >
        ${department}
      </td>


      <td
        data-label="โทรศัพท์"
      >
        ${phone}
      </td>


      <td
        data-label="สถานะ"
      >

        <span
          class="status-badge ${statusClass}"
        >
          ${status}
        </span>

      </td>


      <td
        data-label="วันออกบัตร"
      >
        ${issueDate}
      </td>


      <td
        data-label="วันหมดอายุ"
      >
        ${expireDate}
      </td>


      <td
        class="student-actions"
        data-label="จัดการ"
      >

        <button
          type="button"
          class="action-btn edit-student-btn"
          data-student-id="${escapeAttribute(
            student.student_id || ""
          )}"
        >
          แก้ไข
        </button>


        <button
          type="button"
          class="action-btn reset-password-btn"
          data-student-id="${escapeAttribute(
            student.student_id || ""
          )}"
        >
          รีเซ็ตรหัสผ่าน
        </button>

      </td>

    </tr>

  `;

}


/*******************************************************
 * BIND STUDENT BUTTONS
 *******************************************************/

function bindStudentRowButtons() {

  const editButtons =
    document.querySelectorAll(
      ".edit-student-btn"
    );


  editButtons.forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          const studentId =
            button.dataset.studentId;


          editStudent(
            studentId
          );

        }
      );

    }
  );


  const resetButtons =
    document.querySelectorAll(
      ".reset-password-btn"
    );


  resetButtons.forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          const studentId =
            button.dataset.studentId;


          resetStudentPassword(
            studentId
          );

        }
      );

    }
  );

}


/*******************************************************
 * EDIT STUDENT
 *******************************************************/

function editStudent(
  studentId
) {

  const student =
    ADMIN_DASHBOARD_STATE
      .students
      .find(
        function (item) {

          return String(
            item.student_id
          ) === String(
            studentId
          );

        }
      );


  if (!student) {

    showDashboardMessage(
      "ไม่พบข้อมูลนักศึกษา",
      "error"
    );

    return;

  }


  ADMIN_DASHBOARD_STATE
    .editingStudentId =
      studentId;


  /*
   * เปิด Modal
   */

  openStudentModal(
    student
  );

}


/*******************************************************
 * OPEN STUDENT MODAL
 *******************************************************/

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


  const title =
    modal.querySelector(
      ".modal-header h2"
    );


  if (title) {

    title.textContent =
      student
        ? "แก้ไขข้อมูลนักศึกษา"
        : "เพิ่มนักศึกษา";

  }


  /*
   * Student ID
   */

  setInputValue(
    "studentId",
    student?.student_id || ""
  );


  /*
   * Password
   *
   * ตอนแก้ไขไม่แก้ password
   */

  setInputValue(
    "studentPassword",
    student
      ? ""
      : "123456"
  );


  /*
   * Prefix
   */

  setInputValue(
    "studentPrefix",
    student?.prefix_th || ""
  );


  /*
   * Thai
   */

  setInputValue(
    "studentFirstnameTh",
    student?.firstname_th || ""
  );


  setInputValue(
    "studentLastnameTh",
    student?.lastname_th || ""
  );


  /*
   * English
   */

  setInputValue(
    "studentFirstnameEn",
    student?.firstname_en || ""
  );


  setInputValue(
    "studentLastnameEn",
    student?.lastname_en || ""
  );


  /*
   * Department
   */

  setInputValue(
    "studentDepartment",
    student?.department || ""
  );


  /*
   * Phone
   */

  setInputValue(
    "studentPhone",
    student?.phone || ""
  );


  /*
   * Status
   */

  setInputValue(
    "studentStatus",
    student?.status ||
    "นักศึกษาปกติ"
  );


  /*
   * Date
   */

  setInputValue(
    "studentIssueDate",
    convertToInputDate(
      student?.issue_date
    )
  );


  setInputValue(
    "studentExpireDate",
    convertToInputDate(
      student?.expire_date
    )
  );


  /*
   * Photo
   */

  setInputValue(
    "studentPhoto",
    student?.photo_url || ""
  );


  /*
   * แสดง Modal
   */

  modal.classList.add(
    "show"
  );

}


/*******************************************************
 * CLOSE STUDENT MODAL
 *******************************************************/

function closeStudentModalWindow() {

  const modal =
    document.getElementById(
      "studentModal"
    );


  if (!modal) {

    return;

  }


  modal.classList.remove(
    "show"
  );


  ADMIN_DASHBOARD_STATE
    .editingStudentId = "";


  const form =
    document.getElementById(
      "studentForm"
    );


  if (form) {

    form.reset();

  }

}


/*******************************************************
 * STUDENT FORM SUBMIT
 *******************************************************/

async function handleStudentFormSubmit(
  event
) {

  event.preventDefault();


  const studentId =
    getInputValue(
      "studentId"
    ).trim();


  const password =
    getInputValue(
      "studentPassword"
    );


  const editing =
    !!ADMIN_DASHBOARD_STATE
      .editingStudentId;


  /*
   * Validate
   */

  if (!studentId) {

    showDashboardMessage(
      "กรุณากรอกรหัสนักศึกษา",
      "error"
    );

    return;

  }


  if (
    !editing &&
    !password
  ) {

    showDashboardMessage(
      "กรุณากรอกรหัสผ่านเริ่มต้น",
      "error"
    );

    return;

  }


  const payload = {

    token:
      getAdminToken(),

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
   * เพิ่มนักศึกษา
   */

  if (!editing) {

    payload.action =
      "adminAddStudent";

    payload.password =
      password;

  }


  /*
   * แก้ไขนักศึกษา
   */

  else {

    payload.action =
      "adminUpdateStudent";

  }


  setStudentSaveLoading(
    true
  );


  try {

    const result =
      await apiRequest(
        payload
      );


    console.log(
      "STUDENT SAVE RESULT",
      result
    );


    if (
      handleSessionExpired(
        result
      )
    ) {

      return;

    }


    if (
      !result ||
      !result.success
    ) {

      showDashboardMessage(
        result &&
        result.message
          ? result.message
          : "บันทึกข้อมูลไม่สำเร็จ",
        "error"
      );

      return;

    }


    showDashboardMessage(
      editing
        ? "แก้ไขข้อมูลนักศึกษาสำเร็จ"
        : "เพิ่มนักศึกษาสำเร็จ",
      "success"
    );


    closeStudentModalWindow();


    await loadStudents();


  } catch (error) {

    console.error(
      "SAVE STUDENT ERROR",
      error
    );


    showDashboardMessage(
      "เกิดข้อผิดพลาดขณะบันทึกข้อมูล",
      "error"
    );


  } finally {

    setStudentSaveLoading(
      false
    );

  }

}


/*******************************************************
 * SET STUDENT SAVE LOADING
 *******************************************************/

function setStudentSaveLoading(
  loading
) {

  const button =
    document.getElementById(
      "saveStudentBtn"
    );


  if (!button) {

    return;

  }


  button.disabled =
    loading;


  if (loading) {

    button.textContent =
      "กำลังบันทึก...";

  } else {

    button.textContent =
      "บันทึกนักศึกษา";

  }

}


/*******************************************************
 * RESET STUDENT PASSWORD
 *******************************************************/

async function resetStudentPassword(
  studentId
) {

  if (!studentId) {

    return;

  }


  const student =
    ADMIN_DASHBOARD_STATE
      .students
      .find(
        function (item) {

          return String(
            item.student_id
          ) === String(
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
    window.confirm(

      "ต้องการรีเซ็ตรหัสผ่านนักศึกษา\n\n" +

      "รหัสนักศึกษา: " +
      studentId +

      (
        name
          ? "\nชื่อ: " + name
          : ""
      ) +

      "\n\nระบบจะใช้รหัสผ่านเริ่มต้น"

    );


  if (!confirmed) {

    return;

  }


  const newPassword =
    window.prompt(
      "กรุณากำหนดรหัสผ่านใหม่\n\nหากเว้นว่าง ระบบจะใช้ 123456",
      "123456"
    );


  if (
    newPassword === null
  ) {

    return;

  }


  const password =
    String(
      newPassword || "123456"
    );


  if (
    password.length < 4
  ) {

    showDashboardMessage(
      "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร",
      "error"
    );

    return;

  }


  try {

    const result =
      await apiRequest({

        action:
          "adminResetStudentPassword",

        token:
          getAdminToken(),

        student_id:
          studentId,

        newPassword:
          password

      });


    console.log(
      "RESET STUDENT PASSWORD RESULT",
      result
    );


    if (
      handleSessionExpired(
        result
      )
    ) {

      return;

    }


    if (
      !result ||
      !result.success
    ) {

      showDashboardMessage(
        result &&
        result.message
          ? result.message
          : "รีเซ็ตรหัสผ่านไม่สำเร็จ",
        "error"
      );

      return;

    }


    showDashboardMessage(
      "รีเซ็ตรหัสผ่านสำเร็จ",
      "success"
    );


  } catch (error) {

    console.error(
      "RESET PASSWORD ERROR",
      error
    );


    showDashboardMessage(
      "เกิดข้อผิดพลาดขณะรีเซ็ตรหัสผ่าน",
      "error"
    );

  }

}


/*******************************************************
 * LOAD RESET REQUESTS
 *******************************************************/

async function loadResetRequests() {

  /*
   * หน้า Dashboard ปัจจุบันของคุณ
   * อาจยังไม่มี table สำหรับ Requests
   *
   * ถ้าไม่มี element ให้ยังโหลด API ได้
   */

  try {

    const token =
      getAdminToken();


    if (!token) {

      return;

    }


    ADMIN_DASHBOARD_STATE
      .isLoadingResetRequests = true;


    const result =
      await apiRequest({

        action:
          "adminGetResetRequests",

        token:
          token

      });


    console.log(
      "RESET REQUESTS RESULT",
      result
    );


    if (
      handleSessionExpired(
        result
      )
    ) {

      return;

    }


    if (
      result &&
      result.success
    ) {

      ADMIN_DASHBOARD_STATE
        .resetRequests =
          Array.isArray(
            result.requests
          )
            ? result.requests
            : [];

      renderResetRequests();

    }


  } catch (error) {

    console.error(
      "LOAD RESET REQUESTS ERROR",
      error
    );

  } finally {

    ADMIN_DASHBOARD_STATE
      .isLoadingResetRequests = false;

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


  /*
   * ถ้า Dashboard ยังไม่มีส่วนนี้
   * ไม่ต้องทำอะไร
   */

  if (!tbody) {

    return;

  }


  const requests =
    ADMIN_DASHBOARD_STATE
      .resetRequests || [];


  if (
    requests.length === 0
  ) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="7"
          style="text-align:center;"
        >
          ไม่มีคำร้อง
        </td>

      </tr>

    `;

    return;

  }


  tbody.innerHTML =
    requests
      .map(
        function (request) {

          return `

            <tr>

              <td>
                ${escapeHtml(
                  request.request_id || "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  request.student_id || "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  request.reason ||
                  request.note ||
                  "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  request.status || "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  request.requested_at || "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  request.processed_at || "-"
                )}
              </td>

              <td>

                ${createResetRequestButtons(
                  request
                )}

              </td>

            </tr>

          `;

        }
      )
      .join("");


  bindResetRequestButtons();

}


/*******************************************************
 * CREATE RESET REQUEST BUTTONS
 *******************************************************/

function createResetRequestButtons(
  request
) {

  const status =
    String(
      request.status || ""
    )
    .toUpperCase();


  if (
    status !== "PENDING"
  ) {

    return "-";

  }


  const requestId =
    escapeAttribute(
      request.request_id || ""
    );


  return `

    <button
      type="button"
      class="action-btn approve-reset-btn"
      data-request-id="${requestId}"
    >
      อนุมัติ
    </button>


    <button
      type="button"
      class="action-btn reject-reset-btn"
      data-request-id="${requestId}"
    >
      ปฏิเสธ
    </button>

  `;

}


/*******************************************************
 * BIND RESET REQUEST BUTTONS
 *******************************************************/

function bindResetRequestButtons() {

  document
    .querySelectorAll(
      ".approve-reset-btn"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            approveResetRequest(
              button.dataset.requestId
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".reject-reset-btn"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            rejectResetRequest(
              button.dataset.requestId
            );

          }
        );

      }
    );

}


/*******************************************************
 * APPROVE RESET
 *******************************************************/

async function approveResetRequest(
  requestId
) {

  if (!requestId) {

    return;

  }


  if (
    !window.confirm(
      "ต้องการอนุมัติคำร้องนี้หรือไม่?"
    )
  ) {

    return;

  }


  try {

    const result =
      await apiRequest({

        action:
          "adminApproveReset",

        token:
          getAdminToken(),

        request_id:
          requestId

      });


    if (
      handleSessionExpired(
        result
      )
    ) {

      return;

    }


    if (
      !result ||
      !result.success
    ) {

      showDashboardMessage(
        result &&
        result.message
          ? result.message
          : "อนุมัติไม่สำเร็จ",
        "error"
      );

      return;

    }


    showDashboardMessage(
      "อนุมัติคำร้องสำเร็จ",
      "success"
    );


    await loadResetRequests();


  } catch (error) {

    console.error(
      "APPROVE RESET ERROR",
      error
    );


    showDashboardMessage(
      "เกิดข้อผิดพลาด",
      "error"
    );

  }

}


/*******************************************************
 * REJECT RESET
 *******************************************************/

async function rejectResetRequest(
  requestId
) {

  if (!requestId) {

    return;

  }


  if (
    !window.confirm(
      "ต้องการปฏิเสธคำร้องนี้หรือไม่?"
    )
  ) {

    return;

  }


  try {

    const result =
      await apiRequest({

        action:
          "adminRejectReset",

        token:
          getAdminToken(),

        request_id:
          requestId

      });


    if (
      handleSessionExpired(
        result
      )
    ) {

      return;

    }


    if (
      !result ||
      !result.success
    ) {

      showDashboardMessage(
        result &&
        result.message
          ? result.message
          : "ปฏิเสธไม่สำเร็จ",
        "error"
      );

      return;

    }


    showDashboardMessage(
      "ปฏิเสธคำร้องสำเร็จ",
      "success"
    );


    await loadResetRequests();


  } catch (error) {

    console.error(
      "REJECT RESET ERROR",
      error
    );


    showDashboardMessage(
      "เกิดข้อผิดพลาด",
      "error"
    );

  }

}


/*******************************************************
 * LOAD STAFF
 *******************************************************/

async function loadStaff() {

  const tbody =
    document.getElementById(
      "staffTableBody"
    );


  /*
   * ไม่มี Staff table
   */

  if (!tbody) {

    return;

  }


  try {

    const result =
      await apiRequest({

        action:
          "adminGetStaff",

        token:
          getAdminToken()

      });


    console.log(
      "STAFF RESULT",
      result
    );


    if (
      handleSessionExpired(
        result
      )
    ) {

      return;

    }


    if (
      !result ||
      !result.success
    ) {

      tbody.innerHTML = `

        <tr>

          <td
            colspan="5"
            style="text-align:center;"
          >
            ยังไม่สามารถโหลด Staff ได้
          </td>

        </tr>

      `;

      return;

    }


    ADMIN_DASHBOARD_STATE
      .staff =
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
          style="text-align:center;"
        >
          ไม่สามารถโหลดข้อมูล Staff ได้
        </td>

      </tr>

    `;

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


  const staff =
    ADMIN_DASHBOARD_STATE
      .staff || [];


  if (
    staff.length === 0
  ) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="5"
          style="text-align:center;"
        >
          ไม่พบข้อมูล Staff
        </td>

      </tr>

    `;

    return;

  }


  tbody.innerHTML =
    staff
      .map(
        function (item) {

          return `

            <tr>

              <td>
                ${escapeHtml(
                  item.admin_id || "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  item.username || "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  item.name || "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  item.role || "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  item.status || "-"
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


  modal.classList.add(
    "show"
  );

}


/*******************************************************
 * CLOSE STAFF MODAL
 *******************************************************/

function closeStaffModalWindow() {

  const modal =
    document.getElementById(
      "staffModal"
    );


  if (!modal) {

    return;

  }


  modal.classList.remove(
    "show"
  );


  const form =
    document.getElementById(
      "staffForm"
    );


  if (form) {

    form.reset();

  }

}


/*******************************************************
 * STAFF FORM
 *******************************************************/

async function handleStaffFormSubmit(
  event
) {

  event.preventDefault();


  const username =
    getInputValue(
      "staffUsername"
    ).trim();


  const password =
    getInputValue(
      "staffPassword"
    );


  const name =
    getInputValue(
      "staffName"
    ).trim();


  const role =
    getInputValue(
      "staffRole"
    ) || "STAFF";


  const status =
    getInputValue(
      "staffStatus"
    ) || "ACTIVE";


  if (!username) {

    showDashboardMessage(
      "กรุณากรอก Username",
      "error"
    );

    return;

  }


  if (!password) {

    showDashboardMessage(
      "กรุณากรอกรหัสผ่าน",
      "error"
    );

    return;

  }


  if (!name) {

    showDashboardMessage(
      "กรุณากรอกชื่อ Staff",
      "error"
    );

    return;

  }


  const button =
    document.getElementById(
      "saveStaffBtn"
    );


  if (button) {

    button.disabled = true;

    button.textContent =
      "กำลังบันทึก...";

  }


  try {

    const result =
      await apiRequest({

        action:
          "adminAddStaff",

        token:
          getAdminToken(),

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


    console.log(
      "ADD STAFF RESULT",
      result
    );


    if (
      handleSessionExpired(
        result
      )
    ) {

      return;

    }


    if (
      !result ||
      !result.success
    ) {

      showDashboardMessage(
        result &&
        result.message
          ? result.message
          : "เพิ่ม Staff ไม่สำเร็จ",
        "error"
      );

      return;

    }


    showDashboardMessage(
      "เพิ่ม Staff สำเร็จ",
      "success"
    );


    closeStaffModalWindow();


    await loadStaff();


  } catch (error) {

    console.error(
      "ADD STAFF ERROR",
      error
    );


    showDashboardMessage(
      "เกิดข้อผิดพลาดขณะเพิ่ม Staff",
      "error"
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "บันทึก Staff";

    }

  }

}


/*******************************************************
 * LOGOUT
 *******************************************************/

async function handleAdminLogout() {

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
        "ADMIN LOGOUT API ERROR",
        error
      );

    }

  }


  /*
   * ล้าง Local Session
   */

  clearAdminSession();


  /*
   * ไป Login
   */

  redirectToAdminLogin();

}


/*******************************************************
 * REDIRECT ADMIN LOGIN
 *******************************************************/

function redirectToAdminLogin() {

  window.location.replace(
    CONFIG.ADMIN_LOGIN_PAGE
  );

}


/*******************************************************
 * SESSION EXPIRED
 *******************************************************/

function handleSessionExpired(
  result
) {

  if (!result) {

    return false;

  }


  if (
    result.code ===
    "ADMIN_SESSION_EXPIRED"
  ) {

    clearAdminSession();


    alert(
      "Session ของ Admin หมดอายุ กรุณาเข้าสู่ระบบใหม่"
    );


    redirectToAdminLogin();


    return true;

  }


  return false;

}


/*******************************************************
 * SET STUDENTS LOADING
 *******************************************************/

function setStudentsLoading(
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
          colspan="8"
          style="text-align:center;"
        >
          กำลังโหลดข้อมูลนักศึกษา...
        </td>

      </tr>

    `;

  }

}


/*******************************************************
 * STUDENTS ERROR
 *******************************************************/

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
        colspan="8"
        style="text-align:center;color:#dc2626;"
      >
        ไม่สามารถโหลดข้อมูลนักศึกษาได้
      </td>

    </tr>

  `;

}


/*******************************************************
 * DASHBOARD MESSAGE
 *******************************************************/

function showDashboardMessage(
  text,
  type
) {

  const box =
    document.getElementById(
      "messageBox"
    );


  if (!box) {

    console.log(
      "DASHBOARD MESSAGE:",
      text
    );

    return;

  }


  box.textContent =
    text;


  box.className =
    "message-box";


  if (type) {

    box.classList.add(
      type
    );

  }


  /*
   * ซ่อนข้อความสำเร็จอัตโนมัติ
   */

  setTimeout(
    function () {

      if (
        box.textContent === text
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


/*******************************************************
 * INPUT HELPERS
 *******************************************************/

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


  return element.value || "";

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


/*******************************************************
 * DATE FORMAT
 *******************************************************/

function formatDisplayDate(
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
   * ถ้าเป็น yyyy-MM-dd
   */

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {

    const parts =
      text.split("-");


    return (
      parts[2] +
      "/" +
      parts[1] +
      "/" +
      parts[0]
    );

  }


  /*
   * ถ้าเป็น dd/MM/yyyy
   */

  if (
    /^\d{2}\/\d{2}\/\d{4}/.test(
      text
    )
  ) {

    return text;

  }


  return text;

}


/*******************************************************
 * DATE TO INPUT
 *******************************************************/

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


  return "";

}


/*******************************************************
 * STATUS CLASS
 *******************************************************/

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
    "DISABLED"
  ) {

    return "status-disabled";

  }


  return "status-active";

}


/*******************************************************
 * HTML ESCAPE
 *******************************************************/

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


/*******************************************************
 * ATTRIBUTE ESCAPE
 *******************************************************/

function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


/*******************************************************
 * GLOBAL ADMIN DASHBOARD API
 *******************************************************/

window.adminDashboard = {

  loadStudents:
    loadStudents,

  loadResetRequests:
    loadResetRequests,

  loadStaff:
    loadStaff,

  editStudent:
    editStudent,

  resetStudentPassword:
    resetStudentPassword,

  openStudentModal:
    openStudentModal,

  closeStudentModal:
    closeStudentModalWindow,

  openStaffModal:
    openStaffModal,

  closeStaffModal:
    closeStaffModalWindow,

  logout:
    handleAdminLogout,

  debugSession:
    function () {

      if (
        typeof debugAdminSession ===
        "function"
      ) {

        debugAdminSession();

      }

    }

};
