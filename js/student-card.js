/**
 * ============================================================
 * STUDENT CARD SYSTEM
 * student-card.js
 * ============================================================
 *
 * รองรับ:
 * - JPG
 * - JPEG
 * - PNG
 *
 * รูปจาก GitHub:
 * assets/students/รหัสนักศึกษา.jpg
 * assets/students/รหัสนักศึกษา.jpeg
 * assets/students/รหัสนักศึกษา.png
 *
 * GitHub Repository:
 * nktkhonkaen09-bit/STUDENT-CARD-SYSTEM
 * ============================================================
 */


/* ============================================================
   เริ่มทำงานเมื่อเปิดหน้า student-card.html
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeStudentCard();

    }
);


/* ============================================================
   เริ่มระบบบัตรนักศึกษา
============================================================ */

function initializeStudentCard() {

    /*
     * ตรวจสอบ CONFIG
     */

    if (
        typeof CONFIG === "undefined"
    ) {

        console.error(
            "ไม่พบ CONFIG"
        );

        alert(
            "ไม่พบการตั้งค่าระบบ"
        );

        return;
    }


    /*
     * อ่าน Token
     */

    const token =
        sessionStorage.getItem(
            CONFIG.SESSION_KEY
        );


    /*
     * อ่านข้อมูลนักศึกษา
     */

    const studentData =
        sessionStorage.getItem(
            CONFIG.STUDENT_KEY
        );


    /*
     * ถ้ายังไม่ได้ Login
     */

    if (
        !token ||
        !studentData
    ) {

        window.location.href =
            "index.html";

        return;
    }


    /*
     * แปลงข้อมูล JSON
     */

    let student;

    try {

        student =
            JSON.parse(
                studentData
            );

    } catch (error) {

        console.error(
            "ข้อมูลนักศึกษาไม่ถูกต้อง",
            error
        );

        sessionStorage.removeItem(
            CONFIG.STUDENT_KEY
        );

        window.location.href =
            "index.html";

        return;
    }


    /*
     * แสดงข้อมูลบนบัตร
     */

    displayStudentInformation(
        student
    );


    /*
     * โหลดรูปนักศึกษา
     */

    loadStudentPhoto(
        student
    );


    /*
     * สร้าง QR Code
     */

    generateStudentQRCode(
        student
    );

}


/* ============================================================
   แสดงข้อมูลนักศึกษา
============================================================ */

function displayStudentInformation(
    student
) {

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

        (
            student.prefix_th ||
            ""
        ) +

        (
            student.firstname_th ||
            ""
        ) +

        " " +

        (
            student.lastname_th ||
            ""
        );


    setText(
        "studentName",
        fullNameTh.trim() || "-"
    );


    /*
     * ชื่อภาษาอังกฤษ
     */

    const fullNameEn =

        (
            student.firstname_en ||
            ""
        ) +

        " " +

        (
            student.lastname_en ||
            ""
        );


    setText(
        "studentNameEn",
        fullNameEn.trim() || "-"
    );


    /*
     * สาขาวิชา
     */

    setText(
        "studentDepartment",
        student.department
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
     * วันที่ออกบัตร
     */

    setText(
        "issueDate",
        student.issue_date
    );


    /*
     * วันหมดอายุ
     */

    setText(
        "expireDate",
        student.expire_date
    );

}


/* ============================================================
   ใส่ข้อความลงใน HTML
============================================================ */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        console.warn(
            "ไม่พบ Element:",
            elementId
        );

        return;
    }


    element.textContent =
        value ||
        "-";

}


/* ============================================================
   โหลดรูปนักศึกษา
============================================================ */

function loadStudentPhoto(
    student
) {

    const image =
        document.getElementById(
            "studentPhoto"
        );


    if (!image) {

        console.warn(
            "ไม่พบ studentPhoto"
        );

        return;
    }


    /*
     * ถ้า Google Sheets มี photo_url
     * ให้ใช้รูปจาก photo_url ก่อน
     */

    if (
        student.photo_url &&
        String(
            student.photo_url
        ).trim() !== ""
    ) {

        const photoUrl =
            String(
                student.photo_url
            ).trim();


        image.onload =
            function () {

                console.log(
                    "โหลดรูปจาก photo_url สำเร็จ"
                );

            };


        image.onerror =
            function () {

                console.warn(
                    "photo_url ใช้งานไม่ได้"
                );


                /*
                 * ถ้า photo_url ใช้ไม่ได้
                 * ให้ไปค้นหารูปใน GitHub
                 */

                findGitHubStudentPhoto(
                    image,
                    student.student_id
                );

            };


        image.src =
            photoUrl;


        return;
    }


    /*
     * ถ้า photo_url ว่าง
     * ให้ค้นหารูปจาก GitHub
     */

    findGitHubStudentPhoto(
        image,
        student.student_id
    );

}


