/* =====================================================
   STUDENT CARD SYSTEM
   ===================================================== */


/* =====================================================
   START
   ===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "STUDENT CARD JS LOADED"
        );

        loadStudent();

    }
);


/* =====================================================
   LOAD STUDENT DATA
   ===================================================== */

function loadStudent() {

    const data =
        sessionStorage.getItem(
            CONFIG.STUDENT_KEY
        );


    console.log(
        "STUDENT DATA:",
        data
    );


    /*
     * ถ้าไม่มีข้อมูล
     */

    if (!data) {

        alert(
            "ไม่พบข้อมูลนักศึกษา กรุณาเข้าสู่ระบบใหม่"
        );

        window.location.href =
            "index.htm";

        return;

    }


    let student;


    try {

        student =
            JSON.parse(data);

    }
    catch (error) {

        console.error(
            "STUDENT JSON ERROR:",
            error
        );

        alert(
            "ข้อมูลนักศึกษาไม่ถูกต้อง"
        );

        return;

    }


    console.log(
        "STUDENT:",
        student
    );


    displayStudent(
        student
    );

}


/* =====================================================
   DISPLAY STUDENT
   ===================================================== */

function displayStudent(
    student
) {


    /* =========================================
       1. รหัสนักศึกษา
       ========================================= */

    setText(
        "studentId",
        student.student_id
    );


    /* =========================================
       2. ชื่อ-สกุล
       ========================================= */

    const thaiName = [

        student.prefix_th,

        student.firstname_th,

        student.lastname_th

    ]
    .filter(Boolean)
    .join(" ");


    setText(
        "studentName",
        thaiName
    );


    /* =========================================
       3. สาขาวิชา
       ========================================= */

    setText(
        "studentDepartment",
        student.department
    );


    /* =========================================
       4. สถานะ
       ========================================= */

    setText(
        "studentStatus",
        student.status
    );


    /* =========================================
       วันออกบัตร
       ========================================= */

    setText(
        "issueDate",
        student.issue_date
    );


    /* =========================================
       วันหมดอายุ
       ========================================= */

    setText(
        "expireDate",
        student.expire_date
    );


    /* =========================================
       รูปนักศึกษา
       ========================================= */

    loadStudentPhoto(
        student.student_id,
        student.photo_url
    );


    /* =========================================
       QR CODE
       ========================================= */

    createQRCode(
        student.student_id
    );


    /* =========================================
       BARCODE
       ========================================= */

    createBarcode(
        student.student_id
    );

}


/* =====================================================
   SET TEXT
   ===================================================== */

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
            "ไม่พบ element:",
            elementId
        );

        return;

    }


    element.textContent =
        value ||
        "-";

}


/* =====================================================
   LOAD STUDENT PHOTO
   รองรับ PNG และ JPG
   ===================================================== */

function loadStudentPhoto(
    studentId,
    photoUrl
) {

    const image =
        document.getElementById(
            "studentPhoto"
        );


    if (!image) {

        return;

    }


    /*
     * ถ้า API มี photo_url
     * ให้ใช้ก่อน
     */

    if (
        photoUrl &&
        String(photoUrl).trim() !== ""
    ) {

        image.src =
            photoUrl;

        return;

    }


    /*
     * GitHub RAW
     */

    const baseURL =

        "https://raw.githubusercontent.com/" +

        "nktkhonkaen09-bit/" +

        "STUDENT-CARD-SYSTEM/" +

        "main/assets/students/";


    const pngURL =
        baseURL +
        studentId +
        ".png";


    const jpgURL =
        baseURL +
        studentId +
        ".jpg";


    const jpegURL =
        baseURL +
        studentId +
        ".jpeg";


    /*
     * เริ่มจาก PNG
     */

    image.src =
        pngURL;


    /*
     * ถ้า PNG ไม่พบ
     * ลอง JPG
     */

    image.onerror =
        function () {

            image.onerror =
                null;

            image.src =
                jpgURL;


            /*
             * ถ้า JPG ไม่พบ
             * ลอง JPEG
             */

            image.onerror =
                function () {

                    image.onerror =
                        null;

                    image.src =
                        jpegURL;


                    /*
                     * ถ้าไม่มีทั้งหมด
                     */

                    image.onerror =
                        function () {

                            image.onerror =
                                null;

                            console.warn(
                                "ไม่พบรูป:",
                                studentId
                            );

                            image.removeAttribute(
                                "src"
                            );

                        };

                };

        };

}


