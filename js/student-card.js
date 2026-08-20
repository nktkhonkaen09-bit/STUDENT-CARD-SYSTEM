document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadStudentCard();

    }
);


function loadStudentCard() {

    const token =
        sessionStorage.getItem(
            CONFIG.SESSION_KEY
        );


    const raw =
        sessionStorage.getItem(
            CONFIG.STUDENT_KEY
        );


    /*
     * ถ้าไม่ได้ Login
     */

    if (!token || !raw) {

        window.location.href =
            "index.html";

        return;

    }


    try {

        const student =
            JSON.parse(raw);


        /*
         * รหัสนักศึกษา
         */

        setText(
            "studentId",
            student.student_id
        );


        setText(
            "cardStudentId",
            student.student_id
        );


        /*
         * ชื่อภาษาไทย
         */

        const fullNameTh =

            (student.prefix_th || "") +

            (student.firstname_th || "") +

            " " +

            (student.lastname_th || "");


        setText(
            "studentName",
            fullNameTh.trim()
        );


        /*
         * ชื่อภาษาอังกฤษ
         */

        const fullNameEn =

            (student.firstname_en || "") +

            " " +

            (student.lastname_en || "");


        setText(
            "studentNameEn",
            fullNameEn.trim()
        );


        /*
         * สาขาวิชา
         */

        setText(
            "studentDepartment",
            student.department || "-"
        );


        /*
         * สถานะ
         */

        setText(
            "studentStatus",
            student.status ||
            "นักศึกษาปกติ"
        );


        /*
         * วันที่
         */

        setText(
            "issueDate",
            student.issue_date || "-"
        );


        setText(
            "expireDate",
            student.expire_date || "-"
        );


        /*
         * รูปนักศึกษา
         */

        loadStudentPhoto(
            student
        );


        /*
         * QR Code
         */

        generateStudentQR(
            student
        );


    } catch (error) {

        console.error(
            "Student Card Error:",
            error
        );


        sessionStorage.clear();

        window.location.href =
            "index.html";

    }

}


/**
 * ใส่ข้อความ
 */
function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value || "-";

    }

}


/**
 * โหลดรูปนักศึกษา
 */
function loadStudentPhoto(
    student
) {

    const image =
        document.getElementById(
            "studentPhoto"
        );


    if (!image) {

        return;

    }


    /*
     * ถ้ามี photo_url
     */

    if (
        student.photo_url &&
        student.photo_url.trim() !== ""
    ) {

        image.src =
            student.photo_url;

        image.onerror =
            function () {

                setDefaultPhoto(
                    image
                );

            };

        return;

    }


    /*
     * ถ้ายังไม่มี photo_url
     *
     * ทดลองโหลดจาก GitHub
     */

    const githubPhoto =
        getGitHubStudentPhoto(
            student.student_id
        );


    image.src =
        githubPhoto;


    image.onerror =
        function () {

            setDefaultPhoto(
                image
            );

        };

}


/**
 * URL รูปจาก GitHub
 *
 * แก้ USERNAME / REPOSITORY
 * ให้ตรงกับ Repository จริง
 */
function getGitHubStudentPhoto(
    studentId
) {

    const username =
        "ntkthonkaen09-bit";


    const repository =
        "STUDENT-CARD-SYSTEM";


    return (
        "https://raw.githubusercontent.com/" +
        username +
        "/" +
        repository +
        "/main/assets/students/" +
        encodeURIComponent(studentId) +
        ".jpg"
    );

}


/**
 * รูปสำรอง
 */
function setDefaultPhoto(
    image
) {

    /*
     * ถ้ามีรูป default.png
     * ใน assets/students/
     * จะใช้รูปนั้น
     */

    image.src =
        "assets/students/default.png";


    image.onerror =
        function () {

            /*
             * ถ้าไม่มีรูป default
             * ให้สร้างพื้นหลังเรียบง่าย
             */

            image.style.display =
                "none";

            image.parentElement
                .classList.add(
                    "no-photo"
                );

        };

}


/**
 * สร้าง QR Code
 */
function generateStudentQR(
    student
) {

    const canvas =
        document.getElementById(
            "studentQR"
        );


    if (!canvas) {

        return;

    }


    const qrData = JSON.stringify({

        system:
            "STUDENT-CARD-SYSTEM",

        student_id:
            student.student_id,

        name:
            (
                student.firstname_th ||
                ""
            ) +
            " " +
            (
                student.lastname_th ||
                ""
            ),

        expire_date:
            student.expire_date ||
            ""

    });


    if (
        typeof QRCode ===
        "undefined"
    ) {

        console.warn(
            "QRCode library not loaded"
        );

        return;

    }


    QRCode.toCanvas(
        canvas,
        qrData,
        {

            width: 120,

            margin: 0,

            color: {

                dark: "#5d4700",

                light: "#ffffff"

            }

        },

        function (error) {

            if (error) {

                console.error(
                    "QR Error:",
                    error
                );

            }

        }
    );

}


/**
 * กลับ Dashboard
 */
function goBack() {

    window.location.href =
        "dashboard.html";

}


/**
 * ดาวน์โหลดบัตร
 *
 * ตอนนี้ใช้การพิมพ์เป็นหลัก
 * เพื่อรักษาความคมชัดของบัตร
 */
function downloadCard() {

    alert(
        "ระบบดาวน์โหลดบัตรจะเปิดในขั้นตอนถัดไป"
    );

}
