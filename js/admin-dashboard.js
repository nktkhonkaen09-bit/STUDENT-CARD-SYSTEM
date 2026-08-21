/*******************************************************
 * ADMIN DASHBOARD JS
 *
 * Student Card System
 *******************************************************/


/*******************************************************
 * STATE
 *******************************************************/

const AdminDashboard = {

  token: "",

  admin: null,

  students: [],

  staff: [],

  requests: []

};


/*******************************************************
 * INIT
 *******************************************************/

document.addEventListener(
  "DOMContentLoaded",
  function() {

    initAdminDashboard();

  }
);


/*******************************************************
 * INITIALIZE
 *******************************************************/

function initAdminDashboard() {

  loadAdminSession();

  setupNavigation();

  setupForms();

  setupButtons();

  setupModalEvents();

}


/*******************************************************
 * GET API URL
 *
 * รองรับ config.js หลายรูปแบบ
 *******************************************************/

function getApiUrl() {

  try {

    if (
      typeof API_URL !== "undefined" &&
      API_URL
    ) {

      return String(
        API_URL
      );

    }

  } catch (e) {}


  try {

    if (
      typeof CONFIG !== "undefined" &&
      CONFIG &&
      CONFIG.API_URL
    ) {

      return String(
        CONFIG.API_URL
      );

    }

  } catch (e) {}


  try {

    if (
      typeof API_CONFIG !== "undefined" &&
      API_CONFIG &&
      API_CONFIG.API_URL
    ) {

      return String(
        API_CONFIG.API_URL
      );

    }

  } catch (e) {}


  /*
   * หากไม่มี ให้แก้ตรงนี้
   */

  return "";

}


/*******************************************************
 * GET SESSION TOKEN
 *******************************************************/

function loadAdminSession() {

  const possibleKeys = [

    "adminToken",
    "admin_token",
    "ADMIN_TOKEN",
    "adminSessionToken"

  ];


  let token =
    "";


  for (
    let i = 0;
    i < possibleKeys.length;
    i++
  ) {

    const value =
      localStorage.getItem(
        possibleKeys[i]
      );


    if (value) {

      token =
        value;

      break;

    }

  }


  /*
   * รองรับ session object
   */

  if (!token) {

    try {

      const session =
        JSON.parse(
          localStorage.getItem(
            "adminSession"
          ) || "null"
        );


      if (
        session &&
        session.token
      ) {

        token =
          session.token;

      }

    } catch (e) {}

  }


  AdminDashboard.token =
    token;


  if (!token) {

    redirectToAdminLogin();

    return;

  }


  /*
   * ตรวจ Session
   */

  verifyAdminSessionClient();

}


/*******************************************************
 * VERIFY SESSION
 *
 * ใช้ adminGetStudents
 * เพื่อยืนยัน session
 *******************************************************/

async function verifyAdminSessionClient() {

  try {

    const result =
      await apiRequest({

        action:
          "adminGetStudents",

        token:
          AdminDashboard.token,

        search:
          ""

      });


    if (
      !result.success
    ) {

      redirectToAdminLogin();

      return;

    }


    /*
     * โหลดข้อมูลหลัง Session ผ่าน
     */

    showAdminInfo();

    loadStudents();

    loadStaff();

    loadResetRequests();

  } catch (error) {

    console.error(error);

    showToast(
      error.message ||
      "ไม่สามารถเชื่อมต่อระบบได้",
      "error"
    );

  }

}


/*******************************************************
 * SHOW ADMIN INFO
 *******************************************************/

function showAdminInfo() {

  let admin =
    AdminDashboard.admin;


  /*
   * ถ้ายังไม่มีข้อมูล admin
   * ให้ลองอ่านจาก localStorage
   */

  if (!admin) {

    try {

      admin =
        JSON.parse(
          localStorage.getItem(
            "admin"
          ) || "null"
        );

    } catch (e) {}

  }


  if (!admin) {

    try {

      const session =
        JSON.parse(
          localStorage.getItem(
            "adminSession"
          ) || "null"
        );


      if (
        session &&
        session.admin
      ) {

        admin =
          session.admin;

      }

    } catch (e) {}

  }


  AdminDashboard.admin =
    admin || {};


  const name =
    AdminDashboard.admin.name ||
    AdminDashboard.admin.username ||
    "Admin";


  const role =
    String(
      AdminDashboard.admin.role ||
      "ADMIN"
    ).toUpperCase();


  document.getElementById(
    "adminName"
  ).textContent =
    name;


  document.getElementById(
    "adminRole"
  ).textContent =
    role;


  /*
   * ซ่อนเมนู ADMIN จาก STAFF
   */

  document
    .querySelectorAll(
      ".admin-only"
    )
    .forEach(
      function(element) {

        if (
          role !== "ADMIN"
        ) {

          element.style.display =
            "none";

        }

      }
    );

}


