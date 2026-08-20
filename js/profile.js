document.addEventListener(
    "DOMContentLoaded",
    function () {

        checkSession();

        loadStudent();

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

        return;

    }

}


/* =========================================
   LOAD STUDENT
   ========================================= */

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


        console.log(
            "PROFILE STUDENT:",
            student
        );


        /* =================================
           FULL THAI NAME
           ================================= */

        const fullName =

            (student.prefix_th || "") +

            (student.firstname_th || "") +

            " " +

            (student.lastname_th || "");


        /* =================================
           FULL ENGLISH NAME
           ================================= */

        const fullNameEn =

            (student.firstname_en || "") +

            " " +

            (student.lastname_en || "");


        /* =================================
           PHOTO
           ================================= */

        const photo =
            document.getElementById(
                "profilePhoto"
            );


        if (photo) {

            let photoUrl =
                student.photo_url || "";


            /*
             * ถ้า API ไม่มีรูป
             * ใช้รูปจาก GitHub ตามรหัสนักศึกษา
             */

            if (!photoUrl) {

                photoUrl =
                    "https://raw.githubusercontent.com/" +
                    "nktkhonkaen09-bit/" +
                    "STUDENT-CARD-SYSTEM/" +
                    "main/assets/students/" +
                    student.student_id +
                    ".png";

            }


            photo.src =
                photoUrl;


            photo.onerror =
                function () {

                    this.style.display =
                        "none";

                };

        }


        /* =================================
           TOP PROFILE
           ================================= */

        setText(
            "profileFullName",
            fullName.trim() || "-"
        );


        setText(
            "profileFullNameEn",
            fullNameEn.trim() || "-"
        );


        setText(
            "profileStudentId",
            "รหัส " +
            (student.student_id || "-")
        );


        setText(
            "profileStatus",
            student.status || "-"
        );


        /* =================================
           INFORMATION
           ================================= */

        setText(
            "studentId",
            student.student_id || "-"
        );


        setText(
            "studentName",
            fullName.trim() || "-"
        );


        setText(
            "studentNameEn",
            fullNameEn.trim() || "-"
        );


        setText(
            "studentDepartment",
            student.department || "-"
        );


        /*
         * สำคัญ:
         * สถานะดึงจากฟิวด์ status
         */

        setText(
            "studentStatus",
            student.status || "-"
        );


        setText(
            "studentPhone",
            student.phone || "-"
        );


        setText(
            "issueDate",
            student.issue_date || "-"
        );


        setText(
            "expireDate",
            student.expire_date || "-"
        );


    } catch (error) {

        console.error(
            "PROFILE ERROR:",
            error
        );

    }

}


/* =========================================
   SET TEXT
   ========================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {

        return;

    }


    element.textContent =
        value;

}


/* =========================================
   BACK
   ========================================= */

function goBack() {

    window.location.href =
        "dashboard.html";

}


/* =========================================
   OPEN STUDENT CARD
   ========================================= */

function openStudentCard() {

    window.location.href =
        "student-card.html";

}