/* ============================================================
   ค้นหารูปจาก GitHub
============================================================ */

function findGitHubStudentPhoto(
    image,
    studentId
) {

    /*
     * ถ้าไม่มีรหัสนักศึกษา
     */

    if (
        !studentId ||
        String(
            studentId
        ).trim() === ""
    ) {

        setDefaultPhoto(
            image
        );

        return;
    }


    /*
     * ========================================================
     * GitHub ของคุณ
     * ========================================================
     */

    const githubUsername =
        "nktkhonkaen09-bit";


    const githubRepository =
        "STUDENT-CARD-SYSTEM";


    const githubBranch =
        "main";


    const imageFolder =
        "assets/students";


    /*
     * ชื่อไฟล์
     *
     * เช่น
     *
     * TEST001
     */

    const filename =
        encodeURIComponent(
            String(
                studentId
            ).trim()
        );


    /*
     * รองรับทั้ง 3 แบบ
     */

    const extensions = [

        ".jpg",

        ".jpeg",

        ".png"

    ];


    /*
     * เริ่มค้นหารูป
     */

    tryNextStudentPhoto(
        image,
        githubUsername,
        githubRepository,
        githubBranch,
        imageFolder,
        filename,
        extensions,
        0
    );

}


/* ============================================================
   ทดลองหารูปทีละนามสกุล
============================================================ */

function tryNextStudentPhoto(
    image,
    username,
    repository,
    branch,
    folder,
    filename,
    extensions,
    index
) {

    /*
     * ถ้าลองครบทุกนามสกุลแล้ว
     */

    if (
        index >=
        extensions.length
    ) {

        console.warn(
            "ไม่พบรูป:",
            filename
        );


        /*
         * ใช้รูป Default
         */

        setDefaultPhoto(
            image
        );

        return;
    }


    /*
     * นามสกุลปัจจุบัน
     */

    const extension =
        extensions[index];


    /*
     * สร้าง URL รูป
     */

    const imageUrl =

        "https://raw.githubusercontent.com/" +

        username +

        "/" +

        repository +

        "/" +

        branch +

        "/" +

        folder +

        "/" +

        filename +

        extension;


    console.log(
        "กำลังค้นหารูป:",
        imageUrl
    );


    /*
     * ทดลองโหลดรูป
     */

    image.onload =
        function () {

            console.log(
                "พบรูปนักศึกษา:",
                imageUrl
            );

        };


    /*
     * ถ้าโหลดไม่ได้
     * ให้ลองนามสกุลถัดไป
     */

    image.onerror =
        function () {

            console.log(
                "ไม่พบ:",
                imageUrl
            );


            tryNextStudentPhoto(

                image,

                username,

                repository,

                branch,

                folder,

                filename,

                extensions,

                index + 1

            );

        };


    /*
     * เริ่มโหลด
     */

    image.src =
        imageUrl;

}


/* ============================================================
   รูป Default
============================================================ */

function setDefaultPhoto(
    image
) {

    if (!image) {

        return;
    }


    /*
     * ใช้ default.png
     */

    const defaultPhoto =
        "assets/students/default.png";


    image.onload =
        function () {

            console.log(
                "ใช้รูป Default"
            );

        };


    image.onerror =
        function () {

            console.warn(
                "ไม่พบ default.png"
            );


            /*
             * ถ้าไม่มี default.png
             * ซ่อนรูป
             */

            image.style.display =
                "none";


            if (
                image.parentElement
            ) {

                image.parentElement
                    .classList.add(
                        "no-photo"
                    );

            }

        };


    image.src =
        defaultPhoto;

}


/* ============================================================
   สร้าง QR Code
============================================================ */

function generateStudentQRCode(
    student
) {

    const canvas =
        document.getElementById(
            "studentQR"
        );


    if (!canvas) {

        console.warn(
            "ไม่พบ studentQR"
        );

        return;
    }


    /*
     * ตรวจสอบ QRCode Library
     */

    if (
        typeof QRCode ===
        "undefined"
    ) {

        console.error(
            "ไม่พบ QRCode Library"
        );

        return;
    }


    /*
     * ข้อมูลใน QR Code
     *
     * จะไม่ใส่:
     *
     * - password
     * - password_hash
     * - token
     */

    const qrData = {

        system:
            "STUDENT-CARD-SYSTEM",

        student_id:
            student.student_id || "",

        name:

            (
                student.prefix_th ||
                ""
            ) +

            (
                student.firstname_th ||
                ""
            ) +

            " " +

            (
                student.lastname_th ||
                ""
            ),

        department:
            student.department || "",

        status:
            student.status || "",

        expire_date:
            student.expire_date || ""

    };


    const qrText =
        JSON.stringify(
            qrData
        );


    /*
     * สร้าง QR Code
     */

    QRCode.toCanvas(

        canvas,

        qrText,

        {

            width:
                120,

            height:
                120,

            margin:
                0,

            errorCorrectionLevel:
                "M",

            color: {

                dark:
                    "#000000",

                light:
                    "#ffffff"

            }

        },


        function (error) {

            if (error) {

                console.error(
                    "สร้าง QR Code ไม่สำเร็จ:",
                    error
                );

                return;
            }


            console.log(
                "สร้าง QR Code สำเร็จ"
            );

        }

    );

}


