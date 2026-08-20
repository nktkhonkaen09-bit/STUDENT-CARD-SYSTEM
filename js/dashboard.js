document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadStudent();

        document
            .getElementById("logoutButton")
            .addEventListener(
                "click",
                logout
            );

    }
);


function loadStudent() {

    const raw =
        sessionStorage.getItem(
            CONFIG.STUDENT_KEY
        );


    if (!raw) {

        window.location.href =
            "index.html";

        return;

    }


    try {

        const student =
            JSON.parse(raw);


        document
            .getElementById(
                "headerStudentId"
            )
            .textContent =
            student.student_id || "-";


        document
            .getElementById(
                "headerStudentName"
            )
            .textContent =

            (
                student.prefix_th || ""
            ) +

            (
                student.firstname_th || ""
            ) +

            " " +

            (
                student.lastname_th || ""
            );


    } catch (error) {

        console.error(error);

        logout();

    }

}


function openProfile() {

    alert(
        "หน้าประวัตินักศึกษาจะเปิดในขั้นตอนถัดไป"
    );

}


function openStudentCard() {

    alert(
        "หน้าบัตรนักศึกษาจะเปิดในขั้นตอนถัดไป"
    );

}


function openChangePassword() {

    alert(
        "หน้าเปลี่ยนรหัสผ่านจะเปิดในขั้นตอนถัดไป"
    );

}


function logout() {

    sessionStorage.removeItem(
        CONFIG.SESSION_KEY
    );

    sessionStorage.removeItem(
        CONFIG.STUDENT_KEY
    );


    window.location.href =
        "index.html";

}
