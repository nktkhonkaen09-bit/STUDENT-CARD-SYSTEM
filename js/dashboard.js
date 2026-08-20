document.addEventListener(
    "DOMContentLoaded",
    function () {

        checkSession();

        loadStudent();

        document
            .getElementById("logoutButton")
            .addEventListener(
                "click",
                logout
            );

    }
);


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


function loadStudent() {

    const raw =
        sessionStorage.getItem(
            CONFIG.STUDENT_KEY
        );


    if (!raw) {

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


        const fullName =

            (student.prefix_th || "") +

            (student.firstname_th || "") +

            " " +

            (student.lastname_th || "");


        document
            .getElementById(
                "headerStudentName"
            )
            .textContent =
            fullName.trim();


    } catch (error) {

        console.error(error);

        logout();

    }

}


function openProfile() {

    window.location.href =
        "profile.html";

}


function openStudentCard() {

    window.location.href =
        "student-card.html";

}


function openChangePassword() {

    window.location.href =
        "change-password.html";

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
