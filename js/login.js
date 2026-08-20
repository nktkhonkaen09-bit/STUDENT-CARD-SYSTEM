const API_URL =
  'ใส่_URLของGoogleAppsScript_WebApp';


document
  .getElementById('loginForm')
  .addEventListener('submit', async function (event) {

    event.preventDefault();

    const studentId =
      document
        .getElementById('studentId')
        .value
        .trim();

    const password =
      document
        .getElementById('password')
        .value;

    const message =
      document
        .getElementById('loginMessage');

    message.textContent = 'กำลังเข้าสู่ระบบ...';


    try {

      const response =
        await fetch(API_URL, {

          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({

            action: 'login',

            studentId: studentId,

            password: password

          })

        });


      const result =
        await response.json();


      if (!result.success) {

        message.textContent =
          result.message;

        return;
      }


      /*
       * Login สำเร็จ
       */

      sessionStorage.setItem(
        'student_token',
        result.token
      );


      sessionStorage.setItem(
        'student',
        JSON.stringify(result.student)
      );


      window.location.href =
        'dashboard.html';


    } catch (error) {

      console.error(error);

      message.textContent =
        'ไม่สามารถเชื่อมต่อระบบได้';

    }

  });
