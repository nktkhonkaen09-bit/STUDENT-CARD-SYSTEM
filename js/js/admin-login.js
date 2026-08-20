document.addEventListener(
    "DOMContentLoaded",
    function () {

        const form =
            document.getElementById(
                "adminLoginForm"
            );


        if (!form) {

            return;

        }


        form.addEventListener(
            "submit",
            handleAdminLogin
        );

    }
);



/* =========================================
   ADMIN LOGIN
   ========================================= */

async function handleAdminLogin(
    event
) {

    event.preventDefault();


    const username =
        document
            .getElementById(
                "adminUsername"
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                "adminPassword"
            )
            .value;


    const button =
        document.getElementById(
            "adminLoginButton"
        );


    if (
        !username ||
        !password
    ) {

        showAdminMessage(
            "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
            "error"
        );

        return;

    }


    button.disabled =
        true;


    button.textContent =
        "กำลังเข้าสู่ระบบ...";


    showAdminMessage(
        "",
        ""
    );


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


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        const result =
            await response.json();


        console.log(
            "ADMIN LOGIN RESULT:",
            result
        );


        if (!result.success) {

            showAdminMessage(

                result.message ||
                "เข้าสู่ระบบไม่สำเร็จ",

                "error"

            );

            return;

        }


        /* =================================
           SAVE ADMIN SESSION
           ================================= */

        sessionStorage.setItem(

            CONFIG.ADMIN_SESSION_KEY,

            result.token

        );


        sessionStorage.setItem(

            CONFIG.ADMIN_KEY,

            JSON.stringify(
                result.admin
            )

        );


        showAdminMessage(

            "เข้าสู่ระบบสำเร็จ",

            "success"

        );


        /* =================================
           GO ADMIN DASHBOARD
           ================================= */

        setTimeout(
            function () {

                window.location.href =
                    "admin-dashboard.html";

            },
            500
        );


    } catch (error) {

        console.error(
            "ADMIN LOGIN ERROR:",
            error
        );


        showAdminMessage(

            "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง",

            "error"

        );

    } finally {

        button.disabled =
            false;

        button.textContent =
            "เข้าสู่ระบบ Admin";

    }

}



/* =========================================
   MESSAGE
   ========================================= */

function showAdminMessage(
    text,
    type
) {

    const message =
        document.getElementById(
            "adminMessage"
        );


    if (!message) {

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
