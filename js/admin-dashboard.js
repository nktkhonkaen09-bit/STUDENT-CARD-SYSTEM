/* =========================================================
   STUDENT CARD SYSTEM
   admin-dashboard.js

   หน้าที่:
   - ตรวจสอบ Admin Session
   - โหลดข้อมูลนักศึกษา
   - ค้นหานักศึกษา
   - แก้ไขข้อมูลนักศึกษา
   - รีเซ็ตรหัสผ่านนักศึกษา
   - โหลด Staff
   - เพิ่ม Staff
   - Logout
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const ADMIN_DASHBOARD_CONFIG = {

  API_URL:
    window.CONFIG &&
    window.CONFIG.API_URL

      ? window.CONFIG.API_URL

      : "https://script.google.com/macros/s/AKfycbxCvk2wb6FydCKNkEDvApbTgZWmSFoAzPvvM2sSDOIwSgvftMoQxIX3cy7npP3_6xT4/exec",

  ADMIN_SESSION_KEY:
    "admin_session",

  ADMIN_DATA_KEY:
    "admin_data"

};


/* =========================================================
   STATE
========================================================= */

let adminToken = "";

let adminData = null;

let students = [];

let staffList = [];

let currentEditStudent = null;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initializeAdminDashboard();

  }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeAdminDashboard() {

  try {

    /*
     * อ่าน Session
     */

    adminToken =
      sessionStorage.getItem(
        ADMIN_DASHBOARD_CONFIG.ADMIN_SESSION_KEY
      ) || "";


    /*
     * อ่านข้อมูล Admin
     */

    const savedAdmin =
      sessionStorage.getItem(
        ADMIN_DASHBOARD_CONFIG.ADMIN_DATA_KEY
      );


    if (savedAdmin) {

      try {

        adminData =
          JSON.parse(savedAdmin);

      } catch (error) {

        adminData = null;

      }

    }


    /*
     * ถ้าไม่มี token
     */

    if (!adminToken) {

      redirectToLogin();

      return;

    }


    /*
     * แสดงชื่อ Admin
     */

    renderAdminInfo();


    /*
     * ผูก Event
     */

    bindEvents();


    /*
     * ตรวจ Session กับ Server
     */

    const sessionResult =
      await apiRequest(
        "adminGetStudents",
        {}
      );


    if (
      !sessionResult ||
      !sessionResult.success
    ) {

      handleSessionError(
        sessionResult
      );

      return;

    }


    /*
     * ใช้ข้อมูลจากการโหลดครั้งแรก
     */

    students =
      Array.isArray(
        sessionResult.students
      )

        ? sessionResult.students

        : [];


    renderStudents();


    /*
     * โหลด Staff ต่อ
     */

    await loadStaff();


  } catch (error) {

    console.error(
      "INITIALIZE ADMIN ERROR:",
      error
    );


    showMessage(
      "ไม่สามารถโหลดข้อมูล Admin ได้",
      "error"
    );

  }

}


