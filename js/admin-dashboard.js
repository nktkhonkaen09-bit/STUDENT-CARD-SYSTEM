/*******************************************************
 * ADMIN DASHBOARD JS
 *******************************************************/

(function () {

  "use strict";


  /*****************************************************
   * CONFIG
   *****************************************************/

  const API =
    window.API_URL ||
    window.GAS_API_URL ||
    "";


  /*****************************************************
   * ELEMENTS
   *****************************************************/

  const $ = function (id) {
    return document.getElementById(id);
  };


  /*****************************************************
   * SESSION
   *****************************************************/

  function getToken() {

    return (
      sessionStorage.getItem("admin_token") ||
      localStorage.getItem("admin_token") ||
      ""
    );

  }


  function getAdmin() {

    try {

      return JSON.parse(
        sessionStorage.getItem(
          "admin_data"
        ) || "{}"
      );

    } catch (error) {

      return {};

    }

  }


  /*****************************************************
   * CHECK LOGIN
   *****************************************************/

  function checkLogin() {

    const token =
      getToken();


    if (!token) {

      window.location.href =
        "admin-login.html";

      return false;

    }


    const admin =
      getAdmin();


    if ($("adminName")) {

      $("adminName").textContent =
        admin.name ||
        admin.username ||
        "Admin";

    }


    if ($("adminRole")) {

      $("adminRole").textContent =
        admin.role ||
        "ADMIN";

    }


    return true;

  }


  /*****************************************************
   * API
   *****************************************************/

  async function api(data) {

    if (!API) {

      throw new Error(
        "ไม่พบ API_URL ใน config.js"
      );

    }


    const response =
      await fetch(
        API,
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(data)

        }
      );


    const result =
      await response.json();


    if (
      result.code ===
      "ADMIN_SESSION_EXPIRED"
    ) {

      sessionStorage.removeItem(
        "admin_token"
      );

      sessionStorage.removeItem(
        "admin_data"
      );

      window.location.href =
        "admin-login.html";

      return result;

    }


    return result;

  }


  /*****************************************************
   * MESSAGE
   *****************************************************/

  function showMessage(
    message,
    type
  ) {

    const box =
      $("messageBox");


    if (!box) {

      alert(message);

      return;

    }


    box.textContent =
      message;


    box.className =
      "message-box " +
      (type || "success");


    box.style.display =
      "block";


    setTimeout(
      function () {

        box.style.display =
          "none";

      },
      3500
    );

  }


  /*****************************************************
   * MODAL
   *****************************************************/

  function openModal(id) {

    const modal =
      $(id);


    if (modal) {

      modal.classList.add(
        "show"
      );

    }

  }


  function closeModal(id) {

    const modal =
      $(id);


    if (modal) {

      modal.classList.remove(
        "show"
      );

    }

  }


  /*****************************************************
   * STUDENT FORM
   *****************************************************/

  function resetStudentForm() {

    const form =
      $("studentForm");


    if (form) {

      form.reset();

    }


    if ($("studentStatus")) {

      $("studentStatus").value =
        "นักศึกษาปกติ";

    }

  }


  async function addStudent(e) {

    e.preventDefault();


    const button =
      $("saveStudentBtn");


    if (button) {

      button.disabled =
        true;

      button.textContent =
        "กำลังบันทึก...";

    }


    try {

      const result =
        await api({

          action:
            "adminAddStudent",

          token:
            getToken(),

          student_id:
            $("studentId").value.trim(),

          password:
            $("studentPassword").value,

          prefix_th:
            $("studentPrefix").value.trim(),

          firstname_th:
            $("studentFirstnameTh").value.trim(),

          lastname_th:
            $("studentLastnameTh").value.trim(),

          firstname_en:
            $("studentFirstnameEn").value.trim(),

          lastname_en:
            $("studentLastnameEn").value.trim(),

          status:
            $("studentStatus").value,

          photo_url:
            $("studentPhoto").value.trim(),

          issue_date:
            $("studentIssueDate").value,

          expire_date:
            $("studentExpireDate").value,

          department:
            $("studentDepartment").value.trim(),

          phone:
            $("studentPhone").value.trim()

        });


      if (!result.success) {

        showMessage(
          result.message ||
          "เพิ่มนักศึกษาไม่สำเร็จ",
          "error"
        );

        return;

      }


      showMessage(
        result.message ||
        "เพิ่มนักศึกษาสำเร็จ",
        "success"
      );


      resetStudentForm();

      closeModal(
        "studentModal"
      );


      loadStudents();

    } catch (error) {

      console.error(error);

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
          "บันทึกนักศึกษา";

      }

    }

  }


  /*****************************************************
   * LOAD STUDENTS
   *****************************************************/

  async function loadStudents() {

    const tbody =
      $("studentsTableBody");


    if (!tbody) {

      return;

    }


    tbody.innerHTML =
      '<tr><td colspan="8">กำลังโหลด...</td></tr>';


    try {

      const result =
        await api({

          action:
            "adminGetStudents",

          token:
            getToken(),

          search:
            $("studentSearch")
              ? $("studentSearch").value.trim()
              : ""

        });


      if (!result.success) {

        tbody.innerHTML =
          '<tr><td colspan="8">' +
          (
            result.message ||
            "โหลดข้อมูลไม่สำเร็จ"
          ) +
          "</td></tr>";

        return;

      }


      const students =
        result.students ||
        [];


      if (
        students.length === 0
      ) {

        tbody.innerHTML =
          '<tr><td colspan="8">ไม่พบข้อมูลนักศึกษา</td></tr>';

        return;

      }


      tbody.innerHTML =
        "";


      students.forEach(
        function(student) {

          const tr =
            document.createElement(
              "tr"
            );


          tr.innerHTML =

            "<td>" +
            escapeHtml(
              student.student_id
            ) +
            "</td>" +

            "<td>" +
            escapeHtml(
              student.prefix_th || ""
            ) +
            escapeHtml(
              student.firstname_th || ""
            ) +
            " " +
            escapeHtml(
              student.lastname_th || ""
            ) +
            "</td>" +

            "<td>" +
            escapeHtml(
              student.firstname_en || ""
            ) +
            " " +
            escapeHtml(
              student.lastname_en || ""
            ) +
            "</td>" +

            "<td>" +
            escapeHtml(
              student.department || ""
            ) +
            "</td>" +

            "<td>" +
            escapeHtml(
              student.phone || ""
            ) +
            "</td>" +

            "<td>" +
            escapeHtml(
              student.status || ""
            ) +
            "</td>" +

            "<td>" +
            escapeHtml(
              student.issue_date || ""
            ) +
            "</td>" +

            "<td>" +
            escapeHtml(
              student.expire_date || ""
            ) +
            "</td>";


          tbody.appendChild(
            tr
          );

        }
      );

    } catch (error) {

      console.error(error);

      tbody.innerHTML =
        '<tr><td colspan="8">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';

    }

  }


  /*****************************************************
   * STAFF FORM
   *****************************************************/

  function resetStaffForm() {

    const form =
      $("staffForm");


    if (form) {

      form.reset();

    }


    if ($("staffRole")) {

      $("staffRole").value =
        "STAFF";

    }


    if ($("staffStatus")) {

      $("staffStatus").value =
        "ACTIVE";

    }

  }


  async function addStaff(e) {

    e.preventDefault();


    const button =
      $("saveStaffBtn");


    if (button) {

      button.disabled =
        true;

      button.textContent =
        "กำลังบันทึก...";

    }


    try {

      const result =
        await api({

          action:
            "adminAddStaff",

          token:
            getToken(),

          username:
            $("staffUsername").value.trim(),

          password:
            $("staffPassword").value,

          name:
            $("staffName").value.trim(),

          role:
            $("staffRole").value,

          status:
            $("staffStatus").value

        });


      if (!result.success) {

        showMessage(
          result.message ||
          "เพิ่ม Staff ไม่สำเร็จ",
          "error"
        );

        return;

      }


      showMessage(
        result.message ||
        "เพิ่ม Staff สำเร็จ",
        "success"
      );


      resetStaffForm();

      closeModal(
        "staffModal"
      );


      loadStaff();

    } catch (error) {

      console.error(error);

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


  /*****************************************************
   * LOAD STAFF
   *****************************************************/

  async function loadStaff() {

    const tbody =
      $("staffTableBody");


    if (!tbody) {

      return;

    }


    tbody.innerHTML =
      '<tr><td colspan="5">กำลังโหลด...</td></tr>';


    try {

      const result =
        await api({

          action:
            "adminGetStaff",

          token:
            getToken()

        });


      if (!result.success) {

        tbody.innerHTML =
          '<tr><td colspan="5">' +
          (
            result.message ||
            "โหลดข้อมูลไม่สำเร็จ"
          ) +
          "</td></tr>";

        return;

      }


      const staff =
        result.staff ||
        [];


      if (
        staff.length === 0
      ) {

        tbody.innerHTML =
          '<tr><td colspan="5">ไม่พบข้อมูล Staff</td></tr>';

        return;

      }


      tbody.innerHTML =
        "";


      staff.forEach(
        function(item) {

          const tr =
            document.createElement(
              "tr"
            );


          tr.innerHTML =

            "<td>" +
            escapeHtml(
              item.admin_id || ""
            ) +
            "</td>" +

            "<td>" +
            escapeHtml(
              item.username || ""
            ) +
            "</td>" +

            "<td>" +
            escapeHtml(
              item.name || ""
            ) +
            "</td>" +

            "<td>" +
            escapeHtml(
              item.role || ""
            ) +
            "</td>" +

            "<td>" +
            escapeHtml(
              item.status || ""
            ) +
            "</td>";


          tbody.appendChild(
            tr
          );

        }
      );

    } catch (error) {

      console.error(error);

      tbody.innerHTML =
        '<tr><td colspan="5">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';

    }

  }


  /*****************************************************
   * ESCAPE HTML
   *****************************************************/

  function escapeHtml(value) {

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


  /*****************************************************
   * LOGOUT
   *****************************************************/

  async function logout() {

    const token =
      getToken();


    try {

      if (token) {

        await api({

          action:
            "adminLogout",

          token:
            token

        });

      }

    } catch (error) {

      console.error(error);

    }


    sessionStorage.removeItem(
      "admin_token"
    );

    sessionStorage.removeItem(
      "admin_data"
    );


    localStorage.removeItem(
      "admin_token"
    );

    localStorage.removeItem(
      "admin_data"
    );


    window.location.href =
      "admin-login.html";

  }


  /*****************************************************
   * INITIALIZE
   *****************************************************/

  document.addEventListener(
    "DOMContentLoaded",
    function () {

      if (!checkLogin()) {

        return;

      }


      /*
       * Student form
       */

      if ($("studentForm")) {

        $("studentForm")
          .addEventListener(
            "submit",
            addStudent
          );

      }


      /*
       * Staff form
       */

      if ($("staffForm")) {

        $("staffForm")
          .addEventListener(
            "submit",
            addStaff
          );

      }


      /*
       * Buttons
       */

      if ($("addStudentBtn")) {

        $("addStudentBtn")
          .addEventListener(
            "click",
            function () {

              resetStudentForm();

              openModal(
                "studentModal"
              );

            }
          );

      }


      if ($("addStaffBtn")) {

        $("addStaffBtn")
          .addEventListener(
            "click",
            function () {

              resetStaffForm();

              openModal(
                "staffModal"
              );

            }
          );

      }


      if ($("closeStudentModal")) {

        $("closeStudentModal")
          .addEventListener(
            "click",
            function () {

              closeModal(
                "studentModal"
              );

            }
          );

      }


      if ($("closeStaffModal")) {

        $("closeStaffModal")
          .addEventListener(
            "click",
            function () {

              closeModal(
                "staffModal"
              );

            }
          );

      }


      if ($("logoutBtn")) {

        $("logoutBtn")
          .addEventListener(
            "click",
            logout
          );

      }


      /*
       * Search
       */

      if ($("studentSearch")) {

        $("studentSearch")
          .addEventListener(
            "input",
            loadStudents
          );

      }


      /*
       * Load data
       */

      loadStudents();

      loadStaff();

    }
  );


})();
