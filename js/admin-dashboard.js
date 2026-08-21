/* =====================================================
   ADMIN DASHBOARD JS
   Student Card System
===================================================== */


/* =====================================================
   CONFIG
===================================================== */

const ADMIN_DASHBOARD_CONFIG = {

  API_URL:
    "https://script.google.com/macros/s/AKfycbxCvk2wb6FydCKNkEDvApbTgZWmSFoAzPvvM2sSDOIwSgvftMoQxIX3cy7npP3_6xT4/exec",

  SESSION_KEY:
    "admin_session",

  ADMIN_KEY:
    "admin_data"

};


/* =====================================================
   DOM READY
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initializeDashboard();

  }
);


/* =====================================================
   INITIALIZE
===================================================== */

function initializeDashboard() {

  /*
   * ตรวจ Session ก่อน
   */

  const token =
    sessionStorage.getItem(
      ADMIN_DASHBOARD_CONFIG.SESSION_KEY
    );


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

  setupEvents();


  /*
   * โหลดข้อมูล
   */

  loadStudents();

  loadStaff();

}


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
      logoutAdmin
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
      openStudentModal
    );

  }


  /* -----------------------------------------------
     CLOSE STUDENT
  ------------------------------------------------ */

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


  const cancelStudentBtn =
    document.getElementById(
      "cancelStudentBtn"
    );


  if (cancelStudentBtn) {

    cancelStudentBtn.addEventListener(
      "click",
      closeStudentModalWindow
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
     CLOSE STAFF
  ------------------------------------------------ */

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


  const cancelStaffBtn =
    document.getElementById(
      "cancelStaffBtn"
    );


  if (cancelStaffBtn) {

    cancelStaffBtn.addEventListener(
      "click",
      closeStaffModalWindow
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
      saveStudent
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
      saveStaff
    );

  }


  /* -----------------------------------------------
     SEARCH
  ------------------------------------------------ */

  const search =
    document.getElementById(
      "studentSearch"
    );


  if (search) {

    search.addEventListener(
      "input",
      function () {

        loadStudents(
          search.value.trim()
        );

      }
    );

  }


  /* -----------------------------------------------
     RELOAD
  ------------------------------------------------ */

  const reloadBtn =
    document.getElementById(
      "reloadStudentsBtn"
    );


  if (reloadBtn) {

    reloadBtn.addEventListener(
      "click",
      function () {

        loadStudents();

        loadStaff();

      }
    );

  }

}


/* =====================================================
   ADMIN INFO
===================================================== */

function loadAdminInfo() {

  try {

    const adminData =
      sessionStorage.getItem(
        ADMIN_DASHBOARD_CONFIG.ADMIN_KEY
      );


    if (!adminData) {

      return;

    }


    const admin =
      JSON.parse(
        adminData
      );


    const name =
      document.getElementById(
        "adminName"
      );


    const role =
      document.getElementById(
        "adminRole"
      );


    if (name) {

      name.textContent =
        admin.name ||
        admin.username ||
        "Admin";

    }


    if (role) {

      role.textContent =
        admin.role ||
        "ADMIN";

    }


  } catch (error) {

    console.error(
      "LOAD ADMIN INFO ERROR",
      error
    );

  }

}


/* =====================================================
   API
===================================================== */

async function apiRequest(
  action,
  data
) {

  const token =
    sessionStorage.getItem(
      ADMIN_DASHBOARD_CONFIG.SESSION_KEY
    );


  const body =
    Object.assign(
      {
        action: action,
        token: token
      },
      data || {}
    );


  const response =
    await fetch(
      ADMIN_DASHBOARD_CONFIG.API_URL,
      {

        method: "POST",

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


  return await response.json();

}


/* =====================================================
   LOAD STUDENTS
===================================================== */

async function loadStudents(
  searchText = ""
) {

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
        class="loading-cell"
      >
        กำลังโหลดข้อมูล...
      </td>

    </tr>

  `;


  try {

    const result =
      await apiRequest(
        "adminGetStudents",
        {
          search: searchText
        }
      );


    if (
      !result ||
      !result.success
    ) {

      if (
        result &&
        result.code ===
        "ADMIN_SESSION_EXPIRED"
      ) {

        redirectToLogin();

        return;

      }


      throw new Error(
        result &&
        result.message
          ? result.message
          : "ไม่สามารถโหลดข้อมูลนักศึกษาได้"
      );

    }


    const students =
      Array.isArray(
        result.students
      )
        ? result.students
        : [];


    renderStudents(
      students
    );


    const count =
      document.getElementById(
        "studentCount"
      );


    if (count) {

      count.textContent =
        students.length;

    }


  } catch (error) {

    console.error(
      "LOAD STUDENTS ERROR",
      error
    );


    tbody.innerHTML = `

      <tr>

        <td
          colspan="8"
          class="empty-cell"
        >
          ไม่สามารถโหลดข้อมูลนักศึกษาได้
        </td>

      </tr>

    `;


    showMessage(
      error.message ||
      "เกิดข้อผิดพลาด",
      "error"
    );

  }

}


/* =====================================================
   RENDER STUDENTS
===================================================== */

function renderStudents(
  students
) {

  const tbody =
    document.getElementById(
      "studentsTableBody"
    );


  tbody.innerHTML = "";


  if (
    !students ||
    students.length === 0
  ) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="8"
          class="empty-cell"
        >
          ไม่พบข้อมูลนักศึกษา
        </td>

      </tr>

    `;

    return;

  }


  students.forEach(
    function(student) {


      const tr =
        document.createElement(
          "tr"
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


      tr.innerHTML = `

        <td>
          ${escapeHtml(
            student.student_id || "-"
          )}
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
          ${createStatusBadge(
            student.status
          )}
        </td>

        <td>
          ${escapeHtml(
            formatDateOnly(
              student.issue_date
            )
          )}
        </td>

        <td>
          ${escapeHtml(
            formatDateOnly(
              student.expire_date
            )
          )}
        </td>

      `;


      tbody.appendChild(
        tr
      );

    }
  );

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


  /*
   * ตอนนี้ Backend เดิมของคุณ
   * ยังไม่มี adminGetStaff
   *
   * จึงแสดงข้อความไว้ก่อน
   */

  tbody.innerHTML = `

    <tr>

      <td
        colspan="5"
        class="empty-cell"
      >
        ระบบจัดการ Staff พร้อมใช้งานหลังเพิ่ม API
        adminGetStaff ใน Code.gs
      </td>

    </tr>

  `;


  /*
   * เมื่อเราเพิ่ม API แล้ว
   * จะเปลี่ยนส่วนนี้เป็น:
   *
   * const result =
   *   await apiRequest(
   *     "adminGetStaff"
   *   );
   *
   */

}


/* =====================================================
   OPEN STUDENT MODAL
===================================================== */

function openStudentModal() {

  const modal =
    document.getElementById(
      "studentModal"
    );


  if (!modal) {

    return;

  }


  const form =
    document.getElementById(
      "studentForm"
    );


  if (form) {

    form.reset();

  }


  const password =
    document.getElementById(
      "studentPassword"
    );


  if (password) {

    password.value =
      "123456";

  }


  modal.classList.add(
    "show"
  );

}


/* =====================================================
   CLOSE STUDENT MODAL
===================================================== */

function closeStudentModalWindow() {

  const modal =
    document.getElementById(
      "studentModal"
    );


  if (modal) {

    modal.classList.remove(
      "show"
    );

  }

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


  modal.classList.add(
    "show"
  );

}


/* =====================================================
   CLOSE STAFF MODAL
===================================================== */

function closeStaffModalWindow() {

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
   SAVE STUDENT
===================================================== */

async function saveStudent(
  event
) {

  event.preventDefault();


  const button =
    document.getElementById(
      "saveStudentBtn"
    );


  const data = {

    student_id:
      getValue("studentId"),

    password:
      getValue("studentPassword"),

    prefix_th:
      getValue("studentPrefix"),

    firstname_th:
      getValue("studentFirstnameTh"),

    lastname_th:
      getValue("studentLastnameTh"),

    firstname_en:
      getValue("studentFirstnameEn"),

    lastname_en:
      getValue("studentLastnameEn"),

    department:
      getValue("studentDepartment"),

    phone:
      getValue("studentPhone"),

    status:
      getValue("studentStatus"),

    issue_date:
      getValue("studentIssueDate"),

    expire_date:
      getValue("studentExpireDate"),

    photo_url:
      getValue("studentPhoto")

  };


  if (
    !data.student_id ||
    !data.password ||
    !data.firstname_th ||
    !data.lastname_th
  ) {

    showMessage(
      "กรุณากรอกข้อมูลที่จำเป็นให้ครบ",
      "error"
    );

    return;

  }


  button.disabled = true;

  button.textContent =
    "กำลังบันทึก...";


  try {

    /*
     * ตอนนี้ Backend ของคุณ
     * ยังไม่มี adminAddStudent
     *
     * ดังนั้นจะเรียก API นี้
     * หลังจากเราเพิ่ม Code.gs
     */

    const result =
      await apiRequest(
        "adminAddStudent",
        data
      );


    if (
      !result ||
      !result.success
    ) {

      if (
        result &&
        result.code ===
        "ADMIN_SESSION_EXPIRED"
      ) {

        redirectToLogin();

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


    closeStudentModalWindow();


    await loadStudents();


  } catch (error) {

    console.error(
      "SAVE STUDENT ERROR",
      error
    );


    showMessage(
      error.message ||
      "ไม่สามารถเพิ่มนักศึกษาได้",
      "error"
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "บันทึกนักศึกษา";

  }

}


/* =====================================================
   SAVE STAFF
===================================================== */

async function saveStaff(
  event
) {

  event.preventDefault();


  const button =
    document.getElementById(
      "saveStaffBtn"
    );


  const data = {

    username:
      getValue("staffUsername"),

    password:
      getValue("staffPassword"),

    name:
      getValue("staffName"),

    role:
      getValue("staffRole"),

    status:
      getValue("staffStatus")

  };


  if (
    !data.username ||
    !data.password ||
    !data.name
  ) {

    showMessage(
      "กรุณากรอกข้อมูล Staff ให้ครบ",
      "error"
    );

    return;

  }


  button.disabled = true;

  button.textContent =
    "กำลังบันทึก...";


  try {

    const result =
      await apiRequest(
        "adminAddStaff",
        data
      );


    if (
      !result ||
      !result.success
    ) {

      if (
        result &&
        result.code ===
        "ADMIN_SESSION_EXPIRED"
      ) {

        redirectToLogin();

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


    closeStaffModalWindow();


    await loadStaff();


  } catch (error) {

    console.error(
      "SAVE STAFF ERROR",
      error
    );


    showMessage(
      error.message ||
      "ไม่สามารถเพิ่ม Staff ได้",
      "error"
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "บันทึก Staff";

  }

}


/* =====================================================
   LOGOUT
===================================================== */

async function logoutAdmin() {

  const token =
    sessionStorage.getItem(
      ADMIN_DASHBOARD_CONFIG.SESSION_KEY
    );


  try {

    if (token) {

      await apiRequest(
        "adminLogout"
      );

    }

  } catch (error) {

    console.warn(
      "LOGOUT API ERROR",
      error
    );

  }


  sessionStorage.removeItem(
    ADMIN_DASHBOARD_CONFIG.SESSION_KEY
  );


  sessionStorage.removeItem(
    ADMIN_DASHBOARD_CONFIG.ADMIN_KEY
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
   MESSAGE
===================================================== */

function showMessage(
  text,
  type = "info"
) {

  const box =
    document.getElementById(
      "messageBox"
    );


  if (!box) {

    return;

  }


  box.textContent =
    text;


  box.className =
    "message-box show " +
    type;


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
      5000
    );

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
  ).trim();

}


/* =====================================================
   STATUS BADGE
===================================================== */

function createStatusBadge(
  status
) {

  const value =
    String(
      status || ""
    ).trim();


  const upper =
    value.toUpperCase();


  let className =
    "status-default";


  if (
    upper === "ACTIVE" ||
    value === "นักศึกษาปกติ"
  ) {

    className =
      "status-active";

  }


  if (
    upper === "INACTIVE" ||
    upper === "SUSPENDED" ||
    upper === "DISABLED"
  ) {

    className =
      "status-inactive";

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


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDateOnly(
  value
) {

  if (!value) {

    return "-";

  }


  const text =
    String(value)
      .trim();


  /*
   * Backend ของคุณส่ง Date
   * เป็น dd/MM/yyyy HH:mm:ss
   *
   * ตัดเวลาออก
   */

  if (
    text.indexOf(" ") >= 0
  ) {

    return text
      .split(" ")[0];

  }


  return text;

}


/* =====================================================
   ESCAPE HTML
===================================================== */

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
