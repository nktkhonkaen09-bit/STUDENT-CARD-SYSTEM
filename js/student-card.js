/* =========================================================
   STUDENT CARD
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("Student Card: เริ่มทำงาน");

    loadStudentData();

});


/* =========================================================
   โหลดข้อมูลนักศึกษา
   ========================================================= */

function loadStudentData() {

    let student = null;


    /*
     * รายการชื่อที่ระบบอาจเก็บข้อมูลไว้
     */

    const storageKeys = [
        "student",
        "studentData",
        "currentStudent",
        "loginStudent",
        "user",
        "userData"
    ];


    /*
     * ลอง sessionStorage
     */

    for (const key of storageKeys) {

        try {

            const data =
                sessionStorage.getItem(key);

            if (data) {

                const parsed =
                    JSON.parse(data);

                if (
                    parsed &&
                    (
                        parsed.student_id ||
                        parsed.student
                    )
                {

                    student =
                        parsed.student ||
                        parsed;

                    console.log(
                        "พบข้อมูลจาก sessionStorage:",
                        key,
                        student
                    );

                    break;

                }

            }

        } catch (error) {

            console.log(
                "อ่าน sessionStorage:",
                key,
                error
            );

        }

    }


    /*
     * ถ้ายังไม่พบ
     * ลอง localStorage
     */

    if (!student) {

        for (const key of storageKeys) {

            try {

                const data =
                    localStorage.getItem(key);

                if (data) {

                    const parsed =
                        JSON.parse(data);

                    if (
                        parsed &&
                        (
                            parsed.student_id ||
                            parsed.student
                        )
                    {

                        student =
                            parsed.student ||
                            parsed;

                        console.log(
                            "พบข้อมูลจาก localStorage:",
                            key,
                            student
                        );

                        break;

                    }

                }

            } catch (error) {

                console.log(
                    "อ่าน localStorage:",
                    key,
                    error
                );

            }

        }

    }


    /*
     * ถ้าพบข้อมูล
     */

    if (student) {

        displayStudent(student);

        return;

    }


    /*
     * ไม่พบข้อมูล
     */

    console.error(
        "ไม่พบข้อมูลนักศึกษาใน Storage"
    );


    showError(
        "ไม่พบข้อมูลนักศึกษา กรุณากลับไปเข้าสู่ระบบใหม่"
    );

}



/* =========================================================
   แสดงข้อมูลนักศึกษา
   ========================================================= */

function displayStudent(student) {

    console.log(
        "ข้อมูลนักศึกษา:",
        student
    );


    /*
     * รหัสนักศึกษา
     */

    setText(
        "studentId",
        student.student_id
    );


    /*
     * ชื่อภาษาไทย
     */

    const thaiName =
        [
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
     * ชื่อภาษาอังกฤษ
     */

    const englishName =
        [
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
        student.status
    );


    /*
     * วันออกบัตร
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


    /*
     * รูป
     */

    loadStudentPhoto(
        student
    );


    /*
     * QR Code
     */

    createQRCode(
        student.student_id
    );


    /*
     * Barcode
     */

    createBarcode(
        student.student_id
    );

}



/* =========================================================
   ใส่ข้อความ
   ========================================================= */

function setText(
    id,
    value
) {

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



/* =========================================================
   รูปนักศึกษา
   ========================================================= */

function loadStudentPhoto(student) {

    const image =
        document.getElementById(
            "studentPhoto"
        );


    if (!image) {

        return;

    }


    const studentId =
        student.student_id;


    if (!studentId) {

        return;

    }


    /*
     * ถ้ามี photo_url จาก API
     */

    if (
        student.photo_url &&
        student.photo_url.trim() !== ""
    ) {

        image.src =
            student.photo_url;

        return;

    }


    /*
     * GitHub
     */

    const baseUrl =
        "https://raw.githubusercontent.com/" +
        "nktkhonkaen09-bit/" +
        "STUDENT-CARD-SYSTEM/" +
        "main/assets/students/";


    const png =
        baseUrl +
        encodeURIComponent(studentId) +
        ".png";


    const jpg =
        baseUrl +
        encodeURIComponent(studentId) +
        ".jpg";


    image.onerror =
        function () {

            /*
             * ถ้า PNG ไม่พบ
             * ลอง JPG
             */

            if (
                image.src !== jpg
            ) {

                image.src = jpg;

            }

        };


    image.src = png;

}



/* =========================================================
   QR CODE
   ========================================================= */

function createQRCode(
    studentId
) {

    const canvas =
        document.getElementById(
            "studentQR"
        );


    if (
        !canvas ||
        !studentId
    ) {

        return;

    }


    if (
        typeof QRCode === "undefined"
    ) {

        console.error(
            "QRCode Library ไม่พร้อมใช้งาน"
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
                    "สร้าง QR ไม่สำเร็จ:",
                    error
                );

            }

        }
    );

}



/* =========================================================
   BARCODE
   ========================================================= */

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


    if (
        !barcode ||
        !studentId
    ) {

        return;

    }


    if (
        typeof JsBarcode === "undefined"
    ) {

        console.error(
            "JsBarcode Library ไม่พร้อมใช้งาน"
        );

        return;

    }


    try {

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

    } catch (error) {

        console.error(
            "สร้าง Barcode ไม่สำเร็จ:",
            error
        );

    }

}



/* =========================================================
   กลับ Dashboard
   ========================================================= */

function goBack() {

    window.location.href =
        "dashboard.html";

}



/* =========================================================
   ดาวน์โหลดบัตร
   ========================================================= */

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
            "ไม่พบระบบดาวน์โหลดบัตร"
        );

        return;

    }


    html2canvas(
        card,
        {

            scale: 2,

            useCORS: true,

            backgroundColor: null

        }
    )
    .then(function (canvas) {

        const link =
            document.createElement("a");


        const id =
            document.getElementById(
                "studentId"
            );


        let studentId =
            "student";


        if (
            id &&
            id.textContent.trim()
        ) {

            studentId =
                id.textContent.trim();

        }


        link.download =
            "student-card-" +
            studentId +
            ".png";


        link.href =
            canvas.toDataURL(
                "image/png"
            );


        link.click();

    })
    .catch(function (error) {

        console.error(
            "ดาวน์โหลดไม่สำเร็จ:",
            error
        );

        alert(
            "ไม่สามารถดาวน์โหลดบัตรได้"
        );

    });

}



/* =========================================================
   แสดง Error
   ========================================================= */

function showError(message) {

    const card =
        document.getElementById(
            "studentCard"
        );


    if (!card) {

        return;

    }


    const error =
        document.createElement("div");


    error.style.position =
        "absolute";


    error.style.left =
        "50%";


    error.style.top =
        "50%";


    error.style.transform =
        "translate(-50%, -50%)";


    error.style.zIndex =
        "999";


    error.style.background =
        "#ffffff";


    error.style.color =
        "#cc0000";


    error.style.padding =
        "25px";


    error.style.borderRadius =
        "12px";


    error.style.fontSize =
        "20px";


    error.style.fontWeight =
        "bold";


    error.style.textAlign =
        "center";


    error.textContent =
        message;


    card.appendChild(error);

}
