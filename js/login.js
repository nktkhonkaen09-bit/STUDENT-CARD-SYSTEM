/* =========================================================
   STUDENT CARD SYSTEM
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("=================================");
    console.log("STUDENT CARD: START");
    console.log("=================================");

    loadStudentData();

});


/* =========================================================
   โหลดข้อมูลนักศึกษา
   ========================================================= */

function loadStudentData() {

    let student = null;


    /*
     * =====================================================
     * จุดสำคัญ
     *
     * Login ของคุณเก็บข้อมูลด้วย
     *
     * CONFIG.STUDENT_KEY
     *
     * ดังนั้นเราจะอ่านด้วย Key เดียวกัน
     * =====================================================
     */

    try {

        if (
            typeof CONFIG !== "undefined" &&
            CONFIG.STUDENT_KEY
        ) {

            const data =
                sessionStorage.getItem(
                    CONFIG.STUDENT_KEY
                );


            console.log(
                "STUDENT KEY:",
                CONFIG.STUDENT_KEY
            );


            console.log(
                "STUDENT DATA:",
                data
            );


            if (data) {

                student =
                    JSON.parse(data);

            }

        }

    } catch (error) {

        console.error(
            "อ่านข้อมูลนักศึกษาไม่สำเร็จ:",
            error
        );

    }



    /*
     * =====================================================
     * ถ้ายังไม่พบข้อมูล
     * ลอง Key สำรอง
     * =====================================================
     */

    if (!student) {

        const backupKeys = [

            "student",

            "studentData",

            "currentStudent",

            "userData"

        ];


        for (
            const key of backupKeys
        ) {

            try {

                const data =
                    sessionStorage.getItem(
                        key
                    );


                if (data) {

                    const parsed =
                        JSON.parse(data);


                    if (
                        parsed &&
                        parsed.student_id
                    ) {

                        student =
                            parsed;

                        console.log(
                            "พบข้อมูลจาก:",
                            key
                        );

                        break;

                    }

                }

            } catch (error) {

                console.log(
                    "ไม่สามารถอ่าน:",
                    key
                );

            }

        }

    }



    /*
     * =====================================================
     * ตรวจสอบข้อมูล
     * =====================================================
     */

    if (!student) {

        console.error(
            "ไม่พบข้อมูลนักศึกษา"
        );


        showCardError(
            "ไม่พบข้อมูลนักศึกษา กรุณาเข้าสู่ระบบใหม่"
        );


        return;

    }



    console.log(
        "STUDENT OBJECT:",
        student
    );



    /*
     * =====================================================
     * แสดงข้อมูล
     * =====================================================
     */

    displayStudent(student);

}



/* =========================================================
   แสดงข้อมูลนักศึกษา
   ========================================================= */

function displayStudent(student) {


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

    const fullNameTH = [

        student.prefix_th,

        student.firstname_th,

        student.lastname_th

    ]
    .filter(Boolean)
    .join(" ");


    setText(
        "studentName",
        fullNameTH
    );



    /*
     * ชื่อภาษาอังกฤษ
     */

    const fullNameEN = [

        student.firstname_en,

        student.lastname_en

    ]
    .filter(Boolean)
    .join(" ");


    setText(
        "studentNameEn",
        fullNameEN
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
     * รูปนักศึกษา
     */

    loadStudentPhoto(student);



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
   แสดงข้อความ
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
     * ถ้า API มี photo_url
     */

    if (
        student.photo_url &&
        student.photo_url.trim() !== ""
    ) {

        image.src =
            student.photo_url;

        console.log(
            "ใช้ photo_url:",
            student.photo_url
        );

        return;

    }



    /*
     * GitHub
     */

    const githubBase =

        "https://raw.githubusercontent.com/" +

        "nktkhonkaen09-bit/" +

        "STUDENT-CARD-SYSTEM/" +

        "main/assets/students/";



    const pngURL =

        githubBase +

        encodeURIComponent(
            studentId
        ) +

        ".png";



    const jpgURL =

        githubBase +

        encodeURIComponent(
            studentId
        ) +

        ".jpg";



    /*
     * ลอง PNG ก่อน
     */

    image.src =
        pngURL;



    image.onload =
        function () {

            console.log(
                "โหลดรูปสำเร็จ:",
                pngURL
            );

        };



    image.onerror =
        function () {

            console.log(
                "ไม่พบ PNG กำลังลอง JPG"
            );


            image.onerror =
                function () {

                    console.error(
                        "ไม่พบรูปนักศึกษา:",
                        studentId
                    );

                };


            image.src =
                jpgURL;

        };

}



/* =========================================================
   สร้าง QR Code
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
                    "สร้าง QR Code ไม่สำเร็จ:",
                    error
                );

            } else {

                console.log(
                    "สร้าง QR Code สำเร็จ"
                );

            }

        }

    );

}



/* =========================================================
   สร้าง Barcode
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
            "ไม่พบ JsBarcode Library"
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


        console.log(
            "สร้าง Barcode สำเร็จ:",
            studentId
        );


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
            document.createElement(
                "a"
            );


        const studentId =
            document.getElementById(
                "studentId"
            );


        let fileName =
            "student-card";


        if (
            studentId &&
            studentId.textContent.trim()
        ) {

            fileName =
                "student-card-" +

                studentId.textContent
                    .trim();

        }


        link.download =
            fileName +
            ".png";


        link.href =
            canvas.toDataURL(
                "image/png"
            );


        link.click();


    })
    .catch(function (error) {

        console.error(
            "ดาวน์โหลดบัตรไม่สำเร็จ:",
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

function showCardError(
    message
) {

    const card =
        document.getElementById(
            "studentCard"
        );


    if (!card) {

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
        "#c00000";


    error.style.padding =
        "25px";


    error.style.borderRadius =
        "12px";


    error.style.textAlign =
        "center";


    error.style.fontSize =
        "18px";


    error.style.fontWeight =
        "bold";


    error.textContent =
        message;


    card.appendChild(
        error
    );

}
