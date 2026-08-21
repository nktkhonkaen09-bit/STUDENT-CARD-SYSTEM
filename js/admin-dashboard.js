/***************************************************************
 * STUDENT CARD SYSTEM
 * js/admin-dashboard.js
 *
 * ADMIN DASHBOARD
 *
 * รองรับ:
 * -------------------------------------------------------------
 * 1. ตรวจสอบ Admin Session
 * 2. แสดงข้อมูล Admin
 * 3. โหลดนักศึกษา
 * 4. ค้นหานักศึกษา
 * 5. เพิ่มนักศึกษา
 * 6. แก้ไขนักศึกษา
 * 7. รีเซ็ตรหัสผ่านนักศึกษา
 * 8. โหลดคำร้องลืมรหัสผ่าน
 * 9. อนุมัติคำร้อง
 * 10. ปฏิเสธคำร้อง
 * 11. โหลด Staff
 * 12. เพิ่ม Staff
 * 13. Logout
 *
 * ต้องทำงานร่วมกับ:
 *
 * admin-dashboard.html
 * js/config.js
 *
 ***************************************************************/


/***************************************************************
 * CONFIG
 ***************************************************************/

const ADMIN_DASHBOARD_CONFIG = {

  /*
   * Session ที่ admin-login.html บันทึกไว้
   */

  SESSION_KEY:
    "admin_session",

  ADMIN_KEY:
    "admin_data",


  /*
   * หน้า Login
   */

  LOGIN_PAGE:
    "admin-login.html",


  /*
   * ถ้า config.js มี API_URL
   * ระบบจะใช้ตัวนั้น
   */

  API_URL:
    typeof CONFIG !== "undefined" &&
    CONFIG.API_URL
      ? CONFIG.API_URL
      : "",


  /*
   * จำนวนรายการต่อหน้า
   */

  PAGE_SIZE:
    20

};


/***************************************************************
 * GLOBAL DATA
 ***************************************************************/

let students = [];

let filteredStudents = [];

let resetRequests = [];

let staffList = [];

let editingStudentId = "";

let currentStudentForReset = "";


/***************************************************************
 * DOM READY
 ***************************************************************/

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initializeAdminDashboard();

  }
);


/***************************************************************
 * INITIALIZE
 ***************************************************************/

async function initializeAdminDashboard() {

  try {

    /*
     * ตรวจ Session ก่อนทุกอย่าง
     */

    const token =
      getAdminToken();


    if (!token) {

      redirectToLogin();

      return;

    }


    /*
     * แสดงข้อมูล Admin จาก sessionStorage
     */

    loadAdminInfo();


    /*
     * เตรียม Event ต่าง ๆ
     */

    bindEvents();


    /*
     * เปิดเมนูแรก
     */

    initializeMenu();


    /*
     * ตรวจ Session กับ Server
     */

    const sessionResult =
      await apiRequest(
        "adminGetStudents",
        {
          token: token
        }
      );


    if (
      !sessionResult ||
      !sessionResult.success
    ) {

      if (
        isSessionExpired(
          sessionResult
        )
      ) {

        redirectToLogin();

        return;

      }

      showMessage(
        sessionResult &&
        sessionResult.message
          ? sessionResult.message
          : "ไม่สามารถตรวจสอบ Session ได้",
        "error"
      );

      return;

    }


    /*
     * ใช้ข้อมูลนักศึกษาที่โหลดมาแล้ว
     */

    students =
      Array.isArray(
        sessionResult.students
      )
        ? sessionResult.students
        : [];


    filteredStudents =
      students.slice();


    renderStudents();


    /*
     * โหลดข้อมูลส่วนอื่น
     */

    await loadResetRequests();

    await loadStaff();


  } catch (error) {

    console.error(
      "INITIALIZE ADMIN DASHBOARD ERROR:",
      error
    );


    showMessage(
      error.message ||
      "เกิดข้อผิดพลาดในการเปิด Dashboard",
      "error"
    );

  }

}


/***************************************************************
 * GET ADMIN TOKEN
 ***************************************************************/

function getAdminToken() {

  return String(

    sessionStorage.getItem(
      ADMIN_DASHBOARD_CONFIG.SESSION_KEY
    ) || ""

  ).trim();

}


