/*******************************************************
 * STUDENT CARD SYSTEM
 * admin-login.js
 *
 * หน้าที่:
 * - ตรวจสอบ Session เดิม
 * - Login Admin / Staff
 * - บันทึก Admin Session
 * - เปลี่ยนหน้าไป admin-dashboard.html
 * - ป้องกันการ Login ซ้ำระหว่างกำลังส่งข้อมูล
 *******************************************************/


/*******************************************************
 * DOM READY
 *******************************************************/

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initAdminLogin();

  }
);


/*******************************************************
 * INIT
 *******************************************************/

function initAdminLogin() {

  console.log(
    "ADMIN LOGIN: initializing..."
  );


  /*
   * ตรวจสอบว่า config.js โหลดแล้วหรือไม่
   */

  if (
    typeof CONFIG === "undefined"
  ) {

    console.error(
      "CONFIG ไม่ถูกโหลด"
    );

    showAdminMessage(
      "ระบบตั้งค่าไม่ถูกต้อง กรุณาตรวจสอบ config.js",
      "error"
    );

    return;

  }


  /*
   * ตรวจ API URL
   */

  if (
    typeof isApiConfigured === "function" &&
    !isApiConfigured()
  ) {

    showAdminMessage(
      "ไม่พบ API URL",
      "error"
    );

    return;

  }


  /*
   * หา Form
   */

  const form =
    document.getElementById(
      "adminLoginForm"
    );


  if (!form) {

    console.error(
      "ไม่พบ #adminLoginForm"
    );

    return;

  }


  /*
   * Submit
   */

  form.addEventListener(
    "submit",
    handleAdminLogin
  );


  /*
   * Enter / keyboard
   * Browser จัดการผ่าน form submit อยู่แล้ว
   */


  /*
   * ตรวจ Session เดิม
   */

  checkExistingAdminSession();

}


/*******************************************************
 * CHECK EXISTING ADMIN SESSION
 *******************************************************/

function checkExistingAdminSession() {

  const token =
    getAdminToken();


  const admin =
    getAdminData();


  /*
   * ถ้ามีทั้ง Token และข้อมูล Admin
   * ให้ถาม API ตรวจ Session
   */

  if (
    token &&
    admin
  ) {

    console.log(
      "พบ Admin Session เดิม"
    );


    verifyExistingAdminSession(
      token
    );

  }

}


/*******************************************************
 * VERIFY EXISTING SESSION
 *******************************************************/

async function verifyExistingAdminSession(
  token
) {

  try {

    const result =
      await apiRequest({

        action:
          "adminSession",

        token:
          token

      });


    /*
     * Backend ปัจจุบันของคุณอาจยังไม่มี
     * adminSession
     *
     * ดังนั้นถ้าไม่รองรับ action นี้
     * จะไม่บังคับ redirect
     */

    if (
      result &&
      result.success
    ) {

      console.log(
        "Admin Session ยังใช้งานได้"
      );


      window.location.replace(
        CONFIG.ADMIN_DASHBOARD_PAGE
      );

      return;

    }


  } catch (error) {

    console.warn(
      "ตรวจ Admin Session ไม่สำเร็จ",
      error
    );

  }

}


/*******************************************************
 * LOGIN
 *******************************************************/

