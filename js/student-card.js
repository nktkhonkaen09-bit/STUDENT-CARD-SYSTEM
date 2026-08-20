/* =====================================================
   STUDENT CARD
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    console.log("STUDENT CARD : START");

    loadStudent();

});


/* =====================================================
   LOAD STUDENT
   ===================================================== */

function loadStudent() {

    const key = CONFIG.STUDENT_KEY;

    console.log("Student Key =", key);


    const data = sessionStorage.getItem(key);

    console.log("Student Data =", data);


    if (!data) {

        console.error(
            "ไม่พบข้อมูลนักศึกษาใน sessionStorage"
        );

        showError(
            "ไม่พบข้อมูลนักศึกษา กรุณาเข้าสู่ระบบใหม่"
        );

        return;
    }


    let student;

    try {

        student = JSON.parse(data);

    } catch (error) {

        console.error(
            "ไม่สามารถอ่านข้อมูลนักศึกษาได้",
            error
        );

        showError(
            "ข้อมูลนักศึกษาไม่ถูกต้อง"
        );

        return;
    }


    console.log(
        "Student Object =",
        student
    );


    displayStudent(student);

}


/* =====================================================
   DISPLAY STUDENT
   ===================================================== */

function displayStudent(student) {


    // รหัสนักศึกษา
    setText(
        "studentId",
        student.student_id
    );


    // ชื่อภาษาไทย
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


    // ชื่อภาษาอังกฤษ
    const englishName = [

        student.firstname_en,
        student.lastname_en

    ]
    .filter(Boolean)
    .join(" ");


    setText(
        "studentNameEn",
        englishName
    );


    // สาขาวิชา
    setText(
        "studentDepartment",
        student.department
    );


    // สถานะ
    setText(
        "studentStatus",
        student.status
    );


    // วันที่ออกบัตร
    setText(
        "issueDate",
        student.issue_date
    );


    // วันที่หมดอายุ
    setText(
        "expireDate",
        student.expire_date
    );


    // รูปนักศึกษา
    loadPhoto(
        student.student_id,
        student.photo_url
    );


    // QR Code
    createQR(
        student.student_id
    );


    // Barcode
    createBarcode(
        student.student_id
    );

}


/* =====================================================
   SET TEXT
   ===================================================== */

function setText(id, value) {

    const element =
        document.getElementById(id);


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
   LOAD PHOTO
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

        console.warn(
            "ไม่พบ studentPhoto"
        );

        return;
    }


    /*
     * ถ้ามี photo_url จาก API
     */

    if (
        photoUrl &&
        photoUrl.trim() !== ""
    ) {

        image.src = photoUrl;

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


    const png =
        baseURL +
        studentId +
        ".png";


    const jpg =
        baseURL +
        studentId +
        ".jpg";


    /*
     * เริ่มจาก PNG
     */

    image.src = png;


    /*
     * ถ้า PNG ไม่มี
     * ให้ลอง JPG
     */

    image.onerror = function () {

        image.onerror = null;

        image.src = jpg;

    };

}


/* =====================================================
   QR CODE
   ===================================================== */

function createQR(studentId) {

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


    if (
        typeof QRCode === "undefined"
    ) {

        console.error(
            "ไม่พบ QRCode Library"
        );

        return;
    }


    QRCode.toCanvas(

        canvas,

        String(studentId),

        {

            width: 300,

            margin: 2,

            errorCorrectionLevel: "H",

            color: {

                dark: "#000000",

                light: "#FFFFFF"

            }

        },

        function (error) {

            if (error) {

                console.error(
                    "QR Code Error:",
                    error
                );

            }

        }

    );

}


/* =====================================================
   BARCODE
   ===================================================== */

function createBarcode(studentId) {

    const barcode =
        document.getElementById(
            "studentBarcode"
        );


    const barcodeText =
        document.getElementById(
            "barcodeStudentId"
        );


    if (!barcode) {

        console.warn(
            "ไม่พบ studentBarcode"
        );

        return;
    }


    if (
        typeof JsBarcode === "undefined"
    ) {

        console.error(
            "ไม่พบ JsBarcode Library"
        );

        return;
    }


    JsBarcode(

        barcode,

        String(studentId),

        {

            format: "CODE128",

            width: 2,

            height: 55,

            displayValue: false,

            lineColor: "#000000",

            background: "#FFFFFF",

            margin: 2

        }

    );


    if (barcodeText) {

        barcodeText.textContent =
            studentId;

    }

}


/* =====================================================
   ERROR
   ===================================================== */

function showError(message) {

    const card =
        document.getElementById(
            "studentCard"
        );


    if (!card) {

        alert(message);

        return;
    }


    const error =
        document.createElement(
            "div"
        );


    error.style.position =
        "absolute";

    error.style.left =
        "50%";

    error.style.top =
        "50%";

    error.style.transform =
        "translate(-50%, -50%)";

    error.style.background =
        "#ffffff";

    error.style.color =
        "#cc0000";

    error.style.padding =
        "20px";

    error.style.borderRadius =
        "12px";

    error.style.zIndex =
        "9999";

    error.style.textAlign =
        "center";

    error.style.fontWeight =
        "bold";

    error.textContent =
        message;


    card.appendChild(error);

}
