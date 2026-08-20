/* =====================================================
   STUDENT CARD
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
   LOAD STUDENT
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
            "JSON ERROR:",
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


    /* =====================================
       STUDENT ID
       ===================================== */

    setText(
        "studentId",
        student.student_id
    );


    /* =====================================
       NAME
       ===================================== */

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


    /* =====================================
       DEPARTMENT
       ===================================== */

    setText(
        "studentDepartment",
        student.department
    );


    /* =====================================
       STATUS
       ===================================== */

    /*
     * ตอนนี้ API มี status
     * จึงใช้แสดงแทนระดับชั้นก่อน
     */

    setText(
        "studentLevel",
        student.status
    );


    /*
     * API ยังไม่มีประเภทวิชา
     */

    setText(
        "studentType",
        "-"
    );


    /* =====================================
       DATES
       ===================================== */

    setText(
        "issueDate",
        student.issue_date
    );


    setText(
        "expireDate",
        student.expire_date
    );


    /* =====================================
       PHOTO
       ===================================== */

    loadPhoto(
        student.student_id,
        student.photo_url
    );


    /* =====================================
       QR
       ===================================== */

    createQR(
        student.student_id
    );


    /* =====================================
       BARCODE
       ===================================== */

    createBarcode(
        student.student_id
    );

}


/* =====================================================
   SET TEXT
   ===================================================== */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        console.warn(
            "ไม่พบ element:",
            id
        );

        return;

    }


    element.textContent =
        value || "-";

}


/* =====================================================
   PHOTO
   ===================================================== */

function loadPhoto(
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
     */

    if (
        photoUrl &&
        photoUrl.trim() !== ""
    ) {

        image.src =
            photoUrl;

        return;

    }


    /*
     * GitHub
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


    /*
     * PNG
     */

    image.src =
        pngURL;


    /*
     * ถ้าไม่มี PNG
     * ลอง JPG
     */

    image.onerror =
        function () {

            image.onerror =
                null;

            image.src =
                jpgURL;

        };

}


/* =====================================================
   QR CODE
   ===================================================== */

function createQR(
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


    if (!qr || !studentId) {

        return;

    }


    const qrURL =

        "https://api.qrserver.com/v1/create-qr-code/" +

        "?size=500x500" +

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


    qr.onclick =
        function () {

            openQR();

        };

}


/* =====================================================
   OPEN QR
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


    if (!barcode) {

        return;

    }


    if (
        typeof JsBarcode ===
        "undefined"
    ) {

        console.error(
            "JsBarcode ไม่พร้อมใช้งาน"
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
            "ระบบดาวน์โหลดไม่พร้อมใช้งาน"
        );

        return;

    }


    html2canvas(

        card,

        {

            scale: 2,

            useCORS: true,

            allowTaint: false,

            backgroundColor: null

        }

    )
    .then(
        function (canvas) {

            const link =
                document.createElement(
                    "a"
                );


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
   BACK
   ===================================================== */

function goBack() {

    window.location.href =
        "dashboard.html";

}
