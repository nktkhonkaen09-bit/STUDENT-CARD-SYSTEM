/*******************************************************
 * ADMIN LOGIN
 * js/admin-login.js
 *
 * หน้าที่:
 * - Login Admin / Staff
 * - เรียก Google Apps Script API
 * - บันทึก Admin Session
 * - บันทึกข้อมูล Admin
 * - Redirect ไป admin-dashboard.html
 *******************************************************/


/*******************************************************
 * CONFIG
 *******************************************************/

const ADMIN_LOGIN_CONFIG = {

  /*
   * Google Apps Script Web App URL
   *
   * ใช้ URL เดียวกับระบบของคุณ
   */
  API_URL:
    "https://script.google.com/macros/s/AKfycbxCvk2wb6FydCKNkEDvApbTgZWmSFoAzPvvM2sSDOIwSgvftMoQxIX3cy7npP3_6xT4/exec",


  /*
   * Session Token
   */
  ADMIN_SESSION_KEY:
    "admin_session",


  /*
   * Admin Data
   */
  ADMIN_KEY:
    "admin_data",


  /*
   * หน้า Dashboard
   */
  DASHBOARD_PAGE:
    "admin-dashboard.html"

};


/*******************************************************
 * DOM READY
 *******************************************************/

document.addEventListener(
  "DOMContentLoaded",
  function () {

    console.log(
      "ADMIN LOGIN JS READY"
    );


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
     * ป้องกันการ bind event ซ้ำ
     */

    if (
      form.dataset.adminLoginReady ===
      "true"
    ) {

      return;

    }


    form.dataset.adminLoginReady =
      "true";


    form.addEventListener(
      "submit",
      handleAdminLogin
    );


    /*
     * ถ้ามี session เดิม
     * ไม่ redirect อัตโนมัติ
     *
     * เพื่อป้องกันกรณี session เก่าค้าง
     */

    console.log(
      "ADMIN LOGIN FORM READY"
    );

  }
);


/*******************************************************
 * HANDLE LOGIN
 *******************************************************/

