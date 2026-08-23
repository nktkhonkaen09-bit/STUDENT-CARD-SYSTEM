document.addEventListener(
    "DOMContentLoaded",
    function () {

        // ตรวจสอบ Session
        checkSession();

        // โหลดข้อมูลนักศึกษา
        loadStudent();

        // ปุ่มออกจากระบบ
        const logoutButton =
            document.getElementById(
                "logoutButton"
            );

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logout
            );

        }

    }
);


/* =========================================
   ตรวจสอบ Session
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


    if (
        !token ||
        !student
    ) {

        window.location.href =
            "index.html";

        return false;

    }


    return true;

}


/* =========================================
   โหลดข้อมูลนักศึกษา
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
            JSON.parse(
                raw
            );


        /* รหัสนักศึกษา */

        const studentIdElement =
            document.getElementById(
                "headerStudentId"
            );


        if (studentIdElement) {

            studentIdElement.textContent =
                student.student_id ||
                "-";

        }


        /* ชื่อ-สกุล */

        const studentNameElement =
            document.getElementById(
                "headerStudentName"
            );


        const fullName =

            (student.prefix_th || "") +

            (student.firstname_th || "") +

            " " +

            (student.lastname_th || "");


        if (studentNameElement) {

            studentNameElement.textContent =
                fullName.trim() ||
                "-";

        }


    }

    catch (error) {

        console.error(
            "LOAD STUDENT ERROR:",
            error
        );

        // ไม่แสดงข้อความแจ้งเตือนผู้ใช้
        logout();

    }

}


/* =========================================
   เปิดประวัตินักศึกษา
   ========================================= */

function openProfile() {

    window.location.href =
        "profile.html";

}


/* =========================================
   เปิดบัตรนักศึกษา
   ========================================= */

function openStudentCard() {

    window.location.href =
        "student-card.html";

}


/* =========================================
   เปิดลงทะเบียนเรียน
   ========================================= */

function openRegistration() {

    window.location.href =
        "registration.html";

}


/* =========================================
   เปิดรายงานผลการเข้าเรียน
   ========================================= */

function openAttendanceReport() {

    window.location.href =
        "attendance-report.html";

}

/* =========================================
   เปิดตารางสอบ
   ========================================= */

function openExamSchedule() {

    window.location.href =
        "exam-schedule.html";

}

/* =========================================
   เปิดเปลี่ยนรหัสผ่าน
   ========================================= */

function openChangePassword() {

    window.location.href =
        "change-password.html";

}


/* =========================================
   ออกจากระบบ
   ========================================= */

function logout() {

    // ลบ Session
    sessionStorage.removeItem(
        CONFIG.SESSION_KEY
    );


    // ลบข้อมูลนักศึกษา
    sessionStorage.removeItem(
        CONFIG.STUDENT_KEY
    );


    // กลับหน้ Login ทันที
    window.location.href =
        "index.html";

}
