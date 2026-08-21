/*******************************************************
 * STUDENT CARD SYSTEM
 * js/admin-dashboard.js
 *
 * ADMIN DASHBOARD
 *
 * รองรับ:
 * - ตรวจสอบ Admin Session
 * - โหลดนักศึกษา
 * - ค้นหานักศึกษา
 * - เพิ่มนักศึกษา
 * - แก้ไขนักศึกษา
 * - รีเซ็ตรหัสผ่านนักศึกษา
 * - โหลด Staff
 * - เพิ่ม Staff
 * - Logout
 *******************************************************/


/* =====================================================
   CONFIG
===================================================== */

const ADMIN_DASHBOARD_CONFIG = {

  API_URL:
    "https://script.google.com/macros/s/AKfycbxCvk2wb6FydCKNkEDvApbTgZWmSFoAzPvvM2sSDOIwSgvftMoQxIX3cy7npP3_6xT4/exec",

  ADMIN_SESSION_KEY:
    "admin_session",

  ADMIN_DATA_KEY:
    "admin_data"

};


/* =====================================================
   GLOBAL DATA
===================================================== */

let students = [];

let staffList = [];

let currentEditStudent = null;


/* =====================================================
   DOM READY
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initializeAdminDashboard();

  }
);


/* =====================================================
   INITIALIZE
===================================================== */

async function initializeAdminDashboard() {

  setupSidebar();

  setupButtons();

  setupModals();

  setupSearch();

  loadAdminInformation();

  /*
   * ตรวจ Session ก่อนโหลดข้อมูล
   */

  const token =
    getAdminToken();


  if (!token) {

    redirectToAdminLogin();

    return;

  }


  /*
   * ตรวจสอบ Session กับ Server
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

}


/* =====================================================
   GET ADMIN TOKEN
===================================================== */

function getAdminToken() {

  return String(

    sessionStorage.getItem(
      ADMIN_DASHBOARD_CONFIG.ADMIN_SESSION_KEY
    ) || ""

  ).trim();

}


/* =====================================================
   GET ADMIN DATA
===================================================== */

function getAdminData() {

  try {

    const value =
      sessionStorage.getItem(
        ADMIN_DASHBOARD_CONFIG.ADMIN_DATA_KEY
      );


    if (!value) {

      return null;

    }


    return JSON.parse(value);

  } catch (error) {

    console.error(
      "ADMIN DATA ERROR",
      error
    );

    return null;

  }

}


/* =====================================================
   LOAD ADMIN INFORMATION
===================================================== */

function loadAdminInformation() {

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

    redirectToAdminLogin();

    return false;

  }


  try {

    const result =
      await apiRequest({

        action:
          "adminGetStudents",

        token:
          token,

        search:
          ""

      });


    if (
      !result ||
      !result.success
    ) {

      if (
        result &&
        (
          result.code ===
            "ADMIN_SESSION_EXPIRED" ||

          result.code ===
            "ADMIN_SESSION_INVALID"
        )
      ) {

        clearAdminSession();

        redirectToAdminLogin();

        return false;

      }

    }


    return true;


  } catch (error) {

    console.error(
      "VERIFY ADMIN SESSION ERROR",
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

async function apiRequest(data) {

  const response =
    await fetch(

      ADMIN_DASHBOARD_CONFIG.API_URL,

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


  return await response.json();

}


/* =====================================================
   SETUP SIDEBAR
===================================================== */

function setupSidebar() {

  const menuButtons =
    document.querySelectorAll(
      "[data-section]"
    );


  menuButtons.forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          const section =
            button.dataset.section;


          switchSection(
            section
          );

        }
      );

    }
  );


  /*
   * Mobile sidebar
   */

  const sidebarToggle =
    document.getElementById(
      "sidebarToggle"
    );


  const sidebar =
    document.querySelector(
      ".admin-sidebar"
    );


  if (
    sidebarToggle &&
    sidebar
  ) {

    sidebarToggle.addEventListener(
      "click",
      function () {

        sidebar.classList.toggle(
          "show"
        );

      }
    );

  }

}


/* =====================================================
   SWITCH SECTION
===================================================== */

