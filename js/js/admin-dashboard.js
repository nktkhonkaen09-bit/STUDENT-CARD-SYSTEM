/*******************************************************
 * ADMIN DASHBOARD
 * js/admin-dashboard.js
 *
 * รองรับ
 *
 * 1. ตรวจ Admin Session
 * 2. แสดงข้อมูล Admin
 * 3. โหลดนักศึกษา
 * 4. ค้นหานักศึกษา
 * 5. เพิ่มนักศึกษา
 * 6. แก้ไขนักศึกษา
 * 7. โหลด Staff
 * 8. Logout
 *
 *******************************************************/


/*******************************************************
 * CONFIG
 *******************************************************/

const ADMIN_DASHBOARD_CONFIG = {

  API_URL:
    "https://script.google.com/macros/s/AKfycbxCvk2wb6FydCKNkEDvApbTgZWmSFoAzPvvM2sSDOIwSgvftMoQxIX3cy7npP3_6xT4/exec",

  ADMIN_SESSION_KEY:
    "admin_session",

  ADMIN_KEY:
    "admin_data"

};


/*******************************************************
 * STATE
 *******************************************************/

let students = [];

let currentStudentMode =
  "add";


/*******************************************************
 * READY
 *******************************************************/

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initializeAdminDashboard();

  }
);


/*******************************************************
 * INITIALIZE
 *******************************************************/

async function initializeAdminDashboard() {

  /*
   * ตรวจ Session ก่อน
   */

  const token =
    getAdminToken();


  if (!token) {

    redirectToAdminLogin();

    return;

  }


  /*
   * แสดง Admin จาก sessionStorage
   */

  loadAdminInfo();


  /*
   * ตรวจ Session กับ API
   */

  const valid =
    await verifyAdminSession();


  if (!valid) {

    return;

  }


  /*
   * Bind Events
   */

  bindEvents();


  /*
   * โหลดข้อมูล
   */

  await loadStudents();

  await loadStaff();

}


/*******************************************************
 * GET TOKEN
 *******************************************************/

function getAdminToken() {

  return String(

    sessionStorage.getItem(
      ADMIN_DASHBOARD_CONFIG.ADMIN_SESSION_KEY
    ) || ""

  ).trim();

}


/*******************************************************
 * GET ADMIN DATA
 *******************************************************/