/* =====================================================
   CREATE QR CODE
   ===================================================== */

function createQRCode(
    studentId
) {

    const qr =
        document.getElementById(
            "studentQR"
        );


    const qrFull =
        document.getElementById(
            "qrFull"
        );


    if (
        !qr ||
        !studentId
    ) {

        return;

    }


    /*
     * QR สีดำ
     */

    const qrURL =

        "https://api.qrserver.com/v1/create-qr-code/" +

        "?size=600x600" +

        "&color=000000" +

        "&bgcolor=ffffff" +

        "&data=" +

        encodeURIComponent(
            String(studentId)
        );


    qr.src =
        qrURL;


    if (qrFull) {

        qrFull.src =
            qrURL;

    }


    /*
     * แตะ QR
     */

    qr.onclick =
        function () {

            openQR();

        };

}


/* =====================================================
   OPEN QR FULL SCREEN
   ===================================================== */

function openQR() {

    const overlay =
        document.getElementById(
            "qrOverlay"
        );


    if (!overlay) {

        return;

    }


    overlay.classList.add(
        "show"
    );


    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   CLOSE QR
   ===================================================== */

function closeQR() {

    const overlay =
        document.getElementById(
            "qrOverlay"
        );


    if (!overlay) {

        return;

    }


    overlay.classList.remove(
        "show"
    );


    document.body.style.overflow =
        "";

}


/* =====================================================
   BARCODE
   ===================================================== */

function createBarcode(
    studentId
) {

    const barcode =
        document.getElementById(
            "studentBarcode"
        );


    if (
        !barcode ||
        !studentId
    ) {

        return;

    }


    /*
     * ตรวจว่า JsBarcode โหลดแล้ว
     */

    if (
        typeof JsBarcode ===
        "undefined"
    ) {

        console.error(
            "ไม่พบ JsBarcode"
        );

        return;

    }


    try {

        JsBarcode(

            barcode,

            String(studentId),

            {

                format:
                    "CODE128",

                width:
                    2,

                height:
                    55,

                displayValue:
                    false,

                lineColor:
                    "#000000",

                background:
                    "transparent",

                margin:
                    0

            }

        );

    }
    catch (error) {

        console.error(
            "BARCODE ERROR:",
            error
        );

    }

}


/* =====================================================
   DOWNLOAD CARD
   ===================================================== */

function downloadCard() {

    const card =
        document.getElementById(
            "studentCard"
        );


    if (!card) {

        return;

    }


    if (
        typeof html2canvas ===
        "undefined"
    ) {

        alert(
            "ระบบดาวน์โหลดบัตรยังไม่พร้อมใช้งาน"
        );

        return;

    }


    html2canvas(

        card,

        {

            scale: 2,

            useCORS: true,

            allowTaint: false,

            backgroundColor:
                null

        }

    )
    .then(
        function (canvas) {


            const studentId =
                document.getElementById(
                    "studentId"
                );


            const id =
                studentId
                    ?
                    studentId.textContent
                    :
                    "student";


            const link =
                document.createElement(
                    "a"
                );


            link.download =
                "student-card-" +
                id +
                ".png";


            link.href =
                canvas.toDataURL(
                    "image/png"
                );


            link.click();

        }
    )
    .catch(
        function (error) {

            console.error(
                "DOWNLOAD ERROR:",
                error
            );

            alert(
                "ไม่สามารถดาวน์โหลดบัตรได้"
            );

        }
    );

}


/* =====================================================
   BACK TO DASHBOARD
   ===================================================== */

function goBack() {

    window.location.href =
        "dashboard.html";

}


/* =====================================================
   ESC = CLOSE QR
   ===================================================== */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            closeQR();

        }

    }
);