/* ============================================================
   กลับ Dashboard
============================================================ */

function goBack() {

    window.location.href =
        "dashboard.html";

}


/* ============================================================
   ดาวน์โหลดบัตรเป็น PNG
============================================================ */

function downloadCard() {

    /*
     * ตรวจสอบ html2canvas
     */

    if (
        typeof html2canvas ===
        "undefined"
    ) {

        alert(
            "ไม่พบระบบดาวน์โหลดบัตร"
        );

        return;
    }


    const card =
        document.getElementById(
            "studentCard"
        );


    if (!card) {

        alert(
            "ไม่พบบัตรนักศึกษา"
        );

        return;
    }


    /*
     * แปลงบัตรเป็นรูป
     */

    html2canvas(

        card,

        {

            scale:
                3,

            useCORS:
                true,

            allowTaint:
                false,

            backgroundColor:
                null

        }

    ).then(

        function (canvas) {

            /*
             * สร้างชื่อไฟล์
             */

            const studentId =
                getCurrentStudentId();


            /*
             * สร้าง Link ดาวน์โหลด
             */

            const link =
                document.createElement(
                    "a"
                );


            link.download =
                "student-card-" +
                studentId +
                ".png";


            link.href =
                canvas.toDataURL(
                    "image/png"
                );


            link.click();

        }

    ).catch(

        function (error) {

            console.error(
                "Download Error:",
                error
            );


            alert(
                "ไม่สามารถดาวน์โหลดบัตรได้"
            );

        }

    );

}


/* ============================================================
   อ่านรหัสนักศึกษาปัจจุบัน
============================================================ */

function getCurrentStudentId() {

    try {

        const raw =
            sessionStorage.getItem(
                CONFIG.STUDENT_KEY
            );


        if (!raw) {

            return "student";
        }


        const student =
            JSON.parse(
                raw
            );


        return (

            student.student_id ||

            "student"

        );

    } catch (error) {

        return "student";

    }

}


/* ============================================================
   ทำให้ฟังก์ชันใช้งานจาก HTML ได้
============================================================ */

window.goBack =
    goBack;


window.downloadCard =
    downloadCard;


/* =========================================================
   BARCODE รหัสนักศึกษา
   ใช้ CODE128
   ========================================================= */

function createStudentBarcode() {

    const studentIdElement =
        document.getElementById(
            "studentId"
        );

    const barcode =
        document.getElementById(
            "studentBarcode"
        );

    const barcodeStudentId =
        document.getElementById(
            "barcodeStudentId"
        );


    if (
        !studentIdElement ||
        !barcode
    ) {

        return;

    }


    const studentId =
        studentIdElement.textContent
            .trim();


    if (
        !studentId ||
        studentId === "-"
    ) {

        return;

    }


    /*
     * สร้าง CODE128 Barcode
     */

    if (
        typeof JsBarcode === "undefined"
    ) {

        console.error(
            "ไม่พบ JsBarcode"
        );

        return;

    }


    JsBarcode(
        barcode,
        studentId,
        {

            format: "CODE128",

            lineColor: "#000000",

            background: "#ffffff",

            width: 3,

            height: 100,

            displayValue: true,

            fontSize: 18,

            fontOptions: "bold",

            margin: 10

        }
    );


    /*
     * แสดงรหัสใต้ Barcode
     */

    if (barcodeStudentId) {

        barcodeStudentId.textContent =
            studentId;

    }

}


/* =========================================================
   ตรวจสอบข้อมูลแล้วสร้าง Barcode
   ========================================================= */

function waitAndCreateBarcode() {

    let count = 0;

    const timer =
        setInterval(
            function() {

                count++;

                const studentIdElement =
                    document.getElementById(
                        "studentId"
                    );


                if (
                    studentIdElement &&
                    studentIdElement.textContent.trim() !== "-" &&
                    studentIdElement.textContent.trim() !== ""
                ) {

                    clearInterval(timer);

                    createStudentBarcode();

                }


                /*
                 * ป้องกันการรอไม่สิ้นสุด
                 */

                if (count >= 50) {

                    clearInterval(timer);

                }

            },
            200
        );

}


/*
 * เริ่มสร้าง Barcode
 */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        waitAndCreateBarcode
    );

} else {

    waitAndCreateBarcode();

}
