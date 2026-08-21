/*******************************************************
 * STUDENT CARD SYSTEM
 * config.js
 *
 * ไฟล์กลางสำหรับตั้งค่าระบบ
 *
 * ใช้ร่วมกับ:
 *  - login.js
 *  - dashboard.js
 *  - profile.js
 *  - student-card.js
 *  - change-password.js
 *  - admin-login.js
 *  - admin-dashboard.js
 *******************************************************/


const CONFIG = {

  /*****************************************************
   * GOOGLE APPS SCRIPT API
   *****************************************************/

  API_URL:
    "https://script.google.com/macros/s/AKfycbxCvk2wb6FydCKNkEDvApbTgZWmSFoAzPvvM2sSDOIwSgvftMoQxIX3cy7npP3_6xT4/exec",


  /*****************************************************
   * STUDENT SESSION
   *
   * ใช้เก็บ Token ของนักศึกษา
   *****************************************************/

  SESSION_KEY:
    "student_session",


  /*****************************************************
   * STUDENT DATA
   *
   * ใช้เก็บข้อมูลนักศึกษาที่ Login สำเร็จ
   *****************************************************/

  STUDENT_KEY:
    "student_data",


  /*****************************************************
   * ADMIN SESSION
   *
   * ใช้เก็บ Token ของ Admin / Staff
   *****************************************************/

  ADMIN_SESSION_KEY:
    "admin_session",


  /*****************************************************
   * ADMIN DATA
   *
   * ใช้เก็บข้อมูล Admin / Staff
   *****************************************************/

  ADMIN_KEY:
    "admin_data",


  /*****************************************************
   * SESSION STORAGE TYPE
   *
   * true  = ใช้ sessionStorage
   * false = ใช้ localStorage
   *
   * แนะนำให้ใช้ sessionStorage
   * เพื่อให้ Session หมดเมื่อปิด Browser
   *****************************************************/

  USE_SESSION_STORAGE:
    true,


  /*****************************************************
   * PAGE SETTINGS
   *****************************************************/

  STUDENT_LOGIN_PAGE:
    "index.html",

  STUDENT_DASHBOARD_PAGE:
    "dashboard.html",

  ADMIN_LOGIN_PAGE:
    "admin-login.html",

  ADMIN_DASHBOARD_PAGE:
    "admin-dashboard.html"

};


/*******************************************************
 * STORAGE HELPER
 *
 * ทำให้ทุกหน้าใช้ Storage แบบเดียวกัน
 *******************************************************/

const APP_STORAGE = {

  /*****************************************************
   * GET STORAGE
   *****************************************************/

  getStorage: function () {

    return CONFIG.USE_SESSION_STORAGE
      ? sessionStorage
      : localStorage;

  },


  /*****************************************************
   * SET
   *****************************************************/

  set: function (
    key,
    value
  ) {

    try {

      this.getStorage().setItem(
        key,
        value
      );

      return true;

    } catch (error) {

      console.error(
        "STORAGE SET ERROR:",
        error
      );

      return false;

    }

  },


  /*****************************************************
   * GET
   *****************************************************/

  get: function (
    key
  ) {

    try {

      return this.getStorage().getItem(
        key
      );

    } catch (error) {

      console.error(
        "STORAGE GET ERROR:",
        error
      );

      return null;

    }

  },


  /*****************************************************
   * REMOVE
   *****************************************************/

  remove: function (
    key
  ) {

    try {

      this.getStorage().removeItem(
        key
      );

      return true;

    } catch (error) {

      console.error(
        "STORAGE REMOVE ERROR:",
        error
      );

      return false;

    }

  },


  /*****************************************************
   * CLEAR STUDENT SESSION
   *****************************************************/

  clearStudentSession: function () {

    this.remove(
      CONFIG.SESSION_KEY
    );

    this.remove(
      CONFIG.STUDENT_KEY
    );

  },


  /*****************************************************
   * CLEAR ADMIN SESSION
   *****************************************************/

  clearAdminSession: function () {

    this.remove(
      CONFIG.ADMIN_SESSION_KEY
    );

    this.remove(
      CONFIG.ADMIN_KEY
    );

  },


  /*****************************************************
   * CLEAR ALL
   *****************************************************/

  clearAll: function () {

    this.clearStudentSession();

    this.clearAdminSession();

  }

};


/*******************************************************
 * API HELPER
 *
 * ใช้ส่ง POST ไป Google Apps Script
 *******************************************************/

async function apiRequest(
  data
) {

  try {

    const response =
      await fetch(
        CONFIG.API_URL,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "text/plain;charset=utf-8"

          },

          body:
            JSON.stringify(
              data || {}
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


  } catch (error) {

    console.error(
      "API REQUEST ERROR:",
      error
    );


    return {

      success: false,

      message:
        "ไม่สามารถเชื่อมต่อ API ได้",

      error:
        error.message

    };

  }

}


/*******************************************************
 * STUDENT SESSION HELPERS
 *******************************************************/

function getStudentToken() {

  return APP_STORAGE.get(
    CONFIG.SESSION_KEY
  );

}


function getStudentData() {

  const data =
    APP_STORAGE.get(
      CONFIG.STUDENT_KEY
    );


  if (!data) {

    return null;

  }


  try {

    return JSON.parse(
      data
    );

  } catch (error) {

    console.error(
      "STUDENT DATA PARSE ERROR:",
      error
    );

    return null;

  }

}


/*******************************************************
 * ADMIN SESSION HELPERS
 *******************************************************/

function getAdminToken() {

  return APP_STORAGE.get(
    CONFIG.ADMIN_SESSION_KEY
  );

}


function getAdminData() {

  const data =
    APP_STORAGE.get(
      CONFIG.ADMIN_KEY
    );


  if (!data) {

    return null;

  }


  try {

    return JSON.parse(
      data
    );

  } catch (error) {

    console.error(
      "ADMIN DATA PARSE ERROR:",
      error
    );

    return null;

  }

}


/*******************************************************
 * SAVE STUDENT SESSION
 *******************************************************/

function saveStudentSession(
  token,
  student
) {

  APP_STORAGE.set(
    CONFIG.SESSION_KEY,
    token
  );


  APP_STORAGE.set(
    CONFIG.STUDENT_KEY,
    JSON.stringify(
      student || {}
    )
  );

}


/*******************************************************
 * SAVE ADMIN SESSION
 *******************************************************/

function saveAdminSession(
  token,
  admin
) {

  APP_STORAGE.set(
    CONFIG.ADMIN_SESSION_KEY,
    token
  );


  APP_STORAGE.set(
    CONFIG.ADMIN_KEY,
    JSON.stringify(
      admin || {}
    )
  );

}


/*******************************************************
 * LOGOUT STUDENT
 *******************************************************/

function clearStudentSession() {

  APP_STORAGE.clearStudentSession();

}


/*******************************************************
 * LOGOUT ADMIN
 *******************************************************/

function clearAdminSession() {

  APP_STORAGE.clearAdminSession();

}


/*******************************************************
 * CHECK API CONFIG
 *******************************************************/

function isApiConfigured() {

  return (
    typeof CONFIG.API_URL === "string" &&
    CONFIG.API_URL.trim() !== ""
  );

}


/*******************************************************
 * DEBUG
 *******************************************************/

console.log(
  "Student Card System CONFIG loaded",
  CONFIG
);