/*******************************************************
 * API REQUEST
 *******************************************************/

async function apiRequest(payload) {

  const url =
    getApiUrl();


  if (!url) {

    throw new Error(
      "ไม่พบ API URL กรุณาตรวจสอบ js/config.js"
    );

  }


  const response =
    await fetch(
      url,
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


  const text =
    await response.text();


  let result;


  try {

    result =
      JSON.parse(text);

  } catch (error) {

    console.error(
      "API RAW RESPONSE:",
      text
    );


    throw new Error(
      "API ส่งข้อมูลกลับมาไม่ถูกต้อง"
    );

  }


  if (
    result &&
    (
      result.code ===
        "ADMIN_SESSION_EXPIRED" ||
      result.code ===
        "STUDENT_SESSION_EXPIRED"
    )
  ) {

    redirectToAdminLogin();

  }


  return result;

}


/*******************************************************
 * REDIRECT LOGIN
 *******************************************************/

function redirectToAdminLogin() {

  localStorage.removeItem(
    "adminToken"
  );

  localStorage.removeItem(
    "admin_token"
  );

  localStorage.removeItem(
    "ADMIN_TOKEN"
  );

  localStorage.removeItem(
    "adminSessionToken"
  );


  window.location.href =
    "admin-login.html";

}


/*******************************************************
 * NAVIGATION
 *******************************************************/

function setupNavigation() {

  document
    .querySelectorAll(
      "[data-section]"
    )
    .forEach(
      function(button) {

        button.addEventListener(
          "click",
          function() {

            const section =
              this.dataset.section;


            showSection(
              section
            );

          }
        );

      }
    );

}


/*******************************************************
 * SHOW SECTION
 *******************************************************/

function showSection(
  section
) {

  document
    .querySelectorAll(
      ".page-section"
    )
    .forEach(
      function(item) {

        item.classList.remove(
          "active"
        );

      }
    );


  const target =
    document.getElementById(
      "section-" +
      section
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
      function(item) {

        item.classList.remove(
          "active"
        );


        if (
          item.dataset.section ===
          section
        ) {

          item.classList.add(
            "active"
          );

        }

      }
    );


  const titles = {

    overview:
      [
        "ภาพรวม",
        "ระบบจัดการ Student Card"
      ],

    students:
      [
        "นักศึกษา",
        "รายชื่อและข้อมูลนักศึกษา"
      ],

    "add-student":
      [
        "เพิ่มนักศึกษา",
        "สร้างบัญชีนักศึกษาใหม่"
      ],

    staff:
      [
        "Staff / Admin",
        "จัดการบัญชีเจ้าหน้าที่"
      ],

    "add-staff":
      [
        "เพิ่ม Staff",
        "สร้างบัญชีเจ้าหน้าที่ใหม่"
      ],

    "reset-requests":
      [
        "คำร้องลืมรหัสผ่าน",
        "ตรวจสอบคำร้องจากนักศึกษา"
      ]

  };


  const title =
    titles[section] ||
    titles.overview;


  document.getElementById(
    "pageTitle"
  ).textContent =
    title[0];


  document.getElementById(
    "pageSubtitle"
  ).textContent =
    title[1];


  /*
   * โหลดข้อมูลใหม่เมื่อเปิดหน้า
   */

  if (
    section === "students"
  ) {

    loadStudents();

  }


  if (
    section === "staff"
  ) {

    loadStaff();

  }


  if (
    section === "reset-requests"
  ) {

    loadResetRequests();

  }

}


/*******************************************************
 * SETUP BUTTONS
 *******************************************************/

function setupButtons() {

  /*
   * Logout
   */

  document
    .getElementById(
      "logoutBtn"
    )
    .addEventListener(
      "click",
      logoutAdmin
    );


  /*
   * Student search
   */

  document
    .getElementById(
      "studentSearchBtn"
    )
    .addEventListener(
      "click",
      loadStudents
    );


  document
    .getElementById(
      "studentRefreshBtn"
    )
    .addEventListener(
      "click",
      function() {

        document.getElementById(
          "studentSearch"
        ).value = "";

        loadStudents();

      }
    );


  document
    .getElementById(
      "studentSearch"
    )
    .addEventListener(
      "keydown",
      function(event) {

        if (
          event.key ===
          "Enter"
        ) {

          event.preventDefault();

          loadStudents();

        }

      }
    );


  /*
   * Staff
   */

  document
    .getElementById(
      "staffRefreshBtn"
    )
    .addEventListener(
      "click",
      loadStaff
    );


  document
    .getElementById(
      "staffSearch"
    )
    .addEventListener(
      "input",
      filterStaff
    );


  /*
   * Reset
   */

  document
    .getElementById(
      "resetRefreshBtn"
    )
    .addEventListener(
      "click",
      loadResetRequests
    );


  /*
   * Clear forms
   */

  document
    .getElementById(
      "clearStudentFormBtn"
    )
    .addEventListener(
      "click",
      function() {

        document
          .getElementById(
            "addStudentForm"
          )
          .reset();

      }
    );


  document
    .getElementById(
      "clearStaffFormBtn"
    )
    .addEventListener(
      "click",
      function() {

        document
          .getElementById(
            "addStaffForm"
          )
          .reset();

      }
    );

}


/*******************************************************
 * SETUP FORMS
 *******************************************************/

function setupForms() {

  document
    .getElementById(
      "addStudentForm"
    )
    .addEventListener(
      "submit",
      addStudent
    );


  document
    .getElementById(
      "editStudentForm"
    )
    .addEventListener(
      "submit",
      updateStudent
    );


  document
    .getElementById(
      "addStaffForm"
    )
    .addEventListener(
      "submit",
      addStaff
    );


  document
    .getElementById(
      "editStaffForm"
    )
    .addEventListener(
      "submit",
      updateStaff
    );

}


/*******************************************************
 * ADD STUDENT
 *******************************************************/

async function addStudent(event) {

  event.preventDefault();


  const form =
    event.target;


  const payload = {

    action:
      "adminAddStudent",

    token:
      AdminDashboard.token,

    student_id:
      document.getElementById(
        "add_student_id"
      ).value.trim(),

    password:
      document.getElementById(
        "add_student_password"
      ).value,

    prefix_th:
      document.getElementById(
        "add_prefix_th"
      ).value,

    firstname_th:
      document.getElementById(
        "add_firstname_th"
      ).value.trim(),

    lastname_th:
      document.getElementById(
        "add_lastname_th"
      ).value.trim(),

    firstname_en:
      document.getElementById(
        "add_firstname_en"
      ).value.trim(),

    lastname_en:
      document.getElementById(
        "add_lastname_en"
      ).value.trim(),

    status:
      document.getElementById(
        "add_status"
      ).value,

    department:
      document.getElementById(
        "add_department"
      ).value.trim(),

    phone:
      document.getElementById(
        "add_phone"
      ).value.trim(),

    issue_date:
      document.getElementById(
        "add_issue_date"
      ).value,

    expire_date:
      document.getElementById(
        "add_expire_date"
      ).value,

    photo_url:
      document.getElementById(
        "add_photo_url"
      ).value.trim()

  };


  if (
    !payload.student_id ||
    !payload.password
  ) {

    showToast(
      "กรุณากรอกรหัสนักศึกษาและรหัสผ่าน",
      "error"
    );

    return;

  }


  try {

    showLoadingButton(
      form,
      true
    );


    const result =
      await apiRequest(
        payload
      );


    if (
      !result.success
    ) {

      showToast(
        result.message ||
        "เพิ่มนักศึกษาไม่สำเร็จ",
        "error"
      );

      return;

    }


    showToast(
      "เพิ่มนักศึกษาสำเร็จ: " +
      result.student_id,
      "success"
    );


    form.reset();


    await loadStudents();


    showSection(
      "students"
    );


  } catch (error) {

    console.error(error);

    showToast(
      error.message,
      "error"
    );

  } finally {

    showLoadingButton(
      form,
      false
    );

  }

}


/*******************************************************
 * LOAD STUDENTS
 *******************************************************/

async function loadStudents() {

  try {

    const search =
      document.getElementById(
        "studentSearch"
      ).value.trim();


    const result =
      await apiRequest({

        action:
          "adminGetStudents",

        token:
          AdminDashboard.token,

        search:
          search

      });


    if (
      !result.success
    ) {

      showToast(
        result.message ||
        "โหลดข้อมูลนักศึกษาไม่สำเร็จ",
        "error"
      );

      return;

    }


    AdminDashboard.students =
      result.students || [];


    renderStudents();


    document.getElementById(
      "totalStudents"
    ).textContent =
      AdminDashboard.students.length;


  } catch (error) {

    console.error(error);

    showToast(
      error.message,
      "error"
    );

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


  tbody.innerHTML =
    "";


  if (
    !AdminDashboard.students.length
  ) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="6"
          class="empty"
        >
          ไม่พบข้อมูลนักศึกษา
        </td>

      </tr>

    `;

    return;

  }


  AdminDashboard.students.forEach(
    function(student) {

      const tr =
        document.createElement(
          "tr"
        );


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


      tr.innerHTML = `

        <td>
          <strong>
            ${escapeHtml(
              student.student_id
            )}
          </strong>
        </td>

        <td>
          ${escapeHtml(
            fullName || "-"
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
          ${statusBadge(
            student.status
          )}
        </td>

        <td>

          <button
            class="table-btn edit"
            data-edit-student="${escapeAttr(
              student.student_id
            )}"
          >
            ✏️ แก้ไข
          </button>

        </td>

      `;


      tbody.appendChild(
        tr
      );

    }
  );


  tbody
    .querySelectorAll(
      "[data-edit-student]"
    )
    .forEach(
      function(button) {

        button.addEventListener(
          "click",
          function() {

            openStudentEdit(
              this.dataset.editStudent
            );

          }
        );

      }
    );

}


/*******************************************************
 * OPEN STUDENT EDIT
 *******************************************************/

function openStudentEdit(
  studentId
) {

  const student =
    AdminDashboard.students.find(
      function(item) {

        return String(
          item.student_id
        ) ===
        String(studentId);

      }
    );


  if (!student) {

    showToast(
      "ไม่พบข้อมูลนักศึกษา",
      "error"
    );

    return;

  }


  document.getElementById(
    "edit_student_id"
  ).value =
    student.student_id || "";


  document.getElementById(
    "studentModalId"
  ).textContent =
    "รหัสนักศึกษา: " +
    (student.student_id || "-");


  document.getElementById(
    "edit_prefix_th"
  ).value =
    student.prefix_th || "";


  document.getElementById(
    "edit_firstname_th"
  ).value =
    student.firstname_th || "";


  document.getElementById(
    "edit_lastname_th"
  ).value =
    student.lastname_th || "";


  document.getElementById(
    "edit_firstname_en"
  ).value =
    student.firstname_en || "";


  document.getElementById(
    "edit_lastname_en"
  ).value =
    student.lastname_en || "";


  document.getElementById(
    "edit_status"
  ).value =
    normalizeStatus(
      student.status
    );


  document.getElementById(
    "edit_department"
  ).value =
    student.department || "";


  document.getElementById(
    "edit_phone"
  ).value =
    student.phone || "";


  document.getElementById(
    "edit_issue_date"
  ).value =
    convertDateForInput(
      student.issue_date
    );


  document.getElementById(
    "edit_expire_date"
  ).value =
    convertDateForInput(
      student.expire_date
    );


  document.getElementById(
    "edit_photo_url"
  ).value =
    student.photo_url || "";


  document.getElementById(
    "edit_student_password"
  ).value =
    "";


  openModal(
    "studentModal"
  );

}


/*******************************************************
 * UPDATE STUDENT
 *******************************************************/

async function updateStudent(
  event
) {

  event.preventDefault();


  const form =
    event.target;


  const payload = {

    action:
      "adminUpdateStudent",

    token:
      AdminDashboard.token,

    student_id:
      document.getElementById(
        "edit_student_id"
      ).value,

    prefix_th:
      document.getElementById(
        "edit_prefix_th"
      ).value.trim(),

    firstname_th:
      document.getElementById(
        "edit_firstname_th"
      ).value.trim(),

    lastname_th:
      document.getElementById(
        "edit_lastname_th"
      ).value.trim(),

    firstname_en:
      document.getElementById(
        "edit_firstname_en"
      ).value.trim(),

    lastname_en:
      document.getElementById(
        "edit_lastname_en"
      ).value.trim(),

    status:
      document.getElementById(
        "edit_status"
      ).value,

    department:
      document.getElementById(
        "edit_department"
      ).value.trim(),

    phone:
      document.getElementById(
        "edit_phone"
      ).value.trim(),

    issue_date:
      document.getElementById(
        "edit_issue_date"
      ).value,

    expire_date:
      document.getElementById(
        "edit_expire_date"
      ).value,

    photo_url:
      document.getElementById(
        "edit_photo_url"
      ).value.trim(),

    password:
      document.getElementById(
        "edit_student_password"
      ).value

  };


  try {

    showLoadingButton(
      form,
      true
    );


    const result =
      await apiRequest(
        payload
      );


    if (
      !result.success
    ) {

      showToast(
        result.message ||
        "แก้ไขข้อมูลไม่สำเร็จ",
        "error"
      );

      return;

    }


    showToast(
      "บันทึกข้อมูลนักศึกษาสำเร็จ",
      "success"
    );


    closeModal(
      "studentModal"
    );


    await loadStudents();


  } catch (error) {

    console.error(error);

    showToast(
      error.message,
      "error"
    );

  } finally {

    showLoadingButton(
      form,
      false
    );

  }

}


/*******************************************************
 * ADD STAFF
 *******************************************************/

async function addStaff(
  event
) {

  event.preventDefault();


  /*
   * ตรวจ Role
   */

  if (
    getCurrentRole() !==
    "ADMIN"
  ) {

    showToast(
      "เฉพาะ ADMIN เท่านั้นที่สามารถเพิ่ม Staff ได้",
      "error"
    );

    return;

  }


  const form =
    event.target;


  const payload = {

    action:
      "adminAddStaff",

    token:
      AdminDashboard.token,

    admin_id:
      document.getElementById(
        "add_admin_id"
      ).value.trim(),

    username:
      document.getElementById(
        "add_username"
      ).value.trim(),

    password:
      document.getElementById(
        "add_staff_password"
      ).value,

    name:
      document.getElementById(
        "add_staff_name"
      ).value.trim(),

    role:
      document.getElementById(
        "add_staff_role"
      ).value,

    status:
      document.getElementById(
        "add_staff_status"
      ).value

  };


  try {

    showLoadingButton(
      form,
      true
    );


    const result =
      await apiRequest(
        payload
      );


    if (
      !result.success
    ) {

      showToast(
        result.message ||
        "เพิ่ม Staff ไม่สำเร็จ",
        "error"
      );

      return;

    }


    showToast(
      "เพิ่ม Staff สำเร็จ: " +
      result.admin_id,
      "success"
    );


    form.reset();


    await loadStaff();


    showSection(
      "staff"
    );


  } catch (error) {

    console.error(error);

    showToast(
      error.message,
      "error"
    );

  } finally {

    showLoadingButton(
      form,
      false
    );

  }

}


/*******************************************************
 * LOAD STAFF
 *******************************************************/

async function loadStaff() {

  try {

    const result =
      await apiRequest({

        action:
          "adminGetStaff",

        token:
          AdminDashboard.token

      });


    if (
      !result.success
    ) {

      showToast(
        result.message ||
        "โหลด Staff ไม่สำเร็จ",
        "error"
      );

      return;

    }


    AdminDashboard.staff =
      result.staff || [];


    renderStaff();


    document.getElementById(
      "totalStaff"
    ).textContent =
      AdminDashboard.staff.length;


  } catch (error) {

    console.error(error);

    showToast(
      error.message,
      "error"
    );

  }

}


/*******************************************************
 * FILTER STAFF
 *******************************************************/

function filterStaff() {

  renderStaff();

}


/*******************************************************
 * RENDER STAFF
 *******************************************************/

function renderStaff() {

  const tbody =
    document.getElementById(
      "staffTableBody"
    );


  const search =
    document.getElementById(
      "staffSearch"
    ).value
    .trim()
    .toLowerCase();


  let rows =
    AdminDashboard.staff;


  if (search) {

    rows =
      rows.filter(
        function(item) {

          const text =
            [

              item.admin_id,
              item.username,
              item.name,
              item.role,
              item.status

            ]
            .join(" ")
            .toLowerCase();


          return text.includes(
            search
          );

        }
      );

  }


  tbody.innerHTML =
    "";


  if (!rows.length) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="6"
          class="empty"
        >
          ไม่พบข้อมูล Staff
        </td>

      </tr>

    `;

    return;

  }


  rows.forEach(
    function(item) {

      const tr =
        document.createElement(
          "tr"
        );


      tr.innerHTML = `

        <td>
          <strong>
            ${escapeHtml(
              item.admin_id || "-"
            )}
          </strong>
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
          ${roleBadge(
            item.role
          )}
        </td>

        <td>
          ${statusBadge(
            item.status
          )}
        </td>

        <td>

          <button
            class="table-btn edit"
            data-edit-staff="${escapeAttr(
              item.admin_id
            )}"
          >
            ✏️
          </button>

          ${
            String(
              item.role || ""
            ).toUpperCase() === "STAFF"

            ? `

              <button
                class="table-btn delete"
                data-delete-staff="${escapeAttr(
                  item.admin_id
                )}"
              >
                🗑️
              </button>

            `

            : ""

          }

        </td>

      `;


      tbody.appendChild(
        tr
      );

    }
  );


  tbody
    .querySelectorAll(
      "[data-edit-staff]"
    )
    .forEach(
      function(button) {

        button.addEventListener(
          "click",
          function() {

            openStaffEdit(
              this.dataset.editStaff
            );

          }
        );

      }
    );


  tbody
    .querySelectorAll(
      "[data-delete-staff]"
    )
    .forEach(
      function(button) {

        button.addEventListener(
          "click",
          function() {

            deleteStaff(
              this.dataset.deleteStaff
            );

          }
        );

      }
    );

}