function switchSection(section) {

  const sections =
    document.querySelectorAll(
      "[data-page-section]"
    );


  sections.forEach(
    function (item) {

      item.style.display =
        "none";

    }
  );


  const target =
    document.querySelector(
      '[data-page-section="' +
      section +
      '"]'
    );


  if (target) {

    target.style.display =
      "block";

  }


  /*
   * Active menu
   */

  const menuButtons =
    document.querySelectorAll(
      "[data-section]"
    );


  menuButtons.forEach(
    function (button) {

      button.classList.remove(
        "active"
      );

    }
  );


  const activeButton =
    document.querySelector(
      '[data-section="' +
      section +
      '"]'
    );


  if (activeButton) {

    activeButton.classList.add(
      "active"
    );

  }


  /*
   * ปิด Sidebar บนมือถือ
   */

  const sidebar =
    document.querySelector(
      ".admin-sidebar"
    );


  if (sidebar) {

    sidebar.classList.remove(
      "show"
    );

  }

}


/* =====================================================
   SETUP BUTTONS
===================================================== */

function setupButtons() {

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
   * Add student
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
   * Add staff
   */

  const addStaffBtn =
    document.getElementById(
      "addStaffBtn"
    );


  if (addStaffBtn) {

    addStaffBtn.addEventListener(
      "click",
      function () {

        openStaffModal();

      }
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
   * Staff form
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
   * Reset password
   */

  const resetPasswordBtn =
    document.getElementById(
      "resetStudentPasswordBtn"
    );


  if (resetPasswordBtn) {

    resetPasswordBtn.addEventListener(
      "click",
      handleResetStudentPassword
    );

  }

}


/* =====================================================
   SETUP MODALS
===================================================== */

function setupModals() {

  const studentModal =
    document.getElementById(
      "studentModal"
    );


  const staffModal =
    document.getElementById(
      "staffModal"
    );


  /*
   * Student close buttons
   */

  [
    "closeStudentModal",
    "closeStudentModal2"
  ]
  .forEach(
    function (id) {

      const button =
        document.getElementById(id);


      if (button) {

        button.addEventListener(
          "click",
          function () {

            closeStudentModal();

          }
        );

      }

    }
  );


  /*
   * Staff close buttons
   */

  [
    "closeStaffModal",
    "closeStaffModal2"
  ]
  .forEach(
    function (id) {

      const button =
        document.getElementById(id);


      if (button) {

        button.addEventListener(
          "click",
          function () {

            closeStaffModal();

          }
        );

      }

    }
  );


  /*
   * Click outside modal
   */

  if (studentModal) {

    studentModal.addEventListener(
      "click",
      function (event) {

        if (
          event.target ===
          studentModal
        ) {

          closeStudentModal();

        }

      }
    );

  }


  if (staffModal) {

    staffModal.addEventListener(
      "click",
      function (event) {

        if (
          event.target ===
          staffModal
        ) {

          closeStaffModal();

        }

      }
    );

  }

}


/* =====================================================
   SETUP SEARCH
===================================================== */

function setupSearch() {

  const search =
    document.getElementById(
      "studentSearch"
    );


  if (!search) {

    return;

  }


  search.addEventListener(
    "input",
    function () {

      renderStudents(
        search.value
      );

    }
  );

}


/* =====================================================
   LOAD STUDENTS
===================================================== */

async function loadStudents() {

  const token =
    getAdminToken();


  if (!token) {

    redirectToAdminLogin();

    return;

  }


  setTableLoading(
    "studentsTableBody",
    8
  );


  try {

    const result =
      await apiRequest({

        action:
          "adminGetStudents",

        token:
          token,

        search:
          ""

      });


    if (
      !result ||
      !result.success
    ) {

      handleApiError(
        result
      );

      return;

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


    setTableMessage(
      "studentsTableBody",
      8,
      "ไม่สามารถโหลดข้อมูลนักศึกษาได้"
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
    students.slice();


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


  tbody.innerHTML = "";


  if (!list.length) {

    setTableMessage(
      "studentsTableBody",
      8,
      "ไม่พบข้อมูลนักศึกษา"
    );

    return;

  }


  list.forEach(
    function (student) {

      const tr =
        document.createElement(
          "tr"
        );


      tr.innerHTML = `

        <td>
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
          <span class="status-badge">
            ${escapeHtml(
              student.status
            )}
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

        <td class="action-cell">

          <button
            type="button"
            class="edit-btn"
            data-student-id="${escapeHtml(
              student.student_id
            )}"
          >
            แก้ไข
          </button>

          <button
            type="button"
            class="reset-btn"
            data-reset-student-id="${escapeHtml(
              student.student_id
            )}"
          >
            รีเซ็ตรหัสผ่าน
          </button>

        </td>

      `;


      tbody.appendChild(
        tr
      );


      /*
       * Edit
       */

      const editButton =
        tr.querySelector(
          ".edit-btn"
        );


      if (editButton) {

        editButton.addEventListener(
          "click",
          function () {

            const id =
              editButton.dataset.studentId;


            editStudent(
              id
            );

          }
        );

      }


      /*
       * Reset
       */

      const resetButton =
        tr.querySelector(
          ".reset-btn"
        );


      if (resetButton) {

        resetButton.addEventListener(
          "click",
          function () {

            const id =
              resetButton.dataset.resetStudentId;


            resetStudentPassword(
              id
            );

          }
        );

      }

    }
  );

}


/* =====================================================
   OPEN STUDENT MODAL
===================================================== */

function openStudentModal(
  student
) {

  currentEditStudent =
    student || null;


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


  setValue(
    "studentId",
    student
      ? student.student_id
      : ""
  );


  const studentId =
    document.getElementById(
      "studentId"
    );


  if (studentId) {

    studentId.readOnly =
      !!student;

  }


  setValue(
    "studentPassword",
    student
      ? ""
      : "123456"
  );


  setValue(
    "studentPrefix",
    student
      ? student.prefix_th
      : ""
  );


  setValue(
    "studentFirstnameTh",
    student
      ? student.firstname_th
      : ""
  );


  setValue(
    "studentLastnameTh",
    student
      ? student.lastname_th
      : ""
  );


  setValue(
    "studentFirstnameEn",
    student
      ? student.firstname_en
      : ""
  );


  setValue(
    "studentLastnameEn",
    student
      ? student.lastname_en
      : ""
  );


  setValue(
    "studentDepartment",
    student
      ? student.department
      : ""
  );


  setValue(
    "studentPhone",
    student
      ? student.phone
      : ""
  );


  setValue(
    "studentStatus",
    student
      ? student.status
      : "นักศึกษาปกติ"
  );


  setValue(
    "studentIssueDate",
    convertToInputDate(
      student
        ? student.issue_date
        : ""
    )
  );


  setValue(
    "studentExpireDate",
    convertToInputDate(
      student
        ? student.expire_date
        : ""
    )
  );


  setValue(
    "studentPhoto",
    student
      ? student.photo_url
      : ""
  );


  /*
   * แสดงปุ่ม reset เฉพาะตอนแก้ไข
   */

  const resetButton =
    document.getElementById(
      "resetStudentPasswordBtn"
    );


  if (resetButton) {

    resetButton.style.display =
      student
        ? "inline-block"
        : "none";

  }


  modal.classList.add(
    "show"
  );

}


/* =====================================================
   CLOSE STUDENT MODAL
===================================================== */

function closeStudentModal() {

  const modal =
    document.getElementById(
      "studentModal"
    );


  if (modal) {

    modal.classList.remove(
      "show"
    );

  }


  currentEditStudent =
    null;

}


/* =====================================================
   EDIT STUDENT
===================================================== */

function editStudent(
  studentId
) {

  const student =
    students.find(
      function (item) {

        return String(
          item.student_id
        ) === String(
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


  openStudentModal(
    student
  );

}


/* =====================================================
   HANDLE STUDENT SUBMIT
===================================================== */

async function handleStudentSubmit(
  event
) {

  event.preventDefault();


  const token =
    getAdminToken();


  if (!token) {

    redirectToAdminLogin();

    return;

  }


  const isEdit =
    !!currentEditStudent;


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


  if (
    !isEdit &&
    !password
  ) {

    showMessage(
      "กรุณากำหนดรหัสผ่าน",
      "error"
    );

    return;

  }


  const button =
    document.getElementById(
      "saveStudentBtn"
    );


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "กำลังบันทึก...";

  }


  try {

    let result;


    if (isEdit) {

      /*
       * แก้ไขข้อมูล
       */

      result =
        await apiRequest({

          action:
            "adminUpdateStudent",

          token:
            token,

          student_id:
            studentId,

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

        });


    } else {

      /*
       * เพิ่มนักศึกษา
       */

      result =
        await apiRequest({

          action:
            "adminCreateStudent",

          token:
            token,

          student_id:
            studentId,

          password:
            password,

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

        });

    }


    if (
      !result ||
      !result.success
    ) {

      handleApiError(
        result
      );

      return;

    }


    showMessage(
      isEdit
        ? "แก้ไขข้อมูลนักศึกษาสำเร็จ"
        : "เพิ่มนักศึกษาสำเร็จ",
      "success"
    );


    closeStudentModal();


    await loadStudents();


  } catch (error) {

    console.error(
      "SAVE STUDENT ERROR",
      error
    );


    showMessage(
      "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      "error"
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "บันทึกนักศึกษา";

    }

  }

}


/* =====================================================
   RESET STUDENT PASSWORD
===================================================== */

async function resetStudentPassword(
  studentId
) {

  const student =
    students.find(
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
          student.prefix_th,
          student.firstname_th,
          student.lastname_th
        ]
        .filter(Boolean)
        .join(" ")

      : studentId;


  const newPassword =
    prompt(

      "กำหนดรหัสผ่านใหม่สำหรับ\n" +
      name +
      "\n\n" +
      "กรุณากรอกรหัสผ่านใหม่:",

      "123456"

    );


  if (
    newPassword === null
  ) {

    return;

  }


  if (
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

    redirectToAdminLogin();

    return;

  }


  try {

    const result =
      await apiRequest({

        action:
          "adminResetStudentPassword",

        token:
          token,

        student_id:
          studentId,

        newPassword:
          newPassword

      });


    /*
     * รองรับ Code.gs เวอร์ชันที่
     * ใช้ action adminResetPassword
     * กับ request_id
     *
     * ถ้า API ใหม่รองรับ student_id
     * จะใช้ด้านบน
     */

    if (
      !result ||
      !result.success
    ) {

      /*
       * แสดงข้อความจาก Server
       */

      handleApiError(
        result
      );

      return;

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
      "ไม่สามารถรีเซ็ตรหัสผ่านได้",
      "error"
    );

  }

}


/* =====================================================
   HANDLE RESET FROM MODAL
===================================================== */

async function handleResetStudentPassword() {

  if (
    !currentEditStudent
  ) {

    return;

  }


  await resetStudentPassword(

    currentEditStudent.student_id

  );

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


  resetForm(
    "staffForm"
  );


  setValue(
    "staffRole",
    "STAFF"
  );


  setValue(
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

function closeStaffModal() {

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
   HANDLE STAFF SUBMIT
===================================================== */

async function handleStaffSubmit(
  event
) {

  event.preventDefault();


  const token =
    getAdminToken();


  if (!token) {

    redirectToAdminLogin();

    return;

  }


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


  const role =
    getValue(
      "staffRole"
    );


  const status =
    getValue(
      "staffStatus"
    );


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


  const button =
    document.getElementById(
      "saveStaffBtn"
    );


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "กำลังบันทึก...";

  }


  try {

    const result =
      await apiRequest({

        action:
          "adminCreateStaff",

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

      handleApiError(
        result
      );

      return;

    }


    showMessage(
      "เพิ่ม Staff สำเร็จ",
      "success"
    );


    closeStaffModal();


    await loadStaff();


  } catch (error) {

    console.error(
      "CREATE STAFF ERROR",
      error
    );


    showMessage(
      "ไม่สามารถเพิ่ม Staff ได้",
      "error"
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "บันทึก Staff";

    }

  }

}


/* =====================================================
   LOAD STAFF
===================================================== */

async function loadStaff() {

  const token =
    getAdminToken();


  if (!token) {

    return;

  }


  setTableLoading(
    "staffTableBody",
    5
  );


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

      /*
       * ถ้า Code.gs รุ่นปัจจุบัน
       * ยังไม่มี adminGetStaff
       * ไม่ทำให้ Dashboard พัง
       */

      setTableMessage(
        "staffTableBody",
        5,
        "ยังไม่มี API สำหรับโหลด Staff"
      );

      return;

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


    setTableMessage(
      "staffTableBody",
      5,
      "ไม่สามารถโหลดข้อมูล Staff ได้"
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


  tbody.innerHTML = "";


  if (!staffList.length) {

    setTableMessage(
      "staffTableBody",
      5,
      "ไม่พบข้อมูล Staff"
    );

    return;

  }


  staffList.forEach(
    function (staff) {

      const tr =
        document.createElement(
          "tr"
        );


      tr.innerHTML = `

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
          <span class="status-badge">
            ${escapeHtml(
              staff.status
            )}
          </span>
        </td>

      `;


      tbody.appendChild(
        tr
      );

    }
  );

}


/* =====================================================
   LOGOUT
===================================================== */

async function handleAdminLogout() {

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

    console.error(
      "LOGOUT ERROR",
      error
    );

  }


  clearAdminSession();


  redirectToAdminLogin();

}


/* =====================================================
   CLEAR SESSION
===================================================== */

function clearAdminSession() {

  sessionStorage.removeItem(
    ADMIN_DASHBOARD_CONFIG.ADMIN_SESSION_KEY
  );

  sessionStorage.removeItem(
    ADMIN_DASHBOARD_CONFIG.ADMIN_DATA_KEY
  );

}


/* =====================================================
   REDIRECT LOGIN
===================================================== */

function redirectToAdminLogin() {

  window.location.replace(
    "admin-login.html"
  );

}


/* =====================================================
   HANDLE API ERROR
===================================================== */

function handleApiError(
  result
) {

  if (!result) {

    showMessage(
      "ไม่พบการตอบกลับจาก Server",
      "error"
    );

    return;

  }


  if (
    result.code ===
      "ADMIN_SESSION_EXPIRED" ||

    result.code ===
      "ADMIN_SESSION_INVALID"
  ) {

    clearAdminSession();

    alert(
      "Session ของ Admin หมดอายุ กรุณาเข้าสู่ระบบใหม่"
    );


    redirectToAdminLogin();

    return;

  }


  showMessage(

    result.message ||
    "เกิดข้อผิดพลาด",

    "error"

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


  /*
   * ซ่อนอัตโนมัติ
   */

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
   TABLE LOADING
===================================================== */

function setTableLoading(
  tbodyId,
  colspan
) {

  const tbody =
    document.getElementById(
      tbodyId
    );


  if (!tbody) {

    return;

  }


  tbody.innerHTML = `

    <tr>

      <td colspan="${colspan}">
        กำลังโหลด...
      </td>

    </tr>

  `;

}


/* =====================================================
   TABLE MESSAGE
===================================================== */

function setTableMessage(
  tbodyId,
  colspan,
  message
) {

  const tbody =
    document.getElementById(
      tbodyId
    );


  if (!tbody) {

    return;

  }


  tbody.innerHTML = `

    <tr>

      <td colspan="${colspan}">
        ${escapeHtml(message)}
      </td>

    </tr>

  `;

}


/* =====================================================
   GET VALUE
===================================================== */

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
    element.value || ""
  );

}


/* =====================================================
   SET VALUE
===================================================== */

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


/* =====================================================
   RESET FORM
===================================================== */

function resetForm(
  formId
) {

  const form =
    document.getElementById(
      formId
    );


  if (form) {

    form.reset();

  }

}


/* =====================================================
   FORMAT DATE
===================================================== */

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


  /*
   * ถ้าเป็น dd/MM/yyyy HH:mm:ss
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
   * ถ้าเป็น yyyy-MM-dd
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


/* =====================================================
   CONVERT DATE TO INPUT
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


  return "";

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
   DEBUG
===================================================== */

window.AdminDashboard = {

  loadStudents:
    loadStudents,

  loadStaff:
    loadStaff,

  editStudent:
    editStudent,

  resetStudentPassword:
    resetStudentPassword,

  openStudentModal:
    openStudentModal,

  openStaffModal:
    openStaffModal,

  logout:
    handleAdminLogout

};
