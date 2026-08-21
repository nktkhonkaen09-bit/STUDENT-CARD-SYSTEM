/*******************************************************
 * ADMIN DASHBOARD JS
 * Student Card System
 *
 * หน้าที่:
 *
 * 1. ตรวจสอบ Admin Session
 * 2. แสดงข้อมูล Admin
 * 3. โหลดนักศึกษา
 * 4. โหลด Staff
 * 5. เพิ่มนักศึกษา
 * 6. เพิ่ม Staff
 * 7. Logout
 * 8. เปิด/ปิด Modal
 *******************************************************/


/*******************************************************
 * CONFIG
 *******************************************************/

const ADMIN_CONFIG = {

  API_URL:
    "https://script.google.com/macros/s/AKfycbxCvk2wb6FydCKNkEDvApbTgZWmSFoAzPvvM2sSDOIwSgvftMoQxIX3cy7npP3_6xT4/exec",

  ADMIN_SESSION_KEY:
    "admin_session",

  ADMIN_KEY:
    "admin_data"

};


/*******************************************************
 * GLOBAL
 *******************************************************/

let adminToken = "";

let adminData = null;

let studentsCache = [];

let staffCache = [];


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

  /*
   * อ่าน Session
   */

  adminToken =
    sessionStorage.getItem(
      ADMIN_CONFIG.ADMIN_SESSION_KEY
    ) || "";


  /*
   * อ่านข้อมูล Admin
   */

  const adminRaw =
    sessionStorage.getItem(
      ADMIN_CONFIG.ADMIN_KEY
    );


  if (adminRaw) {

    try {

      adminData =
        JSON.parse(adminRaw);

    } catch (error) {

      console.warn(
        "ไม่สามารถอ่าน admin_data",
        error
      );

      adminData = null;

    }

  }


  /*
   * ถ้าไม่มี token
   * ให้กลับหน้า login
   */

  if (!adminToken) {

    redirectToAdminLogin();

    return;

  }


  /*
   * แสดง Admin
   */

  renderAdminInfo();


  /*
   * Event ต่าง ๆ
   */

  bindEvents();


  /*
   * ตรวจ Session กับ Server
   */

  const sessionValid =
    await verifyAdminSession();


  if (!sessionValid) {

    return;

  }


  /*
   * โหลดข้อมูล
   */

  await Promise.all([

    loadStudents(),

    loadStaff()

  ]);

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
   * เพิ่มนักศึกษา
   */

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


  /*
   * ปิด Student Modal
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
   * ปุ่มยกเลิก Student
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
   * Form Student
   */

  const studentForm =
    document.getElementById(
      "studentForm"
    );


  if (studentForm) {

    studentForm.addEventListener(
      "submit",
      handleAddStudent
    );

  }


  /*
   * เพิ่ม Staff
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
   * ปิด Staff
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
   * ปุ่มยกเลิก Staff
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
   * Form Staff
   */

  const staffForm =
    document.getElementById(
      "staffForm"
    );


  if (staffForm) {

    staffForm.addEventListener(
      "submit",
      handleAddStaff
    );

  }


  /*
   * Search Student
   */

  const studentSearch =
    document.getElementById(
      "studentSearch"
    );


  if (studentSearch) {

    studentSearch.addEventListener(
      "input",
      handleStudentSearch
    );

  }


  /*
   * Click ด้านนอก Modal
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

function renderAdminInfo() {

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
      adminData &&
      adminData.name

        ? adminData.name

        : adminData &&
          adminData.username

          ? adminData.username

          : "Admin";

  }


  if (roleElement) {

    roleElement.textContent =
      adminData &&
      adminData.role

        ? adminData.role

        : "ADMIN";

  }

}


/*******************************************************
 * VERIFY ADMIN SESSION
 *******************************************************/