/***************************************************************
 * GET ADMIN DATA
 ***************************************************************/

function getAdminData() {

  try {

    const data =
      sessionStorage.getItem(
        ADMIN_DASHBOARD_CONFIG.ADMIN_KEY
      );


    if (!data) {

      return null;

    }


    return JSON.parse(data);


  } catch (error) {

    console.error(
      "GET ADMIN DATA ERROR:",
      error
    );

    return null;

  }

}


/***************************************************************
 * LOAD ADMIN INFO
 ***************************************************************/

function loadAdminInfo() {

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


/***************************************************************
 * BIND EVENTS
 ***************************************************************/

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
   * Search Student
   */

  const searchInput =
    document.getElementById(
      "studentSearch"
    );


  if (searchInput) {

    searchInput.addEventListener(
      "input",
      function () {

        filterStudents(
          searchInput.value
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
   * Close Student Modal
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
   * Add Staff
   */

  bindClick(
    "addStaffBtn",
    openStaffModal
  );


  /*
   * Close Staff Modal
   */

  bindClick(
    "closeStaffModal",
    closeStaffModal
  );


  bindClick(
    "closeStaffModal2",
    closeStaffModal
  );


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
   * Menu
   */

  document
    .querySelectorAll(
      "[data-admin-menu]"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            const section =
              button.getAttribute(
                "data-admin-menu"
              );


            showAdminSection(
              section
            );

          }
        );

      }
    );

}


/***************************************************************
 * BIND CLICK
 ***************************************************************/

function bindClick(
  id,
  callback
) {

  const element =
    document.getElementById(id);


  if (!element) {

    return;

  }


  element.addEventListener(
    "click",
    callback
  );

}


/***************************************************************
 * INITIALIZE MENU
 ***************************************************************/

function initializeMenu() {

  /*
   * ถ้ามี data-admin-menu
   * เปิด students เป็นค่าเริ่มต้น
   */

  const firstMenu =
    document.querySelector(
      '[data-admin-menu="students"]'
    );


  if (firstMenu) {

    showAdminSection(
      "students"
    );

    return;

  }


  /*
   * ถ้า HTML รุ่นเก่าไม่มี menu
   * ไม่ต้องทำอะไร
   */

}


/***************************************************************
 * SHOW ADMIN SECTION
 ***************************************************************/

function showAdminSection(
  section
) {

  section =
    String(
      section || ""
    ).trim();


  /*
   * เปลี่ยน active menu
   */

  document
    .querySelectorAll(
      "[data-admin-menu]"
    )
    .forEach(
      function (item) {

        item.classList.toggle(
          "active",
          item.getAttribute(
            "data-admin-menu"
          ) === section
        );

      }
    );


  /*
   * ซ่อน section ทั้งหมด
   */

  document
    .querySelectorAll(
      "[data-admin-section]"
    )
    .forEach(
      function (item) {

        item.style.display =
          "none";

      }
    );


  /*
   * แสดง section ที่เลือก
   */

  const target =
    document.querySelector(
      '[data-admin-section="' +
      section +
      '"]'
    );


  if (target) {

    target.style.display =
      "";

  }


  /*
   * ถ้าเป็นนักศึกษา
   */

  if (
    section === "students"
  ) {

    renderStudents();

  }


  /*
   * ถ้าเป็น reset
   */

  if (
    section === "reset"
  ) {

    renderResetRequests();

  }


  /*
   * ถ้าเป็น staff
   */

  if (
    section === "staff"
  ) {

    renderStaff();

  }

}


/***************************************************************
 * API REQUEST
 ***************************************************************/

async function apiRequest(
  action,
  data
) {

  const apiUrl =
    ADMIN_DASHBOARD_CONFIG.API_URL;


  if (!apiUrl) {

    throw new Error(
      "ไม่พบ API_URL กรุณาตรวจสอบ js/config.js"
    );

  }


  const payload =
    Object.assign(
      {},
      data || {},
      {
        action: action
      }
    );


  const response =
    await fetch(
      apiUrl,
      {

        method:
          "POST",

        headers:
          {
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


  const result =
    await response.json();


  return result;

}


/***************************************************************
 * SESSION EXPIRED
 ***************************************************************/

function isSessionExpired(
  result
) {

  if (!result) {

    return false;

  }


  return (

    result.code ===
      "ADMIN_SESSION_EXPIRED"

    ||

    String(
      result.message || ""
    )
    .toLowerCase()
    .includes(
      "session"
    )

  );

}


/***************************************************************
 * REDIRECT LOGIN
 ***************************************************************/

function redirectToLogin() {

  sessionStorage.removeItem(
    ADMIN_DASHBOARD_CONFIG.SESSION_KEY
  );


  sessionStorage.removeItem(
    ADMIN_DASHBOARD_CONFIG.ADMIN_KEY
  );


  window.location.replace(
    ADMIN_DASHBOARD_CONFIG.LOGIN_PAGE
  );

}


/***************************************************************
 * LOGOUT
 ***************************************************************/

async function handleLogout() {

  const token =
    getAdminToken();


  try {

    if (token) {

      await apiRequest(
        "adminLogout",
        {
          token: token
        }
      );

    }

  } catch (error) {

    console.warn(
      "ADMIN LOGOUT API ERROR:",
      error
    );

  }


  sessionStorage.removeItem(
    ADMIN_DASHBOARD_CONFIG.SESSION_KEY
  );


  sessionStorage.removeItem(
    ADMIN_DASHBOARD_CONFIG.ADMIN_KEY
  );


  window.location.replace(
    ADMIN_DASHBOARD_CONFIG.LOGIN_PAGE
  );

}


/***************************************************************
 * LOAD STUDENTS
 ***************************************************************/

async function loadStudents() {

  const token =
    getAdminToken();


  if (!token) {

    redirectToLogin();

    return;

  }


  setTableLoading(
    "studentsTableBody",
    8,
    "กำลังโหลดข้อมูลนักศึกษา..."
  );


  try {

    const result =
      await apiRequest(
        "adminGetStudents",
        {
          token: token
        }
      );


    if (
      !result.success
    ) {

      if (
        isSessionExpired(
          result
        )
      ) {

        redirectToLogin();

        return;

      }


      showMessage(
        result.message ||
        "ไม่สามารถโหลดนักศึกษาได้",
        "error"
      );


      renderStudentsEmpty();

      return;

    }


    students =
      Array.isArray(
        result.students
      )
        ? result.students
        : [];


    const search =
      document
        .getElementById(
          "studentSearch"
        );


    filterStudents(
      search
        ? search.value
        : ""
    );


  } catch (error) {

    console.error(
      "LOAD STUDENTS ERROR:",
      error
    );


    showMessage(
      error.message ||
      "โหลดข้อมูลนักศึกษาไม่สำเร็จ",
      "error"
    );


    renderStudentsEmpty();

  }

}


/***************************************************************
 * FILTER STUDENTS
 ***************************************************************/

function filterStudents(
  keyword
) {

  keyword =
    String(
      keyword || ""
    )
    .trim()
    .toLowerCase();


  if (!keyword) {

    filteredStudents =
      students.slice();

  } else {

    filteredStudents =
      students.filter(
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
            keyword
          );

        }
      );

  }


  renderStudents();

}


/***************************************************************
 * RENDER STUDENTS
 ***************************************************************/

function renderStudents() {

  const tbody =
    document.getElementById(
      "studentsTableBody"
    );


  if (!tbody) {

    return;

  }


  tbody.innerHTML = "";


  if (
    !filteredStudents ||
    filteredStudents.length === 0
  ) {

    renderStudentsEmpty();

    return;

  }


  filteredStudents.forEach(
    function (student) {

      const tr =
        document.createElement(
          "tr"
        );


      /*
       * Student ID
       */

      tr.appendChild(
        createTableCell(
          student.student_id,
          "student-id"
        )
      );


      /*
       * Thai Name
       */

      tr.appendChild(
        createTableCell(
          formatThaiName(
            student
          )
        )
      );


      /*
       * English Name
       */

      tr.appendChild(
        createTableCell(
          formatEnglishName(
            student
          )
        )
      );


      /*
       * Department
       */

      tr.appendChild(
        createTableCell(
          student.department
        )
      );


      /*
       * Phone
       */

      tr.appendChild(
        createTableCell(
          student.phone
        )
      );


      /*
       * Status
       */

      tr.appendChild(
        createStatusCell(
          student.status
        )
      );


      /*
       * Issue Date
       */

      tr.appendChild(
        createTableCell(
          formatDateDisplay(
            student.issue_date
          )
        )
      );


      /*
       * Expire Date
       */

      tr.appendChild(
        createTableCell(
          formatDateDisplay(
            student.expire_date
          )
        )
      );


      /*
       * Actions
       *
       * เพิ่มท้ายตาราง
       */

      const actionCell =
        document.createElement(
          "td"
        );


      actionCell.className =
        "action-cell";


      const editButton =
        createButton(
          "แก้ไข",
          "edit-btn"
        );


      editButton.addEventListener(
        "click",
        function () {

          openStudentEditModal(
            student
          );

        }
      );


      const resetButton =
        createButton(
          "รีเซ็ตรหัสผ่าน",
          "reset-btn"
        );


      resetButton.addEventListener(
        "click",
        function () {

          resetStudentPassword(
            student
          );

        }
      );


      actionCell.appendChild(
        editButton
      );


      actionCell.appendChild(
        resetButton
      );


      tr.appendChild(
        actionCell
      );


      tbody.appendChild(
        tr
      );

    }
  );

}


/***************************************************************
 * EMPTY STUDENT
 ***************************************************************/

function renderStudentsEmpty() {

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
        style="text-align:center;"
      >
        ไม่พบข้อมูลนักศึกษา
      </td>

    </tr>

  `;

}


/***************************************************************
 * FORMAT THAI NAME
 ***************************************************************/

function formatThaiName(
  student
) {

  return [

    student.prefix_th,

    student.firstname_th,

    student.lastname_th

  ]
  .filter(Boolean)
  .join(" ");

}


/***************************************************************
 * FORMAT ENGLISH NAME
 ***************************************************************/

function formatEnglishName(
  student
) {

  return [

    student.firstname_en,

    student.lastname_en

  ]
  .filter(Boolean)
  .join(" ");

}


/***************************************************************
 * CREATE TABLE CELL
 ***************************************************************/

function createTableCell(
  value,
  className
) {

  const td =
    document.createElement(
      "td"
    );


  td.textContent =
    value == null
      ? ""
      : String(value);


  if (className) {

    td.className =
      className;

  }


  return td;

}


/***************************************************************
 * STATUS CELL
 ***************************************************************/

function createStatusCell(
  status
) {

  const td =
    document.createElement(
      "td"
    );


  const span =
    document.createElement(
      "span"
    );


  span.textContent =
    status ||
    "นักศึกษาปกติ";


  span.className =
    "status-badge";


  const upper =
    String(
      status || ""
    )
    .toUpperCase();


  if (
    upper === "INACTIVE"
  ) {

    span.classList.add(
      "inactive"
    );

  } else if (
    upper === "SUSPENDED"
  ) {

    span.classList.add(
      "suspended"
    );

  } else {

    span.classList.add(
      "active"
    );

  }


  td.appendChild(
    span
  );


  return td;

}


/***************************************************************
 * CREATE BUTTON
 ***************************************************************/

function createButton(
  text,
  className
) {

  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.textContent =
    text;


  button.className =
    className;


  return button;

}


/***************************************************************
 * FORMAT DATE
 ***************************************************************/

function formatDateDisplay(
  value
) {

  if (!value) {

    return "";

  }


  const text =
    String(value).trim();


  /*
   * ถ้าเป็น dd/MM/yyyy HH:mm:ss
   */

  if (
    /^\d{2}\/\d{2}\/\d{4}/.test(text)
  ) {

    return text.split(" ")[0];

  }


  /*
   * ถ้าเป็น yyyy-MM-dd
   */

  if (
    /^\d{4}-\d{2}-\d{2}/.test(text)
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


  return text;

}


/***************************************************************
 * OPEN STUDENT ADD MODAL
 ***************************************************************/

function openStudentModal() {

  editingStudentId =
    "";


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


  const title =
    document.querySelector(
      "#studentModal .modal-header h2"
    );


  if (title) {

    title.textContent =
      "เพิ่มนักศึกษา";

  }


  const saveButton =
    document.getElementById(
      "saveStudentBtn"
    );


  if (saveButton) {

    saveButton.textContent =
      "บันทึกนักศึกษา";

  }


  setValue(
    "studentId",
    ""
  );


  const studentIdInput =
    document.getElementById(
      "studentId"
    );


  if (studentIdInput) {

    studentIdInput.disabled =
      false;

  }


  showModal(
    "studentModal"
  );

}


/***************************************************************
 * OPEN STUDENT EDIT MODAL
 ***************************************************************/

function openStudentEditModal(
  student
) {

  if (!student) {

    return;

  }


  editingStudentId =
    String(
      student.student_id || ""
    ).trim();


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
    convertToInputDate(
      student.issue_date
    )
  );


  setValue(
    "studentExpireDate",
    convertToInputDate(
      student.expire_date
    )
  );


  setValue(
    "studentPhoto",
    student.photo_url
  );


  /*
   * ตอนแก้ไขไม่ให้แก้ student_id
   */

  const studentIdInput =
    document.getElementById(
      "studentId"
    );


  if (studentIdInput) {

    studentIdInput.disabled =
      true;

  }


  /*
   * password ไม่แก้จาก modal นี้
   */

  setValue(
    "studentPassword",
    ""
  );


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


  const title =
    document.querySelector(
      "#studentModal .modal-header h2"
    );


  if (title) {

    title.textContent =
      "แก้ไขข้อมูลนักศึกษา";

  }


  const saveButton =
    document.getElementById(
      "saveStudentBtn"
    );


  if (saveButton) {

    saveButton.textContent =
      "บันทึกการแก้ไข";

  }


  showModal(
    "studentModal"
  );

}


/***************************************************************
 * HANDLE STUDENT SUBMIT
 ***************************************************************/

async function handleStudentSubmit(
  event
) {

  event.preventDefault();


  const token =
    getAdminToken();


  if (!token) {

    redirectToLogin();

    return;

  }


  const isEdit =
    !!editingStudentId;


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


  const payload = {

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

  };


  try {

    setButtonLoading(
      "saveStudentBtn",
      true,
      isEdit
        ? "กำลังบันทึก..."
        : "กำลังเพิ่ม..."
    );


    /*
     * เพิ่มนักศึกษา
     *
     * Backend ต้องมี action:
     *
     * adminAddStudent
     */

    if (!isEdit) {

      payload.password =
        password;


      const result =
        await apiRequest(
          "adminAddStudent",
          payload
        );


      if (!result.success) {

        if (
          isSessionExpired(
            result
          )
        ) {

          redirectToLogin();

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


    } else {


      /*
       * แก้ไขนักศึกษา
       */

      const result =
        await apiRequest(
          "adminUpdateStudent",
          payload
        );


      if (!result.success) {

        if (
          isSessionExpired(
            result
          )
        ) {

          redirectToLogin();

          return;

        }


        throw new Error(
          result.message ||
          "แก้ไขข้อมูลไม่สำเร็จ"
        );

      }


      showMessage(
        "แก้ไขข้อมูลนักศึกษาสำเร็จ",
        "success"
      );

    }


    closeStudentModal();


    editingStudentId =
      "";


    /*
     * โหลดข้อมูลใหม่
     */

    await loadStudents();


  } catch (error) {

    console.error(
      "STUDENT SAVE ERROR:",
      error
    );


    showMessage(
      error.message ||
      "บันทึกข้อมูลไม่สำเร็จ",
      "error"
    );


  } finally {

    setButtonLoading(
      "saveStudentBtn",
      false,
      isEdit
        ? "บันทึกการแก้ไข"
        : "บันทึกนักศึกษา"
    );

  }

}


/***************************************************************
 * RESET STUDENT PASSWORD
 ***************************************************************/

async function resetStudentPassword(
  student
) {

  if (!student) {

    return;

  }


  const studentId =
    String(
      student.student_id || ""
    ).trim();


  if (!studentId) {

    return;

  }


  const confirmed =
    window.confirm(

      "ต้องการรีเซ็ตรหัสผ่านของ\n\n" +
      studentId +
      "\n" +
      formatThaiName(student) +
      "\n\n" +
      "หรือไม่?\n\n" +
      "รหัสผ่านใหม่จะเป็น 123456"

    );


  if (!confirmed) {

    return;

  }


  const token =
    getAdminToken();


  if (!token) {

    redirectToLogin();

    return;

  }


  try {

    const result =
      await apiRequest(
        "adminDirectResetPassword",
        {

          token:
            token,

          student_id:
            studentId,

          newPassword:
            "123456"

        }
      );


    if (!result.success) {

      if (
        isSessionExpired(
          result
        )
      ) {

        redirectToLogin();

        return;

      }


      throw new Error(
        result.message ||
        "รีเซ็ตรหัสผ่านไม่สำเร็จ"
      );

    }


    showMessage(
      "รีเซ็ตรหัสผ่าน " +
      studentId +
      " สำเร็จ รหัสผ่านใหม่คือ 123456",
      "success"
    );


  } catch (error) {

    console.error(
      "RESET STUDENT PASSWORD ERROR:",
      error
    );


    showMessage(
      error.message ||
      "รีเซ็ตรหัสผ่านไม่สำเร็จ",
      "error"
    );

  }

}


/***************************************************************
 * LOAD RESET REQUESTS
 ***************************************************************/

async function loadResetRequests() {

  const token =
    getAdminToken();


  if (!token) {

    return;

  }


  try {

    const result =
      await apiRequest(
        "adminGetResetRequests",
        {

          token:
            token

        }
      );


    if (!result.success) {

      if (
        isSessionExpired(
          result
        )
      ) {

        redirectToLogin();

        return;

      }


      console.warn(
        "RESET REQUEST ERROR:",
        result.message
      );


      return;

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
      "LOAD RESET REQUESTS ERROR:",
      error
    );

  }

}


/***************************************************************
 * RENDER RESET REQUESTS
 ***************************************************************/

function renderResetRequests() {

  /*
   * รองรับ HTML ที่อาจใช้ id เหล่านี้
   */

  const tbody =
    document.getElementById(
      "resetRequestsTableBody"
    );


  if (!tbody) {

    return;

  }


  tbody.innerHTML = "";


  if (
    !resetRequests.length
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


  resetRequests.forEach(
    function (item) {

      const tr =
        document.createElement(
          "tr"
        );


      tr.appendChild(
        createTableCell(
          item.request_id
        )
      );


      tr.appendChild(
        createTableCell(
          item.student_id
        )
      );


      tr.appendChild(
        createTableCell(
          item.reason ||
          item.note
        )
      );


      tr.appendChild(
        createTableCell(
          item.status
        )
      );


      tr.appendChild(
        createTableCell(
          item.requested_at
        )
      );


      tr.appendChild(
        createTableCell(
          item.processed_at
        )
      );


      const action =
        document.createElement(
          "td"
        );


      if (
        String(
          item.status || ""
        )
        .toUpperCase()
        === "PENDING"
      ) {

        const approve =
          createButton(
            "อนุมัติ",
            "approve-btn"
          );


        approve.addEventListener(
          "click",
          function () {

            approveResetRequest(
              item
            );

          }
        );


        const reject =
          createButton(
            "ปฏิเสธ",
            "reject-btn"
          );


        reject.addEventListener(
          "click",
          function () {

            rejectResetRequest(
              item
            );

          }
        );


        action.appendChild(
          approve
        );


        action.appendChild(
          reject
        );

      }


      tr.appendChild(
        action
      );


      tbody.appendChild(
        tr
      );

    }
  );

}


/***************************************************************
 * APPROVE RESET REQUEST
 ***************************************************************/

async function approveResetRequest(
  request
) {

  if (!request) {

    return;

  }


  const confirmed =
    window.confirm(
      "ต้องการอนุมัติคำร้อง " +
      request.request_id +
      " หรือไม่?"
    );


  if (!confirmed) {

    return;

  }


  const token =
    getAdminToken();


  try {

    const result =
      await apiRequest(
        "adminApproveReset",
        {

          token:
            token,

          request_id:
            request.request_id

        }
      );


    if (!result.success) {

      if (
        isSessionExpired(
          result
        )
      ) {

        redirectToLogin();

        return;

      }


      throw new Error(
        result.message ||
        "อนุมัติไม่สำเร็จ"
      );

    }


    showMessage(
      "อนุมัติคำร้องสำเร็จ",
      "success"
    );


    await loadResetRequests();


  } catch (error) {

    console.error(
      "APPROVE RESET ERROR:",
      error
    );


    showMessage(
      error.message ||
      "อนุมัติไม่สำเร็จ",
      "error"
    );

  }

}


/***************************************************************
 * REJECT RESET REQUEST
 ***************************************************************/

async function rejectResetRequest(
  request
) {

  if (!request) {

    return;

  }


  const note =
    window.prompt(
      "เหตุผลที่ปฏิเสธคำร้อง",
      ""
    );


  if (note === null) {

    return;

  }


  const token =
    getAdminToken();


  try {

    const result =
      await apiRequest(
        "adminRejectReset",
        {

          token:
            token,

          request_id:
            request.request_id,

          note:
            note

        }
      );


    if (!result.success) {

      if (
        isSessionExpired(
          result
        )
      ) {

        redirectToLogin();

        return;

      }


      throw new Error(
        result.message ||
        "ปฏิเสธไม่สำเร็จ"
      );

    }


    showMessage(
      "ปฏิเสธคำร้องสำเร็จ",
      "success"
    );


    await loadResetRequests();


  } catch (error) {

    console.error(
      "REJECT RESET ERROR:",
      error
    );


    showMessage(
      error.message ||
      "ปฏิเสธไม่สำเร็จ",
      "error"
    );

  }

}


/***************************************************************
 * LOAD STAFF
 ***************************************************************/

async function loadStaff() {

  const token =
    getAdminToken();


  if (!token) {

    return;

  }


  try {

    /*
     * Backend ที่เราจะเพิ่ม:
     *
     * adminGetStaff
     */

    const result =
      await apiRequest(
        "adminGetStaff",
        {

          token:
            token

        }
      );


    if (!result.success) {

      if (
        isSessionExpired(
          result
        )
      ) {

        redirectToLogin();

        return;

      }


      console.warn(
        "LOAD STAFF:",
        result.message
      );


      staffList = [];


      renderStaff();


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
      "LOAD STAFF ERROR:",
      error
    );


    staffList = [];


    renderStaff();

  }

}


/***************************************************************
 * RENDER STAFF
 ***************************************************************/

function renderStaff() {

  const tbody =
    document.getElementById(
      "staffTableBody"
    );


  if (!tbody) {

    return;

  }


  tbody.innerHTML = "";


  if (
    !staffList.length
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


  staffList.forEach(
    function (staff) {

      const tr =
        document.createElement(
          "tr"
        );


      tr.appendChild(
        createTableCell(
          staff.admin_id
        )
      );


      tr.appendChild(
        createTableCell(
          staff.username
        )
      );


      tr.appendChild(
        createTableCell(
          staff.name
        )
      );


      tr.appendChild(
        createTableCell(
          staff.role
        )
      );


      tr.appendChild(
        createStatusCell(
          staff.status
        )
      );


      tbody.appendChild(
        tr
      );

    }
  );

}


/***************************************************************
 * OPEN STAFF MODAL
 ***************************************************************/

function openStaffModal() {

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


  showModal(
    "staffModal"
  );

}


/***************************************************************
 * CLOSE STAFF MODAL
 ***************************************************************/

function closeStaffModal() {

  hideModal(
    "staffModal"
  );

}


/***************************************************************
 * HANDLE STAFF SUBMIT
 ***************************************************************/

async function handleStaffSubmit(
  event
) {

  event.preventDefault();


  const token =
    getAdminToken();


  if (!token) {

    redirectToLogin();

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


  if (
    password.length < 4
  ) {

    showMessage(
      "รหัสผ่าน Staff ต้องมีอย่างน้อย 4 ตัวอักษร",
      "error"
    );

    return;

  }


  try {

    setButtonLoading(
      "saveStaffBtn",
      true,
      "กำลังบันทึก..."
    );


    const result =
      await apiRequest(
        "adminAddStaff",
        {

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

        }
      );


    if (!result.success) {

      if (
        isSessionExpired(
          result
        )
      ) {

        redirectToLogin();

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


    closeStaffModal();


    await loadStaff();


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
      "saveStaffBtn",
      false,
      "บันทึก Staff"
    );

  }

}


/***************************************************************
 * SHOW MODAL
 ***************************************************************/

function showModal(
  id
) {

  const modal =
    document.getElementById(id);


  if (!modal) {

    return;

  }


  modal.classList.add(
    "show"
  );


  /*
   * รองรับ CSS บางแบบที่ใช้ display
   */

  modal.style.display =
    "flex";

}


/***************************************************************
 * HIDE MODAL
 ***************************************************************/

function hideModal(
  id
) {

  const modal =
    document.getElementById(id);


  if (!modal) {

    return;

  }


  modal.classList.remove(
    "show"
  );


  modal.style.display =
    "none";

}


/***************************************************************
 * CLOSE STUDENT MODAL
 ***************************************************************/

function closeStudentModal() {

  hideModal(
    "studentModal"
  );


  editingStudentId =
    "";


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


  const studentIdInput =
    document.getElementById(
      "studentId"
    );


  if (studentIdInput) {

    studentIdInput.disabled =
      false;

  }

}


/***************************************************************
 * SET VALUE
 ***************************************************************/

function setValue(
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
      : String(value);

}


/***************************************************************
 * GET VALUE
 ***************************************************************/

function getValue(
  id
) {

  const element =
    document.getElementById(id);


  if (!element) {

    return "";

  }


  return String(
    element.value || ""
  );

}


/***************************************************************
 * SET BUTTON LOADING
 ***************************************************************/

function setButtonLoading(
  id,
  loading,
  text
) {

  const button =
    document.getElementById(id);


  if (!button) {

    return;

  }


  button.disabled =
    !!loading;


  if (text) {

    button.textContent =
      text;

  }

}


/***************************************************************
 * TABLE LOADING
 ***************************************************************/

function setTableLoading(
  tbodyId,
  colspan,
  text
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

      <td
        colspan="${colspan}"
        style="text-align:center;"
      >

        ${escapeHtml(
          text ||
          "กำลังโหลด..."
        )}

      </td>

    </tr>

  `;

}


/***************************************************************
 * SHOW MESSAGE
 ***************************************************************/

function showMessage(
  text,
  type
) {

  const box =
    document.getElementById(
      "messageBox"
    );


  if (!box) {

    /*
     * ถ้าไม่มี messageBox
     * ใช้ console แทน
     */

    console.log(
      "[" +
      type +
      "]",
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


  /*
   * แสดงข้อความ
   */

  box.style.display =
    text
      ? "block"
      : "none";


  /*
   * ซ่อนอัตโนมัติ
   */

  if (text) {

    clearTimeout(
      window.__adminMessageTimer
    );


    window.__adminMessageTimer =
      setTimeout(
        function () {

          box.style.display =
            "none";

        },
        5000
      );

  }

}


/***************************************************************
 * CONVERT DATE TO INPUT DATE
 ***************************************************************/

function convertToInputDate(
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

  if (
    /^\d{4}-\d{2}-\d{2}/.test(text)
  ) {

    return text.substring(
      0,
      10
    );

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
   * Date string
   */

  const date =
    new Date(value);


  if (
    !isNaN(
      date.getTime()
    )
  ) {

    const year =
      date.getFullYear();


    const month =
      String(
        date.getMonth() + 1
      )
      .padStart(
        2,
        "0"
      );


    const day =
      String(
        date.getDate()
      )
      .padStart(
        2,
        "0"
      );


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


/***************************************************************
 * ESCAPE HTML
 ***************************************************************/

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


/***************************************************************
 * DEBUG
 ***************************************************************/

console.log(
  "admin-dashboard.js loaded"
);