/*******************************************************
 * OPEN STAFF EDIT
 *******************************************************/

function openStaffEdit(
  adminId
) {

  const item =
    AdminDashboard.staff.find(
      function(staff) {

        return String(
          staff.admin_id
        ) ===
        String(adminId);

      }
    );


  if (!item) {

    showToast(
      "ไม่พบข้อมูล Staff",
      "error"
    );

    return;

  }


  document.getElementById(
    "edit_admin_id"
  ).value =
    item.admin_id || "";


  document.getElementById(
    "staffModalId"
  ).textContent =
    "รหัส: " +
    (item.admin_id || "-");


  document.getElementById(
    "edit_username"
  ).value =
    item.username || "";


  document.getElementById(
    "edit_staff_name"
  ).value =
    item.name || "";


  document.getElementById(
    "edit_staff_role"
  ).value =
    normalizeRole(
      item.role
    );


  document.getElementById(
    "edit_staff_status"
  ).value =
    normalizeStatus(
      item.status
    );


  document.getElementById(
    "edit_staff_password"
  ).value =
    "";


  openModal(
    "staffModal"
  );

}


/*******************************************************
 * UPDATE STAFF
 *******************************************************/

async function updateStaff(
  event
) {

  event.preventDefault();


  if (
    getCurrentRole() !==
    "ADMIN"
  ) {

    showToast(
      "เฉพาะ ADMIN เท่านั้นที่สามารถแก้ไข Staff ได้",
      "error"
    );

    return;

  }


  const form =
    event.target;


  const payload = {

    action:
      "adminUpdateStaff",

    token:
      AdminDashboard.token,

    admin_id:
      document.getElementById(
        "edit_admin_id"
      ).value,

    username:
      document.getElementById(
        "edit_username"
      ).value.trim(),

    name:
      document.getElementById(
        "edit_staff_name"
      ).value.trim(),

    role:
      document.getElementById(
        "edit_staff_role"
      ).value,

    status:
      document.getElementById(
        "edit_staff_status"
      ).value,

    password:
      document.getElementById(
        "edit_staff_password"
      ).value

  };


  try {

    showLoadingButton(
      form,
      true
    );


    const result =
      await apiRequest(
        payload
      );


    if (
      !result.success
    ) {

      showToast(
        result.message ||
        "แก้ไข Staff ไม่สำเร็จ",
        "error"
      );

      return;

    }


    showToast(
      "แก้ไข Staff สำเร็จ",
      "success"
    );


    closeModal(
      "staffModal"
    );


    await loadStaff();


  } catch (error) {

    console.error(error);

    showToast(
      error.message,
      "error"
    );

  } finally {

    showLoadingButton(
      form,
      false
    );

  }

}


