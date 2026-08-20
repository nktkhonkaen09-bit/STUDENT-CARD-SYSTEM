document.addEventListener("DOMContentLoaded", function () {

    console.log("LOGIN JS LOADED");

    alert("LOGIN JS ทำงานแล้ว");

    const loginForm =
        document.getElementById("loginForm");

    if (!loginForm) {

        console.error(
            "ไม่พบ loginForm"
        );

        return;
    }

    loginForm.addEventListener(
        "submit",
        handleLogin
    );

});


async function handleLogin(event) {

    event.preventDefault();

    console.log(
        "กำลัง Login..."
    );


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

        console.log(
            "API:",
            CONFIG.API_URL
        );


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


        console.log(
            "HTTP STATUS:",
            response.status
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


        console.log(
            "บันทึกข้อมูลนักศึกษาแล้ว"
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


    }
    catch (error) {

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


/* =========================================
   SHOW MESSAGE
   ========================================= */

function showMessage(
    text,
    type
) {

    const message =
        document.getElementById(
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