async function handleAdminLogin(
  event
) {

  event.preventDefault();


  /*
   * ป้องกันกดปุ่มซ้ำ
   */

  const button =
    document.getElementById(
      "adminLoginButton"
    );


  if (
    button &&
    button.disabled
  ) {

    return;

  }


  /*
   * Username
   */

  const usernameInput =
    document.getElementById(
      "adminUsername"
    );


  /*
   * Password
   */

  const passwordInput =
    document.getElementById(
      "adminPassword"
    );


  if (
    !usernameInput ||
    !passwordInput
  ) {

    showAdminMessage(
      "ไม่พบช่อง Username หรือ Password",
      "error"
    );

    return;

  }


  const username =
    usernameInput.value
      .trim();


  const password =
    passwordInput.value;


  /*
   * Validate
   */

  if (!username) {

    showAdminMessage(
      "กรุณากรอกชื่อผู้ใช้",
      "error"
    );

    usernameInput.focus();

    return;

  }


  if (!password) {

    showAdminMessage(
      "กรุณากรอกรหัสผ่าน",
      "error"
    );

    passwordInput.focus();

    return;

  }


  /*
   * Loading
   */

  setAdminLoginLoading(
    true
  );


  showAdminMessage(
    "กำลังตรวจสอบข้อมูล...",
    "info"
  );


  try {

    console.log(
      "ADMIN LOGIN REQUEST",
      {
        username: username
      }
    );


    /*
     * ส่ง Login ไป Google Apps Script
     */

    const result =
      await apiRequest({

        action:
          "adminLogin",

        username:
          username,

        password:
          password

      });


    console.log(
      "ADMIN LOGIN RESULT",
      result
    );


    /*
     * ตรวจ Response
     */

    if (
      !result ||
      !result.success
    ) {

      /*
       * ล้าง Session เก่า
       * กรณี Login ไม่สำเร็จ
       */

      clearAdminSession();


      showAdminMessage(
        result &&
        result.message
          ? result.message
          : "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        "error"
      );

      return;

    }


    /*
     * ต้องมี Token
     */

    if (
      !result.token
    ) {

      console.error(
        "LOGIN สำเร็จแต่ไม่มี token",
        result
      );


      clearAdminSession();


      showAdminMessage(
        "เข้าสู่ระบบสำเร็จ แต่ระบบไม่ได้รับ Session Token",
        "error"
      );

      return;

    }


    /*
     * Admin data
     */

    const admin =
      result.admin || {

        username:
          username,

        name:
          username,

        role:
          "ADMIN"

      };


    /*
     * บันทึก Session
     */

    saveAdminSession(
      result.token,
      admin
    );


    /*
     * ตรวจสอบว่าบันทึกสำเร็จจริง
     */

    const savedToken =
      getAdminToken();


    const savedAdmin =
      getAdminData();


    if (
      !savedToken ||
      !savedAdmin
    ) {

      console.error(
        "ไม่สามารถบันทึก Admin Session"
      );


      showAdminMessage(
        "ไม่สามารถบันทึก Session ได้ กรุณาลองใหม่",
        "error"
      );

      return;

    }


    /*
     * Login สำเร็จ
     */

    showAdminMessage(
      "เข้าสู่ระบบสำเร็จ กำลังเข้าสู่ Admin Dashboard...",
      "success"
    );


    /*
     * ไป Dashboard
     */

    setTimeout(
      function () {

        window.location.replace(
          CONFIG.ADMIN_DASHBOARD_PAGE
        );

      },
      400
    );


  } catch (error) {

    console.error(
      "ADMIN LOGIN ERROR",
      error
    );


    showAdminMessage(
      "ไม่สามารถเชื่อมต่อระบบได้ กรุณาตรวจสอบ API และ Internet",
      "error"
    );


  } finally {

    /*
     * เปิดปุ่มกลับ
     *
     * แต่ถ้ากำลัง redirect ก็ไม่เป็นปัญหา
     */

    setTimeout(
      function () {

        setAdminLoginLoading(
          false
        );

      },
      800
    );

  }

}


/*******************************************************
 * SET LOGIN LOADING
 *******************************************************/

function setAdminLoginLoading(
  loading
) {

  const button =
    document.getElementById(
      "adminLoginButton"
    );


  if (!button) {

    return;

  }


  button.disabled =
    loading;


  if (loading) {

    button.dataset.originalText =
      button.textContent;


    button.textContent =
      "กำลังตรวจสอบ...";

  } else {

    button.textContent =
      button.dataset.originalText ||
      "เข้าสู่ระบบ Admin";

  }

}


/*******************************************************
 * SHOW MESSAGE
 *******************************************************/

function showAdminMessage(
  text,
  type
) {

  const message =
    document.getElementById(
      "adminMessage"
    );


  if (!message) {

    console.log(
      "ADMIN MESSAGE:",
      text
    );

    return;

  }


  message.textContent =
    text;


  message.className =
    "message";


  if (type) {

    message.classList.add(
      type
    );

  }

}


/*******************************************************
 * DEBUG SESSION
 *
 * ใช้ตรวจสอบปัญหา Login → Dashboard
 *******************************************************/

function debugAdminSession() {

  const token =
    getAdminToken();


  const admin =
    getAdminData();


  console.log(
    "========== ADMIN SESSION =========="
  );


  console.log(
    "Token:",
    token
  );


  console.log(
    "Admin:",
    admin
  );


  console.log(
    "Dashboard:",
    CONFIG.ADMIN_DASHBOARD_PAGE
  );


  console.log(
    "==================================="
  );

}


/*******************************************************
 * EXPORT / GLOBAL
 *
 * เผื่อหน้า HTML เรียกใช้งาน
 *******************************************************/

window.adminLogin = {

  login:
    handleAdminLogin,

  checkSession:
    checkExistingAdminSession,

  debug:
    debugAdminSession

};