function getAdminData() {

  try {

    const value =
      sessionStorage.getItem(
        ADMIN_DASHBOARD_CONFIG.ADMIN_KEY
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


/*******************************************************
 * LOAD ADMIN INFO
 *******************************************************/

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


/*******************************************************
 * VERIFY ADMIN SESSION
 *******************************************************/

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
          token

      });


    if (
      !result ||
      !result.success
    ) {

      if (
        result &&
        result.code ===
          "ADMIN_SESSION_EXPIRED"
      ) {

        clearAdminSession();

        redirectToAdminLogin();

        return false;

      }


      /*
       * บางกรณี API ใช้งานได้
       * แต่ไม่มีข้อมูล
       *
       * ไม่ต้องเด้ง Login
       */

      if (
        result &&
        result.message
      ) {

        showMessage(
          result.message,
          "error"
        );

      }

      return false;

    }


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

        openStudentAddModal();

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
   * Staff
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
   * ปิด Modal เมื่อคลิกพื้นหลัง
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
 * API REQUEST
 *******************************************************/

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


  const result =
    await response.json();


  return result;

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
      await apiRequest({

        action:
          "adminGetStudents",

        token:
          getAdminToken()

      });


    if (
      !result ||
      !result.success
    ) {

      if (
        result &&
        result.code ===
          "ADMIN_SESSION_EXPIRED"
      ) {

        clearAdminSession();

        redirectToAdminLogin();

        return;

      }


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


    renderStudents(
      document.getElementById(
        "studentSearch"
      )?.value || ""
    );


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
            class="empty-row"
          >
            ${escapeHtml(
              error.message ||
              "ไม่สามารถโหลดข้อมูลได้"
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


  const search =
    String(
      searchText || ""
    )
    .trim()
    .toLowerCase();


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


        return text.indexOf(
          search
        ) !== -1;

      }
    );


  if (
    filtered.length === 0
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
    filtered
      .map(
        function(student) {

          return createStudentRow(
            student
          );

        }
      )
      .join("");


  /*
   * สำคัญมาก
   *
   * หลังสร้าง HTML แล้ว
   * ต้อง bind ปุ่มแก้ไข
   */

  tbody
    .querySelectorAll(
      ".edit-student-btn"
    )
    .forEach(
      function(button) {

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

}


/*******************************************************
 * CREATE STUDENT ROW
 *******************************************************/

function createStudentRow(
  student
) {

  const studentId =
    String(
      student.student_id || ""
    );


  const fullName = [

    student.prefix_th || "",

    student.firstname_th || "",

    student.lastname_th || ""

  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();


  const englishName = [

    student.firstname_en || "",

    student.lastname_en || ""

  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();


  const status =
    String(
      student.status || ""
    ).trim();


  const statusClass =
    getStatusClass(
      status
    );


  return `

    <tr>

      <td>
        ${escapeHtml(studentId)}
      </td>


      <td class="student-name">
        ${escapeHtml(
          fullName || "-"
        )}
      </td>


      <td class="english-name">
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
          class="status ${statusClass}"
        >
          ${escapeHtml(
            status || "-"
          )}
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


      <td class="action-cell">

        <button
          type="button"
          class="edit-btn edit-student-btn"
          data-student-id="${escapeHtml(studentId)}"
        >
          แก้ไข
        </button>

      </td>

    </tr>

  `;

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
    value === "INACTIVE"
  ) {

    return "status-inactive";

  }


  if (
    value === "SUSPENDED"
  ) {

    return "status-suspended";

  }


  return "status-active";

}


/*******************************************************
 * FORMAT DATE
 *******************************************************/

function formatDisplayDate(
  value
) {

  if (!value) {

    return "-";

  }


  const text =
    String(value).trim();


  if (!text) {

    return "-";

  }


  /*
   * ถ้า API ส่ง:
   *
   * dd/MM/yyyy HH:mm:ss
   *
   * ให้เอาเฉพาะวันที่
   */

  if (
    text.indexOf("/") !== -1
  ) {

    return text.split(" ")[0];

  }


  return text;

}


/*******************************************************
 * OPEN ADD STUDENT
 *******************************************************/

function openStudentAddModal() {

  currentStudentMode =
    "add";


  const title =
    document.getElementById(
      "studentModalTitle"
    );


  const passwordGroup =
    document.getElementById(
      "studentPasswordGroup"
    );


  const saveButton =
    document.getElementById(
      "saveStudentBtn"
    );


  const form =
    document.getElementById(
      "studentForm"
    );


  if (form) {

    form.reset();

  }


  if (title) {

    title.textContent =
      "เพิ่มนักศึกษา";

  }


  if (passwordGroup) {

    passwordGroup.style.display =
      "";

  }


  if (saveButton) {

    saveButton.textContent =
      "บันทึกนักศึกษา";

  }


  /*
   * ค่าเริ่มต้น
   */

  const password =
    document.getElementById(
      "studentPassword"
    );


  if (password) {

    password.value =
      "123456";

  }


  const status =
    document.getElementById(
      "studentStatus"
    );


  if (status) {

    status.value =
      "นักศึกษาปกติ";

  }


  openStudentModal();

}


/*******************************************************
 * EDIT STUDENT
 *******************************************************/

function editStudent(
  studentId
) {

  const student =
    students.find(
      function(item) {

        return String(
          item.student_id || ""
        ).trim()
        ===
        String(
          studentId || ""
        ).trim();

      }
    );


  if (!student) {

    showMessage(
      "ไม่พบข้อมูลนักศึกษาที่ต้องการแก้ไข",
      "error"
    );

    return;

  }


  currentStudentMode =
    "edit";


  /*
   * Title
   */

  const title =
    document.getElementById(
      "studentModalTitle"
    );


  if (title) {

    title.textContent =
      "แก้ไขข้อมูลนักศึกษา";

  }


  /*
   * Student ID
   */

  const idInput =
    document.getElementById(
      "studentId"
    );


  idInput.value =
    student.student_id || "";


  /*
   * ไม่ให้เปลี่ยน student_id
   * เพื่อป้องกันชนข้อมูล
   */

  idInput.readOnly =
    true;


  idInput.classList.add(
    "readonly-input"
  );


  /*
   * Password
   *
   * ตอนแก้ไขไม่ใช้ช่องนี้
   */

  const passwordGroup =
    document.getElementById(
      "studentPasswordGroup"
    );


  if (passwordGroup) {

    passwordGroup.style.display =
      "none";

  }


  /*
   * Fill data
   */

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
    convertDateToInput(
      student.issue_date
    )
  );


  setInputValue(
    "studentExpireDate",
    convertDateToInput(
      student.expire_date
    )
  );


  setInputValue(
    "studentPhoto",
    student.photo_url
  );


  /*
   * Button
   */

  const saveButton =
    document.getElementById(
      "saveStudentBtn"
    );


  if (saveButton) {

    saveButton.textContent =
      "บันทึกการแก้ไข";

  }


  openStudentModal();

}


/*******************************************************
 * OPEN STUDENT MODAL
 *******************************************************/

function openStudentModal() {

  const modal =
    document.getElementById(
      "studentModal"
    );


  if (modal) {

    modal.classList.add(
      "show"
    );

  }

}


/*******************************************************
 * CLOSE STUDENT MODAL
 *******************************************************/

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


  /*
   * คืนค่า readonly
   */

  const idInput =
    document.getElementById(
      "studentId"
    );


  if (idInput) {

    idInput.readOnly =
      false;

    idInput.classList.remove(
      "readonly-input"
    );

  }


  currentStudentMode =
    "add";

}


/*******************************************************
 * HANDLE STUDENT SUBMIT
 *******************************************************/

async function handleStudentSubmit(
  event
) {

  event.preventDefault();


  const studentId =
    getValue(
      "studentId"
    );


  if (!studentId) {

    showMessage(
      "กรุณากรอกรหัสนักศึกษา",
      "error"
    );

    return;

  }


  const saveButton =
    document.getElementById(
      "saveStudentBtn"
    );


  if (saveButton) {

    saveButton.disabled =
      true;

    saveButton.textContent =
      "กำลังบันทึก...";

  }


  try {


    /*
     * =========================================
     * EDIT
     * =========================================
     */

    if (
      currentStudentMode ===
      "edit"
    ) {

      const payload = {

        action:
          "adminUpdateStudent",

        token:
          getAdminToken(),

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


      const result =
        await apiRequest(
          payload
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

          clearAdminSession();

          redirectToAdminLogin();

          return;

        }


        throw new Error(
          result &&
          result.message
            ? result.message
            : "ไม่สามารถแก้ไขข้อมูลได้"
        );

      }


      showMessage(
        "แก้ไขข้อมูลนักศึกษาสำเร็จ",
        "success"
      );


      closeStudentModalWindow();


      await loadStudents();


      return;

    }


    /*
     * =========================================
     * ADD
     * =========================================
     */

    const password =
      getValue(
        "studentPassword"
      );


    if (!password) {

      showMessage(
        "กรุณากรอกรหัสผ่านเริ่มต้น",
        "error"
      );

      return;

    }


    const payload = {

      action:
        "adminAddStudent",

      token:
        getAdminToken(),

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

    };


    const result =
      await apiRequest(
        payload
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

        clearAdminSession();

        redirectToAdminLogin();

        return;

      }


      throw new Error(
        result &&
        result.message
          ? result.message
          : "ไม่สามารถเพิ่มนักศึกษาได้"
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
      "STUDENT SAVE ERROR",
      error
    );


    showMessage(
      error.message ||
      "เกิดข้อผิดพลาดในการบันทึก",
      "error"
    );


  } finally {

    if (saveButton) {

      saveButton.disabled =
        false;


      saveButton.textContent =
        currentStudentMode ===
        "edit"

          ? "บันทึกการแก้ไข"

          : "บันทึกนักศึกษา";

    }

  }

}


/*******************************************************
 * LOAD STAFF
 *
 * ตอนนี้ Backend เดิมของคุณยังไม่มี
 * adminGetStaff
 *
 * จึงแสดงข้อความแจ้งก่อน
 *******************************************************/

async function loadStaff() {

  const tbody =
    document.getElementById(
      "staffTableBody"
    );


  if (!tbody) {

    return;

  }


  /*
   * Backend ชุดปัจจุบันยังไม่มี
   * adminGetStaff
   *
   * จึงยังไม่ยิง API ที่ไม่มี
   */

  tbody.innerHTML = `

    <tr>

      <td
        colspan="5"
        class="empty-row"
      >
        ระบบ Staff รอเชื่อมต่อ Backend
      </td>

    </tr>

  `;

}


/*******************************************************
 * OPEN STAFF MODAL
 *******************************************************/

function openStaffModal() {

  const modal =
    document.getElementById(
      "staffModal"
    );


  if (modal) {

    modal.classList.add(
      "show"
    );

  }

}


/*******************************************************
 * CLOSE STAFF MODAL
 *******************************************************/

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


/*******************************************************
 * HANDLE STAFF
 *
 * Backend adminAddStaff ต้องมีเพิ่มใน Code.gs
 *******************************************************/

async function handleStaffSubmit(
  event
) {

  event.preventDefault();


  const username =
    getValue(
      "staffUsername"
    );


  const password =
    getValue(
      "staffPassword"
    );


  const name =
    getValue(
      "staffName"
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
          getValue(
            "staffRole"
          ),

        status:
          getValue(
            "staffStatus"
          )

      });


    if (
      !result ||
      !result.success
    ) {

      if (
        result &&
        result.code ===
          "ADMIN_SESSION_EXPIRED"
      ) {

        clearAdminSession();

        redirectToAdminLogin();

        return;

      }


      throw new Error(
        result &&
        result.message
          ? result.message
          : "ไม่สามารถเพิ่ม Staff ได้"
      );

    }


    showMessage(
      "เพิ่ม Staff สำเร็จ",
      "success"
    );


    closeStaffModalWindow();


    document
      .getElementById(
        "staffForm"
      )
      ?.reset();


    await loadStaff();


  } catch (error) {

    console.error(
      "STAFF SAVE ERROR",
      error
    );


    showMessage(
      error.message ||
      "เกิดข้อผิดพลาด",
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


/*******************************************************
 * LOGOUT
 *******************************************************/

async function handleLogout() {

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

  }


  clearAdminSession();


  redirectToAdminLogin();

}


/*******************************************************
 * CLEAR SESSION
 *******************************************************/

function clearAdminSession() {

  sessionStorage.removeItem(
    ADMIN_DASHBOARD_CONFIG.ADMIN_SESSION_KEY
  );


  sessionStorage.removeItem(
    ADMIN_DASHBOARD_CONFIG.ADMIN_KEY
  );

}


/*******************************************************
 * REDIRECT LOGIN
 *******************************************************/

function redirectToAdminLogin() {

  window.location.replace(
    "admin-login.html"
  );

}


/*******************************************************
 * SET INPUT
 *******************************************************/

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
      : String(value);

}


/*******************************************************
 * GET VALUE
 *******************************************************/

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


/*******************************************************
 * CONVERT DATE
 *
 * รองรับ
 *
 * dd/MM/yyyy
 * dd/MM/yyyy HH:mm:ss
 * yyyy-MM-dd
 *******************************************************/

function convertDateToInput(
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
    /^\d{4}-\d{2}-\d{2}$/
      .test(text)
  ) {

    return text;

  }


  /*
   * dd/MM/yyyy
   */

  const match =
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
     * ถ้าเป็น พ.ศ.
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


  /*
   * ล้างข้อความอัตโนมัติ
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

        }

      },
      5000
    );

  }

}


/*******************************************************
 * ESCAPE HTML
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
