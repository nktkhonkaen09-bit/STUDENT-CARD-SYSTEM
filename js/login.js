document.addEventListener("DOMContentLoaded", function () {

    const loginForm =
        document.getElementById("loginForm");

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener(
        "submit",
        handleLogin
    );

});


async function handleLogin(event) {

    event.preventDefault();


    const studentId =
        document
            .getElementById("studentId")
            .value
            .trim();


    const password =
        document
            .getElementById("password")
            .value;


    const button =
        document
            .getElementById("loginButton");


    const message =
        document
            .getElementById("loginMessage");


    if (!studentId || !password) {

        showMessage(
            "กรุณากรอกรหัสนักศึกษาและรหัสผ่าน",
            "error"
        );

        return;

    }


    button.disabled = true;

    button.textContent =
        "กำลังเข้าสู่ระบบ...";


    showMessage("", "");


    try {

        const response =
            await fetch(
                CONFIG.API_URL,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body: JSON.stringify({

                        action: "login",

                        studentId:
                            studentId,

                        password:
                            password

                    })

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
            "LOGIN RESULT:",
            result
        );


        if (!result.success) {

            showMessage(
                result.message ||
                "เข้าสู่ระบบไม่สำเร็จ",
                "error"
            );

            return;

        }


        /*
         * =================================
         * LOGIN SUCCESS
         * =================================
         */

        sessionStorage.setItem(

            CONFIG.SESSION_KEY,

            result.token

        );


        sessionStorage.setItem(

            CONFIG.STUDENT_KEY,

            JSON.stringify(
                result.student
            )

        );


        showMessage(
            "เข้าสู่ระบบสำเร็จ",
            "success"
        );


        /*
         * ไป Dashboard
         */

        setTimeout(
            function () {

                window.location.href =
                    "dashboard.html";

            },
            500
        );


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        showMessage(

            "ไม่สามารถเชื่อมต่อระบบได้ " +
            "กรุณาลองใหม่อีกครั้ง",

            "error"

        );

    }


    finally {

        button.disabled = false;

        button.textContent =
            "เข้าสู่ระบบ";

    }

}


/**
 * แสดงข้อความ
 */
function showMessage(
    text,
    type
) {

    const message =
        document
            .getElementById(
                "loginMessage"
            );


    if (!message) {
        return;
    }


    message.textContent =
        text;


    message.className =
        "login-message";


    if (type) {

        message.classList.add(
            type
        );

    }

}