/*******************************************************
 * DELETE STAFF
 *******************************************************/

async function deleteStaff(
  adminId
) {

  if (
    getCurrentRole() !==
    "ADMIN"
  ) {

    showToast(
      "ไม่มีสิทธิ์ลบ Staff",
      "error"
    );

    return;

  }


  const item =
    AdminDashboard.staff.find(
      function(staff) {

        return String(
          staff.admin_id
        ) ===
        String(adminId);

      }
    );


  if (!item) {

    return;

  }


  const confirmed =
    window.confirm(

      "คุณต้องการลบ Staff\n\n" +
      "รหัส: " +
      (item.admin_id || "") +
      "\n" +
      "Username: " +
      (item.username || "") +
      "\n\n" +
      "การลบไม่สามารถย้อนกลับได้"

    );


  if (!confirmed) {

    return;

  }


  try {

    const result =
      await apiRequest({

        action:
          "adminDeleteStaff",

        token:
          AdminDashboard.token,

        admin_id:
          adminId

      });


    if (
      !result.success
    ) {

      showToast(
        result.message ||
        "ลบ Staff ไม่สำเร็จ",
        "error"
      );

      return;

    }


    showToast(
      "ลบ Staff สำเร็จ",
      "success"
    );


    await loadStaff();


  } catch (error) {

    console.error(error);

    showToast(
      error.message,
      "error"
    );

  }

}