/* =========================================================
   BIND EVENTS
========================================================= */

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
      openAddStudentModal
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
   * Close Staff Modal
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


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
  action,
  data
) {

  const payload = Object.assign(
    {},
    data || {},
    {
      action: action,
      token: adminToken
    }
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


  return await response.json();

}


/* =========================================================
   ADMIN INFO
========================================================= */

function renderAdminInfo() {

  const adminName =
    document.getElementById(
      "adminName"
    );


  const adminRole =
    document.getElementById(
      "adminRole"
    );


  if (adminName) {

    adminName.textContent =
      adminData &&
      adminData.name

        ? adminData.name

        : adminData &&
          adminData.username

          ? adminData.username

          : "Admin";

  }


  if (adminRole) {

    adminRole.textContent =
      adminData &&
      adminData.role

        ? adminData.role

        : "ADMIN";

  }

}


/* =========================================================
   LOAD STUDENTS
========================================================= */

async function loadStudents() {

  try {

    showMessage(
      "กำลังโหลดข้อมูลนักศึกษา...",
      "info"
    );


    const result =
      await apiRequest(
        "adminGetStudents",
        {}
      );


    if (
      !result ||
      !result.success
    ) {

      handleSessionError(
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


    clearMessage();


  } catch (error) {

    console.error(
      "LOAD STUDENTS ERROR:",
      error
    );


    showMessage(
      "ไม่สามารถโหลดข้อมูลนักศึกษาได้",
      "error"
    );

  }

}


/* =========================================================
   RENDER STUDENTS
========================================================= */

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
    Array.isArray(students)
      ? students.slice()
      : [];


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
          .join(" ")
          .toLowerCase();


          return text.indexOf(
            search
          ) !== -1;

        }
      );

  }


  /*
   * Empty
   */

  if (!list.length) {

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

    return;

  }


  /*
   * Render
   */

  tbody.innerHTML =
    list.map(
      function (student) {

        return `

          <tr>

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

              <span
                class="status-badge"
              >

                ${escapeHtml(
                  student.status ||
                  "นักศึกษาปกติ"
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


            <td>

              <div
                class="action-buttons"
              >

                <button
                  type="button"
                  class="edit-btn"
                  data-student-id="${escapeAttribute(
                    student.student_id
                  )}"
                >
                  แก้ไข
                </button>


                <button
                  type="button"
                  class="reset-btn"
                  data-student-id="${escapeAttribute(
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
   * Event ปุ่มแก้ไข
   */

  tbody
    .querySelectorAll(
      ".edit-btn"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            openEditStudentModal(
              button.dataset.studentId
            );

          }
        );

      }
    );


  /*
   * Event ปุ่ม Reset Password
   */

  tbody
    .querySelectorAll(
      ".reset-btn"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            resetStudentPassword(
              button.dataset.studentId
            );

          }
        );

      }
    );

}


/* =========================================================
   OPEN ADD STUDENT MODAL
========================================================= */

function openAddStudentModal() {

  currentEditStudent = null;


  const modal =
    document.getElementById(
      "studentModal"
    );


  if (!modal) {
    return;
  }


  /*
   * เปลี่ยนหัวข้อ
   */

  const title =
    modal.querySelector(
      ".modal-header h2"
    );


  if (title) {

    title.textContent =
      "เพิ่มนักศึกษา";

  }


  /*
   * Reset Form
   */

  const form =
    document.getElementById(
      "studentForm"
    );


  if (form) {

    form.reset();

  }


  /*
   * ค่าเริ่มต้น
   */

  setValue(
    "studentPassword",
    "123456"
  );


  setValue(
    "studentStatus",
    "นักศึกษาปกติ"
  );


  setValue(
    "studentPhoto",
    ""
  );


  modal.classList.add(
    "show"
  );

}


/* =========================================================
   OPEN EDIT STUDENT MODAL
========================================================= */

function openEditStudentModal(
  studentId
) {

  const student =
    students.find(
      function (item) {

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


  currentEditStudent =
    student;


  const modal =
    document.getElementById(
      "studentModal"
    );


  if (!modal) {
    return;
  }


  /*
   * หัวข้อ Modal
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
   * เติมข้อมูล
   */

  setValue(
    "studentId",
    student.student_id
  );


  setValue(
    "studentPassword",
    ""
  );


  /*
   * รหัสนักศึกษาไม่ควรแก้
   */

  const studentIdInput =
    document.getElementById(
      "studentId"
    );


  if (studentIdInput) {

    studentIdInput.readOnly =
      true;

  }


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
    student.status
  );


  setValue(
    "studentIssueDate",
    convertToDateInput(
      student.issue_date
    )
  );


  setValue(
    "studentExpireDate",
    convertToDateInput(
      student.expire_date
    )
  );


  setValue(
    "studentPhoto",
    student.photo_url
  );


  /*
   * เปิด Modal
   */

  modal.classList.add(
    "show"
  );

}


/* =========================================================
   CLOSE STUDENT MODAL
========================================================= */

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


  currentEditStudent = null;


  const studentIdInput =
    document.getElementById(
      "studentId"
    );


  if (studentIdInput) {

    studentIdInput.readOnly =
      false;

  }

}


/* =========================================================
   STUDENT FORM SUBMIT
========================================================= */

async function handleStudentFormSubmit(
  event
) {

  event.preventDefault();


  const isEdit =
    !!currentEditStudent;


  const studentId =
    getValue(
      "studentId"
    );


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


  /*
   * ถ้าเพิ่มใหม่ ต้องมี password
   */

  if (
    !isEdit &&
    !password
  ) {

    showMessage(
      "กรุณากรอกรหัสผ่าน",
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

    /*
     * ตอนนี้ Backend เดิมของคุณ
     * มี adminUpdateStudent
     *
     * ดังนั้นส่วนแก้ไขใช้ API นี้
     */

    if (isEdit) {

      const payload = {

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

        status:
          getValue(
            "studentStatus"
          ),

        department:
          getValue(
            "studentDepartment"
          ),

        phone:
          getValue(
            "studentPhone"
          ),

        photo_url:
          getValue(
            "studentPhoto"
          ),

        issue_date:
          getValue(
            "studentIssueDate"
          ),

        expire_date:
          getValue(
            "studentExpireDate"
          )

      };


      const result =
        await apiRequest(
          "adminUpdateStudent",
          payload
        );


      if (
        !result ||
        !result.success
      ) {

        handleSessionError(
          result
        );

        return;

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
     * เพิ่มนักศึกษา
     *
     * Backend ที่ส่งมาก่อนหน้านี้
     * ยังไม่มี adminAddStudent
     *
     * ดังนั้นถ้าต้องการใช้งานปุ่มนี้
     * ต้องเพิ่ม API ฝั่ง Code.gs ด้วย
     */

    const result =
      await apiRequest(
        "adminAddStudent",
        {

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

          status:
            getValue(
              "studentStatus"
            ),

          department:
            getValue(
              "studentDepartment"
            ),

          phone:
            getValue(
              "studentPhone"
            ),

          photo_url:
            getValue(
              "studentPhoto"
            ),

          issue_date:
            getValue(
              "studentIssueDate"
            ),

          expire_date:
            getValue(
              "studentExpireDate"
            )

        }
      );


    if (
      !result ||
      !result.success
    ) {

      handleSessionError(
        result
      );

      return;

    }


    showMessage(
      "เพิ่มนักศึกษาสำเร็จ",
      "success"
    );


    closeStudentModalWindow();


    await loadStudents();


  } catch (error) {

    console.error(
      "SAVE STUDENT ERROR:",
      error
    );


    showMessage(
      "ไม่สามารถบันทึกข้อมูลนักศึกษาได้",
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


/* =========================================================
   RESET STUDENT PASSWORD
========================================================= */

async function resetStudentPassword(
  studentId
) {

  const student =
    students.find(
      function (item) {

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


  const newPassword =
    window.prompt(
      "กำหนดรหัสผ่านใหม่สำหรับ " +
      studentId +
      "\n\nหากกด ยกเลิก จะไม่ทำรายการ",
      "123456"
    );


  if (
    newPassword === null
  ) {

    return;

  }


  if (
    String(
      newPassword
    ).length < 4
  ) {

    showMessage(
      "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร",
      "error"
    );

    return;

  }


  const confirmed =
    window.confirm(
      "ยืนยันรีเซ็ตรหัสผ่านนักศึกษา " +
      studentId +
      " ?"
    );


  if (!confirmed) {

    return;

  }


  try {

    /*
     * API นี้เป็นของระบบเดิม
     *
     * adminResetPassword
     * ต้องใช้ request_id
     *
     * แต่การกดจากตารางนักศึกษาโดยตรง
     * Backend เดิมยังไม่มี API
     * resetStudentPassword
     *
     * ดังนั้นเรียก API ใหม่ที่ควรเพิ่มใน Code.gs
     */

    const result =
      await apiRequest(
        "adminResetStudentPassword",
        {

          student_id:
            studentId,

          newPassword:
            newPassword

        }
      );


    if (
      !result ||
      !result.success
    ) {

      handleSessionError(
        result
      );

      return;

    }


    showMessage(
      "รีเซ็ตรหัสผ่าน " +
      studentId +
      " สำเร็จ",
      "success"
    );


  } catch (error) {

    console.error(
      "RESET PASSWORD ERROR:",
      error
    );


    showMessage(
      "ไม่สามารถรีเซ็ตรหัสผ่านได้",
      "error"
    );

  }

}


/* =========================================================
   LOAD STAFF
========================================================= */

async function loadStaff() {

  const tbody =
    document.getElementById(
      "staffTableBody"
    );


  if (!tbody) {
    return;
  }


  /*
   * Backend ปัจจุบันของคุณยังไม่มี
   * adminGetStaff
   *
   * จึงแสดงข้อความก่อน
   * เพื่อไม่ให้หน้า Dashboard พัง
   */

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

      /*
       * ถ้า Backend ยังไม่มี API
       * ไม่ redirect
       */

      tbody.innerHTML = `

        <tr>

          <td
            colspan="5"
            style="text-align:center;"
          >
            ยังไม่ได้เปิดใช้งานระบบ Staff

          </td>

        </tr>

      `;

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


/* =========================================================
   RENDER STAFF
========================================================= */

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
          style="text-align:center;"
        >
          ไม่พบข้อมูล Staff
        </td>

      </tr>

    `;

    return;

  }


  tbody.innerHTML =
    staffList
      .map(
        function (staff) {

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
                ${escapeHtml(
                  staff.status
                )}
              </td>

            </tr>

          `;

        }
      )
      .join("");

}


/* =========================================================
   OPEN STAFF MODAL
========================================================= */

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


/* =========================================================
   CLOSE STAFF MODAL
========================================================= */

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


/* =========================================================
   STAFF FORM
========================================================= */

async function handleStaffFormSubmit(
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
            role,

          status:
            status

        }
      );


    if (
      !result ||
      !result.success
    ) {

      handleSessionError(
        result
      );

      return;

    }


    showMessage(
      "เพิ่ม Staff สำเร็จ",
      "success"
    );


    closeStaffModalWindow();


    await loadStaff();


  } catch (error) {

    console.error(
      "SAVE STAFF ERROR:",
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


/* =========================================================
   LOGOUT
========================================================= */

async function handleLogout() {

  const confirmed =
    window.confirm(
      "ต้องการออกจากระบบ Admin หรือไม่?"
    );


  if (!confirmed) {

    return;

  }


  try {

    if (adminToken) {

      await apiRequest(
        "adminLogout",
        {}
      );

    }

  } catch (error) {

    console.warn(
      "ADMIN LOGOUT API ERROR:",
      error
    );

  }


  sessionStorage.removeItem(
    ADMIN_DASHBOARD_CONFIG.ADMIN_SESSION_KEY
  );


  sessionStorage.removeItem(
    ADMIN_DASHBOARD_CONFIG.ADMIN_DATA_KEY
  );


  window.location.replace(
    "admin-login.html"
  );

}


/* =========================================================
   SESSION ERROR
========================================================= */

function handleSessionError(
  result
) {

  if (
    result &&
    (
      result.code ===
        "ADMIN_SESSION_EXPIRED" ||

      result.code ===
        "SESSION_EXPIRED"
    )
  ) {

    sessionStorage.removeItem(
      ADMIN_DASHBOARD_CONFIG.ADMIN_SESSION_KEY
    );


    sessionStorage.removeItem(
      ADMIN_DASHBOARD_CONFIG.ADMIN_DATA_KEY
    );


    alert(
      "Session ของ Admin หมดอายุ กรุณาเข้าสู่ระบบใหม่"
    );


    redirectToLogin();


    return true;

  }


  if (
    result &&
    result.message
  ) {

    showMessage(
      result.message,
      "error"
    );

    return true;

  }


  return false;

}


/* =========================================================
   REDIRECT LOGIN
========================================================= */

function redirectToLogin() {

  window.location.replace(
    "admin-login.html"
  );

}


/* =========================================================
   MESSAGE
========================================================= */

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

}


function clearMessage() {

  const box =
    document.getElementById(
      "messageBox"
    );


  if (box) {

    box.textContent =
      "";

    box.className =
      "message-box";

  }

}


/* =========================================================
   GET VALUE
========================================================= */

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
    element.value == null
      ? ""
      : element.value
  ).trim();

}


/* =========================================================
   SET VALUE
========================================================= */

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


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
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
    String(value).trim();


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

    return text.substring(
      0,
      10
    );

  }


  return text;

}


/* =========================================================
   CONVERT DATE FOR INPUT
========================================================= */

function convertToDateInput(
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
    String(value).trim();


  /*
   * yyyy-MM-dd
   */

  if (
    /^\d{4}-\d{2}-\d{2}/.test(
      text
    )
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


  return "";

}


/* =========================================================
   ESCAPE HTML
========================================================= */

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


/* =========================================================
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


/* =========================================================
   DEBUG
========================================================= */

console.log(
  "admin-dashboard.js loaded"
);