async function verifyAdminSession() {

  if (!adminToken) {

    redirectToAdminLogin();

    return false;

  }


  try {

    const result =
      await apiRequest({

        action:
          "adminSession",

        token:
          adminToken

      });


    /*
     * รองรับกรณี Backend
     * ยังไม่มี adminSession
     *
     * ถ้าไม่รู้จัก action
     * ให้ลอง adminGetStudents แทน
     */

    if (
      result &&
      result.success === false &&
      result.code ===
        "UNKNOWN_ACTION"
    ) {

      return true;

    }


    if (
      result &&
      result.success
    ) {

      if (result.admin) {

        adminData =
          result.admin;


        sessionStorage.setItem(

          ADMIN_CONFIG.ADMIN_KEY,

          JSON.stringify(
            result.admin
          )

        );


        renderAdminInfo();

      }


      return true;

    }


    /*
     * Session หมดอายุ
     */

    if (
      result &&
      (
        result.code ===
          "ADMIN_SESSION_EXPIRED" ||

        result.code ===
          "ADMIN_SESSION_INVALID"
      )
    ) {

      handleExpiredSession();

      return false;

    }


    /*
     * เพื่อให้ระบบรุ่นปัจจุบัน
     * ยังสามารถใช้งานได้
     *
     * เราจะตรวจ Session
     * ผ่าน adminGetStudents
     */

    const check =
      await apiRequest({

        action:
          "adminGetStudents",

        token:
          adminToken

      });


    if (
      check &&
      check.success
    ) {

      return true;

    }


    if (
      check &&
      check.code ===
        "ADMIN_SESSION_EXPIRED"
    ) {

      handleExpiredSession();

      return false;

    }


    return true;


  } catch (error) {

    console.error(
      "VERIFY ADMIN SESSION ERROR",
      error
    );

    /*
     * ไม่ redirect ทันที
     * เพราะ Network อาจมีปัญหา
     */

    showMessage(
      "ไม่สามารถตรวจสอบ Session ได้",
      "error"
    );

    return true;

  }

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

        <td colspan="8">
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
          adminToken

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

        handleExpiredSession();

        return;

      }


      throw new Error(

        result &&
        result.message

          ? result.message

          : "ไม่สามารถโหลดนักศึกษาได้"

      );

    }


    studentsCache =
      Array.isArray(
        result.students
      )

        ? result.students

        : [];


    renderStudents(
      studentsCache
    );


  } catch (error) {

    console.error(
      "LOAD STUDENTS ERROR",
      error
    );


    if (tbody) {

      tbody.innerHTML = `

        <tr>

          <td colspan="8">

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


/*******************************************************
 * RENDER STUDENTS
 *******************************************************/

function renderStudents(
  students
) {

  const tbody =
    document.getElementById(
      "studentsTableBody"
    );


  if (!tbody) {

    return;

  }


  if (
    !students ||
    students.length === 0
  ) {

    tbody.innerHTML = `

      <tr>

        <td colspan="8">

          ยังไม่มีข้อมูลนักศึกษา

        </td>

      </tr>

    `;

    return;

  }


  tbody.innerHTML =
    students
      .map(
        function(student) {

          const fullName =
            [

              student.prefix_th || "",

              student.firstname_th || "",

              student.lastname_th || ""

            ]
            .join(" ")
            .replace(
              /\s+/g,
              " "
            )
            .trim();


          const englishName =
            [

              student.firstname_en || "",

              student.lastname_en || ""

            ]
            .join(" ")
            .trim();


          return `

            <tr>

              <td>
                ${escapeHtml(
                  student.student_id
                )}
              </td>

              <td>
                ${escapeHtml(
                  fullName || "-"
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
                ${escapeHtml(
                  student.status || "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  formatDateDisplay(
                    student.issue_date
                  )
                )}
              </td>

              <td>
                ${escapeHtml(
                  formatDateDisplay(
                    student.expire_date
                  )
                )}
              </td>

            </tr>

          `;

        }
      )
      .join("");

}


/*******************************************************
 * SEARCH STUDENTS
 *******************************************************/

function handleStudentSearch() {

  const input =
    document.getElementById(
      "studentSearch"
    );


  if (!input) {

    return;

  }


  const keyword =
    input.value
      .trim()
      .toLowerCase();


  if (!keyword) {

    renderStudents(
      studentsCache
    );

    return;

  }


  const filtered =
    studentsCache.filter(
      function(student) {

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


        return text.indexOf(
          keyword
        ) !== -1;

      }
    );


  renderStudents(
    filtered
  );

}


/*******************************************************
 * LOAD STAFF
 *******************************************************/

async function loadStaff() {

  const tbody =
    document.getElementById(
      "staffTableBody"
    );


  if (tbody) {

    tbody.innerHTML = `

      <tr>

        <td colspan="5">
          กำลังโหลด Staff...
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
          adminToken

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

        handleExpiredSession();

        return;

      }


      throw new Error(

        result &&
        result.message

          ? result.message

          : "ไม่สามารถโหลด Staff ได้"

      );

    }


    staffCache =
      Array.isArray(
        result.staff
      )

        ? result.staff

        : [];


    renderStaff(
      staffCache
    );


  } catch (error) {

    console.error(
      "LOAD STAFF ERROR",
      error
    );


    if (tbody) {

      tbody.innerHTML = `

        <tr>

          <td colspan="5">

            ไม่สามารถโหลดข้อมูล Staff ได้

          </td>

        </tr>

      `;

    }

  }

}


/*******************************************************
 * RENDER STAFF
 *******************************************************/

