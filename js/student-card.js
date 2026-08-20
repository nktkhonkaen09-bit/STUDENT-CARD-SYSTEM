/**
 * ============================================================
 * STUDENT CARD SYSTEM
 * student-card.js
 * ============================================================
 *
 * หน้าที่:
 * 1. ตรวจสอบ Session
 * 2. อ่านข้อมูลนักศึกษาจาก sessionStorage
 * 3. แสดงข้อมูลบนบัตรนักศึกษา
 * 4. โหลดรูปจาก photo_url หรือ GitHub
 * 5. รองรับ JPG / JPEG / PNG
 * 6. สร้าง QR Code
 * 7. รองรับการกลับ Dashboard
 * 8. รองรับการพิมพ์บัตร
 *
 * ============================================================
 */


/* ============================================================
   เมื่อหน้าเว็บโหลดเสร็จ
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeStudentCard();

    }
);


/* ============================================================
   เริ่มต้นระบบบัตรนักศึกษา
============================================================ */

function initializeStudentCard() {

    /*
     * ตรวจสอบว่ามี CONFIG หรือไม่
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
     * ตรวจสอบ Session
     */

    const token =
        sessionStorage.getItem(
            CONFIG.SESSION_KEY
        );


    const studentData =
        sessionStorage.getItem(
            CONFIG.STUDENT_KEY
        );


    /*
     * ถ้าไม่มี Session
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
     * อ่านข้อมูลนักศึกษา
     */

    let student;


    try {

        student =
            JSON.parse(
                studentData
            );

    } catch (error) {

        console.error(
            "ไม่สามารถอ่านข้อมูลนักศึกษา:",
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
     * แสดงข้อมูล
     */

    displayStudentInformation(
        student
    );


    /*
     * โหลดรูป
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

    const prefixTh =
        student.prefix_th || "";


    const firstnameTh =
        student.firstname_th || "";


    const lastnameTh =
        student.lastname_th || "";


    const fullNameTh =
        (
            prefixTh +
            firstnameTh +
            " " +
            lastnameTh
        ).trim();


    setText(
        "studentName",
        fullNameTh || "-"
    );


    /*
     * ชื่อภาษาอังกฤษ
     */

    const firstnameEn =
        student.firstname_en || "";


    const lastnameEn =
        student.lastname_en || "";


    const fullNameEn =
        (
            firstnameEn +
            " " +
            lastnameEn
        ).trim();


    setText(
        "studentNameEn",
        fullNameEn || "-"
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
   ฟังก์ชันใส่ข้อความ
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
     * ป้องกันการโหลดรูปซ้ำ
     */

    image.removeAttribute(
        "src"
    );


    /*
     * ถ้ามี photo_url
     * ให้ใช้ photo_url ก่อน
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


        loadImage(
            image,
            photoUrl,

            function () {

                console.log(
                    "โหลดรูปจาก photo_url สำเร็จ"
                );

            },

            function () {

                console.warn(
                    "photo_url ใช้งานไม่ได้"
                );


                /*
                 * ถ้า URL ใช้ไม่ได้
                 * ให้ไปค้นหาที่ GitHub
                 */

                findGitHubStudentPhoto(
                    image,
                    student.student_id
                );

            }
        );


        return;

    }


    /*
     * ถ้าไม่มี photo_url
     * ค้นหาจาก GitHub
     */

    findGitHubStudentPhoto(
        image,
        student.student_id
    );

}


/* ============================================================
   โหลดรูปและตรวจสอบว่าสำเร็จหรือไม่
============================================================ */

function loadImage(
    image,
    url,
    onSuccess,
    onError
) {

    /*
     * ล้าง Event เดิม
     */

    image.onload =
        null;

    image.onerror =
        null;


    image.onload =
        function () {

            if (
                typeof onSuccess ===
                "function"
            ) {

                onSuccess();

            }

        };


    image.onerror =
        function () {

            if (
                typeof onError ===
                "function"
            ) {

                onError();

            }

        };


    image.src =
        url;

}


/* ============================================================
   ค้นหารูปนักศึกษาจาก GitHub
============================================================ */

function findGitHubStudentPhoto(
    image,
    studentId
) {

    /*
     * ตรวจสอบรหัสนักศึกษา
     */

    if (
        !studentId ||
        String(
            studentId
        ).trim() === ""
    ) {

        console.warn(
            "ไม่มีรหัสนักศึกษา"
        );


        setDefaultPhoto(
            image
        );


        return;

    }


    /*
     * GitHub Username
     */

    const githubUsername =
        "ntkthonkaen09-bit";


    /*
     * GitHub Repository
     */

    const githubRepository =
        "STUDENT-CARD-SYSTEM";


    /*
     * Branch
     */

    const githubBranch =
        "main";


    /*
     * Folder รูป
     */

    const imageFolder =
        "assets/students";


    /*
     * รหัสนักศึกษา
     */

    const filename =
        encodeURIComponent(
            String(
                studentId
            ).trim()
        );


    /*
     * รองรับทั้ง JPG / JPEG / PNG
     *
     * จะค้นหาตามลำดับนี้
     *
     * 1. .jpg
     * 2. .jpeg
     * 3. .png
     */

    const extensions = [
        ".jpg",
        ".jpeg",
        ".png"
    ];


    /*
     * เริ่มค้นหา
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
   ลองโหลดรูปทีละนามสกุล
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
     * ถ้าค้นหาครบทุกนามสกุลแล้ว
     */

    if (
        index >=
        extensions.length
    ) {

        console.warn(
            "ไม่พบรูปนักศึกษา:",
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
     * สร้าง URL GitHub Raw
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
     * ลองโหลดรูป
     */

    loadImage(

        image,

        imageUrl,


        function () {

            /*
             * สำเร็จ
             */

            console.log(
                "พบรูปนักศึกษา:",
                imageUrl
            );

        },


        function () {

            /*
             * ไม่พบ
             *
             * ลองนามสกุลถัดไป
             */

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

        }

    );

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
     * ใช้รูป Default
     */

    const defaultPhoto =
        "assets/students/default.png";


    /*
     * ป้องกัน Loop
     */

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
             * ให้แสดงพื้นหลังแทน
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
     * ตรวจสอบว่ามี QRCode Library
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
     * ข้อมูลที่บันทึกใน QR
     *
     * ไม่ใส่ password
     * ไม่ใส่ password_hash
     * ไม่ใส่ token
     */

    const qrData = {

        system:
            "STUDENT-CARD-SYSTEM",

        student_id:
            student.student_id || "",

        name:
            (
                student.prefix_th || ""
            ) +
            (
                student.firstname_th || ""
            ) +
            " " +
            (
                student.lastname_th || ""
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
                    "#5d4700",

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
   ดาวน์โหลดบัตร
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
            "ฟังก์ชันดาวน์โหลดจะเปิดใช้งานในขั้นตอนถัดไป"
        );

        return;

    }


    const card =
        document.getElementById(
            "studentCard"
        );


    if (!card) {

        return;

    }


    html2canvas(
        card,
        {

            scale:
                3,

            useCORS:
                true,

            backgroundColor:
                null

        }

    ).then(
        function (canvas) {

            const link =
                document.createElement(
                    "a"
                );


            const studentId =
                getCurrentStudentId();


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
   ป้องกันการเรียกฟังก์ชันที่ไม่มี
============================================================ */

window.goBack =
    goBack;


window.downloadCard =
    downloadCard;
