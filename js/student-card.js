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
            "STUDENT CARD : START"
        );


        loadStudent();

    }
);


/* =====================================================
   LOAD STUDENT
   ===================================================== */

function loadStudent() {

    console.log(
        "กำลังโหลดข้อมูลนักศึกษา..."
    );


    /*
     * ใช้ Key เดียวกับ Login
     */

    const key =
        CONFIG.STUDENT_KEY;


    console.log(
        "Student Key:",
        key
    );


    /*
     * อ่านข้อมูลจาก Session
     */

    const data =
        sessionStorage.getItem(
            key
        );


    console.log(
        "Student Data:",
        data
    );


    /*
     * ถ้าไม่มีข้อมูล
     */

    if (!data) {

        console.error(
            "ไม่พบข้อมูลนักศึกษา"
        );


        showError(
            "ไม่พบข้อมูลนักศึกษา กรุณาเข้าสู่ระบบใหม่"
        );


        return;

    }


    let student;


    /*
     * แปลง JSON
     */

    try {

        student =
            JSON.parse(data);

    }
    catch (error) {

        console.error(
            "JSON ERROR:",
            error
        );


        showError(
            "ข้อมูลนักศึกษาไม่ถูกต้อง"
        );


        return;

    }


    console.log(
        "Student Object:",
        student
    );


    /*
     * แสดงข้อมูล
     */

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


    /*
     * Student ID
     */

    setText(
        "studentId",
        student.student_id
    );


    /*
     * Thai Name
     */

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


    /*
     * English Name
     */

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


    /*
     * Department
     */

    setText(
        "studentDepartment",
        student.department
    );


    /*
     * Status
     */

    setText(
        "studentStatus",
        student.status
    );


    /*
     * Issue Date
     */

    setText(
        "issueDate",
        student.issue_date
    );


    /*
     * Expire Date
     */

    setText(
        "expireDate",
        student.expire_date
    );


    /*
     * Photo
     */

    loadPhoto(
        student.student_id,
        student.photo_url
    );


    /*
     * QR
     */

    createQR(
        student.student_id
    );


    /*
     * Barcode
     */

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
            "ไม่พบ:",
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

        return;

    }


    /*
     * ถ้ามี URL จาก API
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


    /*
     * ลอง PNG ก่อน
     */

    image.src =
        pngURL;


    /*
     * ถ้า PNG ไม่เจอ
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
   CREATE QR CODE
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


    if (!qr) {

        console.warn(
            "ไม่พบ studentQR"
        );


        return;

    }


    if (!studentId) {

        console.warn(
            "ไม่มี Student ID"
        );


        return;

    }


    /*
     * QR Server
     *
     * ใช้รหัสนักศึกษาเป็นข้อมูล
     */

    const qrURL =

        "https://api.qrserver.com/v1/create-qr-code/" +

        "?size=500x500" +

        "&color=000000" +

        "&bgcolor=ffffff" +

        "&data=" +

        encodeURIComponent(
            String(studentId)
        );


    /*
     * QR ในหน้า
     */

    qr.src =
        qrURL;


    /*
     * QR เต็มจอ
     */

    if (qrFull) {

        qrFull.src =
            qrURL;

    }


    /*
     * เมื่อแตะ QR
     */

    qr.onclick =
        function () {

            openQR();

        };


    console.log(
        "QR Code:",
        studentId
    );

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
                    45,

                displayValue:
                    false,

                lineColor:
                    "#000000",

                background:
                    "#ffffff",

                margin:
                    2

            }

        );


        if (barcodeText) {

            barcodeText.textContent =
                studentId;

        }


        console.log(
            "Barcode สำเร็จ:",
            studentId
        );


    }
    catch (error) {

        console.error(
            "Barcode Error:",
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

        alert(
            "ไม่พบข้อมูลบัตร"
        );


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

            scale:
                2,

            useCORS:
                true,

            allowTaint:
                false,

            backgroundColor:
                null

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


            let id =
                "student";


            if (
                studentId &&
                studentId.textContent
                    .trim()
            ) {

                id =
                    studentId
                        .textContent
                        .trim();

            }


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
                "Download Error:",
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


/* =====================================================
   ERROR
   ===================================================== */

function showError(
    message
) {

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


    error.style.zIndex =
        "9999";


    error.style.background =
        "#ffffff";


    error.style.color =
        "#dc2626";


    error.style.padding =
        "20px";


    error.style.borderRadius =
        "12px";


    error.style.textAlign =
        "center";


    error.style.fontWeight =
        "bold";


    error.style.boxShadow =
        "0 5px 20px rgba(0,0,0,0.2)";


    error.textContent =
        message;


    card.appendChild(
        error
    );

}