function renderStaff(
  staff
) {

  const tbody =
    document.getElementById(
      "staffTableBody"
    );


  if (!tbody) {

    return;

  }


  if (
    !staff ||
    staff.length === 0
  ) {

    tbody.innerHTML = `

      <tr>

        <td colspan="5">

          ยังไม่มีข้อมูล Staff

        </td>

      </tr>

    `;

    return;

  }


  tbody.innerHTML =
    staff
      .map(
        function(item) {

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
 * OPEN STUDENT MODAL
 *******************************************************/

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


  const status =
    document.getElementById(
      "studentStatus"
    );


  if (status) {

    status.value =
      "นักศึกษาปกติ";

  }


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


  if (modal) {

    modal.classList.remove(
      "show"
    );

  }

}


/*******************************************************
 * HANDLE ADD STUDENT
 *******************************************************/

async function handleAddStudent(
  event
) {

  event.preventDefault();


  const button =
    document.getElementById(
      "saveStudentBtn"
    );


  const studentId =
    getValue(
      "studentId"
    );


  const password =
    getValue(
      "studentPassword"
    );


  const prefix =
    getValue(
      "studentPrefix"
    );


  const firstnameTh =
    getValue(
      "studentFirstnameTh"
    );


  const lastnameTh =
    getValue(
      "studentLastnameTh"
    );


  const firstnameEn =
    getValue(
      "studentFirstnameEn"
    );


  const lastnameEn =
    getValue(
      "studentLastnameEn"
    );


  const department =
    getValue(
      "studentDepartment"
    );


  const phone =
    getValue(
      "studentPhone"
    );


  const status =
    getValue(
      "studentStatus"
    );


  const issueDate =
    getValue(
      "studentIssueDate"
    );


  const expireDate =
    getValue(
      "studentExpireDate"
    );


  const photo =
    getValue(
      "studentPhoto"
    );


  if (
    !studentId ||
    !password ||
    !firstnameTh ||
    !lastnameTh
  ) {

    showMessage(
      "กรุณากรอกข้อมูลนักศึกษาให้ครบ",
      "error"
    );

    return;

  }


  if (
    password.length < 4
  ) {

    showMessage(
      "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร",
      "error"
    );

    return;

  }


  if (button) {

    button.disabled = true;

    button.textContent =
      "กำลังบันทึก...";

  }


  try {

    const result =
      await apiRequest({

        action:
          "adminAddStudent",

        token:
          adminToken,

        student_id:
          studentId,

        password:
          password,

        prefix_th:
          prefix,

        firstname_th:
          firstnameTh,

        lastname_th:
          lastnameTh,

        firstname_en:
          firstnameEn,

        lastname_en:
          lastnameEn,

        department:
          department,

        phone:
          phone,

        status:
          status,

        issue_date:
          issueDate,

        expire_date:
          expireDate,

        photo_url:
          photo

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

        handleExpiredSession();

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
      result.message ||
        "เพิ่มนักศึกษาสำเร็จ",
      "success"
    );


    closeStudentModalWindow();


    await loadStudents();


  } catch (error) {

    console.error(
      "ADD STUDENT ERROR",
      error
    );


    showMessage(
      error.message ||
        "ไม่สามารถเพิ่มนักศึกษาได้",
      "error"
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "บันทึกนักศึกษา";

    }

  }

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


  const role =
    document.getElementById(
      "staffRole"
    );


  if (role) {

    role.value =
      "STAFF";

  }


  const status =
    document.getElementById(
      "staffStatus"
    );


  if (status) {

    status.value =
      "ACTIVE";

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


  if (modal) {

    modal.classList.remove(
      "show"
    );

  }

}


/*******************************************************
 * HANDLE ADD STAFF
 *******************************************************/

async function handleAddStaff(
  event
) {

  event.preventDefault();


  const button =
    document.getElementById(
      "saveStaffBtn"
    );


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


  if (
    password.length < 4
  ) {

    showMessage(
      "รหัสผ่าน Staff ต้องมีอย่างน้อย 4 ตัวอักษร",
      "error"
    );

    return;

  }


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
          adminToken,

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
        result &&
        result.code ===
          "ADMIN_SESSION_EXPIRED"
      ) {

        handleExpiredSession();

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
      result.message ||
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


    showMessage(
      error.message ||
        "ไม่สามารถเพิ่ม Staff ได้",
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

      await apiRequest({

        action:
          "adminLogout",

        token:
          adminToken

      });

    }

  } catch (error) {

    console.warn(
      "ADMIN LOGOUT API ERROR",
      error
    );

  }


  sessionStorage.removeItem(
    ADMIN_CONFIG.ADMIN_SESSION_KEY
  );


  sessionStorage.removeItem(
    ADMIN_CONFIG.ADMIN_KEY
  );


  redirectToAdminLogin();

}


/*******************************************************
 * EXPIRED SESSION
 *******************************************************/

function handleExpiredSession() {

  sessionStorage.removeItem(
    ADMIN_CONFIG.ADMIN_SESSION_KEY
  );


  sessionStorage.removeItem(
    ADMIN_CONFIG.ADMIN_KEY
  );


  showMessage(
    "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่",
    "error"
  );


  setTimeout(
    function () {

      redirectToAdminLogin();

    },
    800
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
 * API REQUEST
 *******************************************************/

async function apiRequest(
  payload
) {

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


  console.log(
    "ADMIN API",
    payload.action,
    result
  );


  return result;

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
 * FORMAT DATE
 *******************************************************/

function formatDateDisplay(
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


  return text;

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
   * ซ่อนข้อความอัตโนมัติ
   */

  if (text) {

    setTimeout(
      function () {

        /*
         * ไม่ลบข้อความใหม่
         * ที่เพิ่งถูกแสดง
         */

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


/*******************************************************
 * DEBUG
 *******************************************************/

window.AdminDashboard = {

  loadStudents:
    loadStudents,

  loadStaff:
    loadStaff,

  openStudentModal:
    openStudentModal,

  openStaffModal:
    openStaffModal,

  logout:
    handleLogout

};
