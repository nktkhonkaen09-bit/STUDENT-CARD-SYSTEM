document.addEventListener(
    "DOMContentLoaded",
    function () {

        checkSession();

        const form =
            document.getElementById(
                "changePasswordForm"
            );


        if (!form) {
            return;
        }


        form.addEventListener(
            "submit",
            handleChangePassword
        );

    }
);


/* =========================================
   CHECK SESSION
   ========================================= */

function checkSession() {

    const token =
        sessionStorage.getItem(
            CONFIG.SESSION_KEY
        );


    const student =
        sessionStorage.getItem(
            CONFIG.STUDENT_KEY
        );


    if (!token || !student) {

        window.location.href =
            "index.html";

    }

}


/* =========================================
   CHANGE PASSWORD
   ========================================= */

async function handleChangePassword(
    event
) {

    event.preventDefault();


    const oldPassword =
        document.getElementById(
            "oldPassword"
        ).value;


    const newPassword =
        document.getElementById(
            "newPassword"
        ).value;


    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        ).value;


    const button =
        document.getElementById(
            "changePasswordButton"
        );


    const message =
        document.getElementById(
            "passwordMessage"
        );


    /* =====================================
       CHECK INPUT
       ===================================== */

    if (
        !oldPassword ||
        !newPassword ||
        !confirmPassword
    ) {

        showMessage(
            "กรุณากรอกข้อมูลให้ครบ",
            "error"
        );

        return;

    }


    if (newPassword.length < 6) {

        showMessage(
            "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร",
            "error"
        );

        return;

    }


    if (
        newPassword !==
        confirmPassword
    ) {

        showMessage(
            "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน",
            "error"
        );

        return;

    }


    if (
        oldPassword ===
        newPassword
    ) {

        showMessage(
            "รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านเดิม",
            "error"
        );

        return;

    }


    const token =
        sessionStorage.getItem(
            CONFIG.SESSION_KEY
        );


    if (!token) {

        window.location.href =
            "index.html";

        return;

    }


    /* =====================================
       LOADING
       ===================================== */

    button.disabled =
        true;

    button.textContent =
        "กำลังเปลี่ยนรหัสผ่าน...";


    showMessage(
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
                                "changePassword",

                            token:
                                token,

                            oldPassword:
                                oldPassword,

                            newPassword:
                                newPassword

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


        /* =================================
           SESSION EXPIRED
           ================================= */

        if (
            result.code ===
            "SESSION_EXPIRED"
        ) {

            sessionStorage.removeItem(
                CONFIG.SESSION_KEY
            );

            sessionStorage.removeItem(
                CONFIG.STUDENT_KEY
            );


            window.location.href =
                "index.html";

            return;

        }


        /* =================================
           ERROR
           ================================= */

        if (!result.success) {

            showMessage(
                result.message ||
                "ไม่สามารถเปลี่ยนรหัสผ่านได้",
                "error"
            );

            return;

        }


        /* =================================
           SUCCESS
           ================================= */

        showMessage(
            "เปลี่ยนรหัสผ่านสำเร็จ",
            "success"
        );


        document
            .getElementById(
                "changePasswordForm"
            )
            .reset();


        setTimeout(
            function () {

                window.location.href =
                    "dashboard.html";

            },
            1200
        );


    } catch (error) {

        showMessage(
            "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง",
            "error"
        );

    } finally {

        button.disabled =
            false;

        button.textContent =
            "เปลี่ยนรหัสผ่าน";

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
            "passwordMessage"
        );


    if (!message) {
        return;
    }


    message.textContent =
        text;


    message.className =
        "password-message";


    if (type) {

        message.classList.add(
            type
        );

    }

}


/* =========================================
   SHOW / HIDE PASSWORD
   ========================================= */

function togglePassword(
    inputId,
    button
) {

    const input =
        document.getElementById(
            inputId
        );


    if (!input) {
        return;
    }


    if (
        input.type ===
        "password"
    ) {

        input.type =
            "text";

        button.textContent =
            "🙈";

    } else {

        input.type =
            "password";

        button.textContent =
            "👁";

    }

}


/* =========================================
   BACK
   ========================================= */

function goBack() {

    window.location.href =
        "dashboard.html";

}