/*******************************************************
 * LOAD RESET REQUESTS
 *******************************************************/

async function loadResetRequests() {

  try {

    const result =
      await apiRequest({

        action:
          "adminGetResetRequests",

        token:
          AdminDashboard.token

      });


    if (
      !result.success
    ) {

      showToast(
        result.message ||
        "โหลดคำร้องไม่สำเร็จ",
        "error"
      );

      return;

    }


    AdminDashboard.requests =
      result.requests || [];


    renderResetRequests();


    const pending =
      AdminDashboard.requests.filter(
        function(item) {

          return String(
            item.status || ""
          ).toUpperCase()
          === "PENDING";

        }
      ).length;


    document.getElementById(
      "pendingRequests"
    ).textContent =
      pending;


  } catch (error) {

    console.error(error);

    showToast(
      error.message,
      "error"
    );

  }

}


/*******************************************************
 * RENDER RESET REQUESTS
 *******************************************************/

function renderResetRequests() {

  const tbody =
    document.getElementById(
      "resetTableBody"
    );


  tbody.innerHTML =
    "";


  if (
    !AdminDashboard.requests.length
  ) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="6"
          class="empty"
        >
          ไม่มีคำร้อง
        </td>

      </tr>

    `;

    return;

  }


  AdminDashboard.requests.forEach(
    function(item) {

      const tr =
        document.createElement(
          "tr"
        );


      const status =
        String(
          item.status || ""
        ).toUpperCase();


      let actionHtml =
        "-";


      if (
        status === "PENDING"
      ) {

        actionHtml = `

          <button
            class="table-btn approve"
            data-approve="${escapeAttr(
              item.request_id
            )}"
          >
            ✓ อนุมัติ
          </button>

          <button
            class="table-btn reject"
            data-reject="${escapeAttr(
              item.request_id
            )}"
          >
            ✕ ปฏิเสธ
          </button>

        `;

      }


      if (
        status === "APPROVED"
      ) {

        actionHtml = `

          <button
            class="table-btn reset"
            data-reset="${escapeAttr(
              item.request_id
            )}"
          >
            🔑 รีเซ็ตรหัสผ่าน
          </button>

        `;

      }


      tr.innerHTML = `

        <td>
          ${escapeHtml(
            item.request_id || "-"
          )}
        </td>

        <td>
          ${escapeHtml(
            item.student_id || "-"
          )}
        </td>

        <td>
          ${escapeHtml(
            item.reason ||
            item.note ||
            "-"
          )}
        </td>

        <td>
          ${statusBadge(
            item.status
          )}
        </td>

        <td>
          ${escapeHtml(
            item.requested_at || "-"
          )}
        </td>

        <td>
          <div class="action-group">
            ${actionHtml}
          </div>
        </td>

      `;


      tbody.appendChild(
        tr
      );

    }
  );


  /*
   * Approve
   */

  tbody
    .querySelectorAll(
      "[data-approve]"
    )
    .forEach(
      function(button) {

        button.addEventListener(
          "click",
          function() {

            approveReset(
              this.dataset.approve
            );

          }
        );

      }
    );


  /*
   * Reject
   */

  tbody
    .querySelectorAll(
      "[data-reject]"
    )
    .forEach(
      function(button) {

        button.addEventListener(
          "click",
          function() {

            rejectReset(
              this.dataset.reject
            );

          }
        );

      }
    );


  /*
   * Reset
   */

  tbody
    .querySelectorAll(
      "[data-reset]"
    )
    .forEach(
      function(button) {

        button.addEventListener(
          "click",
          function() {

            resetStudentPassword(
              this.dataset.reset
            );

          }
        );

      }
    );

}


/*******************************************************
 * APPROVE RESET
 *******************************************************/

async function approveReset(
  requestId
) {

  const confirmed =
    window.confirm(
      "ต้องการอนุมัติคำร้องนี้หรือไม่?"
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
          AdminDashboard.token,

        request_id:
          requestId

      });


    if (
      !result.success
    ) {

      showToast(
        result.message,
        "error"
      );

      return;

    }


    showToast(
      "อนุมัติคำร้องสำเร็จ",
      "success"
    );


    loadResetRequests();


  } catch (error) {

    showToast(
      error.message,
      "error"
    );

  }

}


/*******************************************************
 * REJECT RESET
 *******************************************************/

async function rejectReset(
  requestId
) {

  const note =
    window.prompt(
      "ระบุเหตุผลที่ปฏิเสธ",
      ""
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
          AdminDashboard.token,

        request_id:
          requestId,

        note:
          note

      });


    if (
      !result.success
    ) {

      showToast(
        result.message,
        "error"
      );

      return;

    }


    showToast(
      "ปฏิเสธคำร้องสำเร็จ",
      "success"
    );


    loadResetRequests();


  } catch (error) {

    showToast(
      error.message,
      "error"
    );

  }

}


/*******************************************************
 * RESET PASSWORD
 *******************************************************/

async function resetStudentPassword(
  requestId
) {

  const password =
    window.prompt(
      "กรุณากำหนดรหัสผ่านใหม่\n\nเว้นว่าง = ใช้ 123456",
      ""
    );


  if (
    password === null
  ) {

    return;

  }


  if (
    password &&
    password.length < 4
  ) {

    showToast(
      "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร",
      "error"
    );

    return;

  }


  try {

    const result =
      await apiRequest({

        action:
          "adminResetPassword",

        token:
          AdminDashboard.token,

        request_id:
          requestId,

        newPassword:
          password

      });


    if (
      !result.success
    ) {

      showToast(
        result.message,
        "error"
      );

      return;

    }


    showToast(
      "รีเซ็ตรหัสผ่านสำเร็จ",
      "success"
    );


    /*
     * แจ้งรหัสผ่านให้ Admin ทราบ
     */

    window.alert(

      "รีเซ็ตรหัสผ่านสำเร็จ\n\n" +
      "รหัสนักศึกษา: " +
      result.student_id +
      "\n" +
      "รหัสผ่านใหม่: " +
      result.password

    );


    loadResetRequests();


  } catch (error) {

    showToast(
      error.message,
      "error"
    );

  }

}


/*******************************************************
 * LOGOUT
 *******************************************************/

async function logoutAdmin() {

  try {

    await apiRequest({

      action:
        "adminLogout",

      token:
        AdminDashboard.token

    });

  } catch (error) {

    console.error(error);

  }


  localStorage.removeItem(
    "adminToken"
  );

  localStorage.removeItem(
    "admin_token"
  );

  localStorage.removeItem(
    "ADMIN_TOKEN"
  );

  localStorage.removeItem(
    "adminSessionToken"
  );

  localStorage.removeItem(
    "admin"
  );

  localStorage.removeItem(
    "adminSession"
  );


  window.location.href =
    "admin-login.html";

}


/*******************************************************
 * MODAL
 *******************************************************/

function setupModalEvents() {

  document
    .querySelectorAll(
      "[data-close-modal]"
    )
    .forEach(
      function(button) {

        button.addEventListener(
          "click",
          function() {

            closeModal(
              this.dataset.closeModal
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".modal"
    )
    .forEach(
      function(modal) {

        modal.addEventListener(
          "click",
          function(event) {

            if (
              event.target ===
              modal
            ) {

              closeModal(
                modal.id
              );

            }

          }
        );

      }
    );

}


/*******************************************************
 * OPEN MODAL
 *******************************************************/

function openModal(
  id
) {

  const modal =
    document.getElementById(
      id
    );


  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }

}


/*******************************************************
 * CLOSE MODAL
 *******************************************************/

function closeModal(
  id
) {

  const modal =
    document.getElementById(
      id
    );


  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

}


/*******************************************************
 * CURRENT ROLE
 *******************************************************/

function getCurrentRole() {

  return String(
    AdminDashboard.admin &&
    AdminDashboard.admin.role
      ? AdminDashboard.admin.role
      : "ADMIN"
  )
  .trim()
  .toUpperCase();

}


/*******************************************************
 * STATUS
 *******************************************************/

function normalizeStatus(
  status
) {

  const value =
    String(
      status || ""
    )
    .trim()
    .toUpperCase();


  if (
    value === "INACTIVE" ||
    value === "DISABLED" ||
    value === "SUSPENDED"
  ) {

    return "INACTIVE";

  }


  return "ACTIVE";

}


/*******************************************************
 * ROLE
 *******************************************************/

function normalizeRole(
  role
) {

  const value =
    String(
      role || "STAFF"
    )
    .trim()
    .toUpperCase();


  return value === "ADMIN"
    ? "ADMIN"
    : "STAFF";

}


/*******************************************************
 * STATUS BADGE
 *******************************************************/

function statusBadge(
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

    return `

      <span class="badge success">
        ${escapeHtml(
          status || "ACTIVE"
        )}
      </span>

    `;

  }


  return `

    <span class="badge danger">
      ${escapeHtml(
        status || "INACTIVE"
      )}
    </span>

  `;

}


/*******************************************************
 * ROLE BADGE
 *******************************************************/

function roleBadge(
  role
) {

  const value =
    String(
      role || "STAFF"
    )
    .trim()
    .toUpperCase();


  if (
    value === "ADMIN"
  ) {

    return `

      <span class="badge purple">
        ADMIN
      </span>

    `;

  }


  return `

    <span class="badge blue">
      STAFF
    </span>

  `;

}


/*******************************************************
 * DATE CONVERTER
 *******************************************************/

function convertDateForInput(
  value
) {

  if (!value) {
    return "";
  }


  const text =
    String(value)
    .trim();


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
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
    );


  if (match) {

    const day =
      match[1].padStart(
        2,
        "0"
      );


    const month =
      match[2].padStart(
        2,
        "0"
      );


    const year =
      match[3];


    return (
      year +
      "-" +
      month +
      "-" +
      day
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
 * ESCAPE ATTRIBUTE
 *******************************************************/

function escapeAttr(
  value
) {

  return escapeHtml(
    value
  );

}


/*******************************************************
 * TOAST
 *******************************************************/

let toastTimer =
  null;


function showToast(
  message,
  type
) {

  const toast =
    document.getElementById(
      "toast"
    );


  toast.textContent =
    message || "";


  toast.className =
    "toast " +
    (
      type === "error"
        ? "error"
        : "success"
    );


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      function() {

        toast.classList.remove(
          "show"
        );

      },
      3500
    );

}


/*******************************************************
 * BUTTON LOADING
 *******************************************************/

function showLoadingButton(
  form,
  loading
) {

  const button =
    form.querySelector(
      'button[type="submit"]'
    );


  if (!button) {
    return;
  }


  if (loading) {

    button.dataset.originalText =
      button.innerHTML;


    button.disabled =
      true;


    button.innerHTML =
      "⏳ กำลังบันทึก...";

  } else {

    button.disabled =
      false;


    if (
      button.dataset.originalText
    ) {

      button.innerHTML =
        button.dataset.originalText;

    }

  }

}