async function handleAdminLogin(
  event
) {

  event.preventDefault();


  const usernameInput =
    document.getElementById(
      "adminUsername"
    );


  const passwordInput =
    document.getElementById(
      "adminPassword"
    );


  const button =
    document.getElementById(
      "adminLoginButton"
    );


  if (
    !usernameInput ||
    !passwordInput
  ) {

    console.error(
      "ไม่พบช่อง Username / Password"
    );

    return;

  }


  const username =
    String(
      usernameInput.value || ""
    ).trim();


  const password =
    String(
      passwordInput.value || ""
    );


  /*
   * ตรวจข้อมูล
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
   * Disable ปุ่ม
   */

  if (button) {

    button.disabled =
      true;

    button.textContent =
      "กำลังตรวจสอบ...";

  }


  showAdminMessage(
    "กำลังเชื่อมต่อระบบ...",
    "info"
  );


  try {


    /*************************************************
     * CALL API
     *************************************************/

    const response =
      await fetch(
        ADMIN_LOGIN_CONFIG.API_URL,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "text/plain;charset=utf-8"

          },

          body:
            JSON.stringify({

              action:
                "adminLogin",

              username:
                username,

              password:
                password

            })

        }
      );


    /*
     * ตรวจ HTTP
     */

    if (!response.ok) {

      throw new Error(
        "HTTP " +
        response.status
      );

    }


    /*
     * อ่าน JSON
     */

    const result =
      await response.json();


    console.log(
      "ADMIN LOGIN RESULT:",
      result
    );


    /*************************************************
     * LOGIN FAILED
     *************************************************/

    if (
      !result ||
      result.success !== true
    ) {

      showAdminMessage(

        result &&
        result.message

          ? result.message

          : "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",

        "error"

      );

      return;

    }


    /*************************************************
     * ตรวจ TOKEN
     *************************************************/

    if (!result.token) {

      console.error(
        "API login สำเร็จแต่ไม่มี token",
        result
      );


      showAdminMessage(
        "เข้าสู่ระบบสำเร็จ แต่ระบบไม่ได้รับ Session Token",
        "error"
      );


      return;

    }


    /*************************************************
     * CLEAR OLD SESSION
     *************************************************/

    try {

      sessionStorage.removeItem(
        ADMIN_LOGIN_CONFIG.ADMIN_SESSION_KEY
      );

      sessionStorage.removeItem(
        ADMIN_LOGIN_CONFIG.ADMIN_KEY
      );

    } catch (storageError) {

      console.warn(
        "ไม่สามารถล้าง session เดิม",
        storageError
      );

    }


    /*************************************************
     * ADMIN DATA
     *************************************************/

    const adminData =
      result.admin || {

        username:
          username,

        name:
          username,

        role:
          "ADMIN"

      };


    /*************************************************
     * SAVE SESSION
     *************************************************/

    try {

      sessionStorage.setItem(

        ADMIN_LOGIN_CONFIG.ADMIN_SESSION_KEY,

        String(
          result.token
        )

      );


      sessionStorage.setItem(

        ADMIN_LOGIN_CONFIG.ADMIN_KEY,

        JSON.stringify(
          adminData
        )

      );

    } catch (storageError) {

      console.error(
        "SESSION STORAGE ERROR",
        storageError
      );


      showAdminMessage(
        "ไม่สามารถบันทึก Session ได้ กรุณาตรวจสอบ Browser",
        "error"
      );


      return;

    }


    /*************************************************
     * VERIFY LOCAL SESSION
     *************************************************/

    const savedToken =
      sessionStorage.getItem(
        ADMIN_LOGIN_CONFIG.ADMIN_SESSION_KEY
      );


    if (
      !savedToken ||
      savedToken !==
      String(result.token)
    ) {

      showAdminMessage(
        "ไม่สามารถสร้าง Session ได้",
        "error"
      );

      return;

    }


    /*************************************************
     * SUCCESS
     *************************************************/

    showAdminMessage(
      "เข้าสู่ระบบสำเร็จ กำลังเข้าสู่ Admin Dashboard...",
      "success"
    );


    console.log(
      "ADMIN SESSION SAVED"
    );


    console.log(
      "REDIRECT:",
      ADMIN_LOGIN_CONFIG.DASHBOARD_PAGE
    );


    /*************************************************
     * REDIRECT
     *************************************************/

    setTimeout(
      function () {

        window.location.replace(
          ADMIN_LOGIN_CONFIG.DASHBOARD_PAGE
        );

      },
      400
    );


  } catch (error) {


    console.error(
      "ADMIN LOGIN ERROR:",
      error
    );


    showAdminMessage(
      "ไม่สามารถเชื่อมต่อระบบได้ กรุณาตรวจสอบ API และลองใหม่อีกครั้ง",
      "error"
    );


  } finally {


    /*
     * เปิดปุ่มกลับ
     *
     * ถ้ากำลัง redirect จริง
     * Browser จะเปลี่ยนหน้าก่อน
     */

    setTimeout(
      function () {

        if (button) {

          button.disabled =
            false;

          button.textContent =
            "เข้าสู่ระบบ Admin";

        }

      },
      1000
    );

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
 * LOGOUT HELPER
 *
 * Dashboard สามารถเรียก:
 *
 * adminLogoutLocal();
 *******************************************************/

function adminLogoutLocal() {

  try {

    sessionStorage.removeItem(
      ADMIN_LOGIN_CONFIG.ADMIN_SESSION_KEY
    );


    sessionStorage.removeItem(
      ADMIN_LOGIN_CONFIG.ADMIN_KEY
    );


  } catch (error) {

    console.error(
      "ADMIN LOCAL LOGOUT ERROR:",
      error
    );

  }


  window.location.replace(
    "admin-login.html"
  );

}


/*******************************************************
 * GET CURRENT ADMIN
 *******************************************************/

function getCurrentAdmin() {

  try {

    const data =
      sessionStorage.getItem(
        ADMIN_LOGIN_CONFIG.ADMIN_KEY
      );


    if (!data) {

      return null;

    }


    return JSON.parse(
      data
    );


  } catch (error) {

    console.error(
      "GET CURRENT ADMIN ERROR:",
      error
    );


    return null;

  }

}


/*******************************************************
 * GET ADMIN TOKEN
 *******************************************************/

function getAdminToken() {

  try {

    return sessionStorage.getItem(
      ADMIN_LOGIN_CONFIG.ADMIN_SESSION_KEY
    ) || "";

  } catch (error) {

    return "";

  }

}
