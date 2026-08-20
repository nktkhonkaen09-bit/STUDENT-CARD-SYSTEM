/* =========================================================
   STUDENT CARD SYSTEM
   ========================================================= */


/* =========================================================
   โหลดข้อมูลนักศึกษา
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadStudentCard();

    }
);



/* =========================================================
   โหลดข้อมูลจาก Session Storage
   ========================================================= */

function loadStudentCard() {

    /*
     * ระบบ Login ของเราเก็บข้อมูลนักศึกษาไว้ที่นี่
     */

    let student = null;


    try {

        const studentData =
            sessionStorage.getItem(
                "student"
            );


        if (studentData) {

            student =
                JSON.parse(studentData);

        }

    } catch (error) {

        console.error(
            "อ่านข้อมูลนักศึกษาไม่สำเร็จ",
            error
        );

    }



    /*
     * ถ้าไม่มีข้อมูลใน session
     * ลองอ่าน localStorage
     */

    if (!student) {

        try {

            const studentData =
                localStorage.getItem(
                    "student"
                );


            if (studentData) {

                student =
                    JSON.parse(studentData);

            }

        } catch (error) {

            console.error(
                "อ่าน localStorage ไม่สำเร็จ",
                error
            );

        }

    }



    /*
     * ถ้ายังไม่มีข้อมูล
     */

    if (!student) {

        console.warn(
            "ไม่พบข้อมูลนักศึกษา"
        );

        return;

    }



    /*
     * แสดงข้อมูล
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

    const fullNameTh =
        [
            student.prefix_th,
            student.firstname_th,
            student.lastname_th
        ]
        .filter(Boolean)
        .join(" ");


    setText(
        "studentName",
        fullNameTh
    );



    /*
     * ชื่อภาษาอังกฤษ
     */

    const fullNameEn =
        [
            student.firstname_en,
            student.lastname_en
        ]
        .filter(Boolean)
        .join(" ");


    setText(
        "studentNameEn",
        fullNameEn
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



    /*
     * รูปนักศึกษา
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
   ฟังก์ชันกำหนดข้อความ
   ========================================================= */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.textContent =
        value || "-";

}



/* =========================================================
   รูปนักศึกษา
   ========================================================= */

function loadStudentPhoto(student) {

    const photo =
        document.getElementById(
            "studentPhoto"
        );


    const photoBox =
        document.getElementById(
            "studentPhotoBox"
        );


    if (
        !photo ||
        !photoBox
    ) {

        return;

    }


    /*
     * ถ้า API มี photo_url
     * ให้ใช้ photo_url ก่อน
     */

    let photoUrl =
        student.photo_url || "";



    /*
     * ถ้าไม่มี photo_url
     * สร้าง URL จาก GitHub
     *
     * ตัวอย่าง:
     * TEST001
     *
     * จะหา:
     *
     * TEST001.png
     *
     * และถ้าไม่มี จะลอง JPG
     */

    if (!photoUrl) {

        const studentId =
            student.student_id;


        if (!studentId) {

            showNoPhoto();

            return;

        }


        const baseUrl =
            "https://raw.githubusercontent.com/" +
            "nktkhonkaen09-bit/" +
            "STUDENT-CARD-SYSTEM/" +
            "main/assets/students/";


        const pngUrl =
            baseUrl +
            encodeURIComponent(
                studentId
            ) +
            ".png";


        const jpgUrl =
            baseUrl +
            encodeURIComponent(
                studentId
            ) +
            ".jpg";


        /*
         * ลอง PNG ก่อน
         */

        photo.src = pngUrl;


        photo.onload =
            function () {

                photoBox.classList.remove(
                    "no-photo"
                );

            };


        photo.onerror =
            function () {

                /*
                 * ถ้า PNG ไม่มี
                 * ลอง JPG
                 */

                photo.src = jpgUrl;

            };


        /*
         * ถ้า JPG ก็ไม่มี
         */

        photo.addEventListener(
            "error",
            function () {

                showNoPhoto();

            },
            {
                once: true
            }
        );


        return;

    }



    /*
     * ใช้ photo_url จาก API
     */

    photo.src =
        photoUrl;


    photo.onload =
        function () {

            photoBox.classList.remove(
                "no-photo"
            );

        };


    photo.onerror =
        function () {

            showNoPhoto();

        };

}



/* =========================================================
   แสดงกรณีไม่มีรูป
   ========================================================= */

function showNoPhoto() {

    const photo =
        document.getElementById(
            "studentPhoto"
        );


    const photoBox =
        document.getElementById(
            "studentPhotoBox"
        );


    if (photo) {

        photo.style.display =
            "none";

    }


    if (photoBox) {

        photoBox.classList.add(
            "no-photo"
        );

    }

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


    /*
     * ตรวจสอบ Library
     */

    if (
        typeof QRCode === "undefined"
    ) {

        console.error(
            "ไม่พบ QRCode Library"
        );

        return;

    }


    /*
     * QR สีดำ พื้นขาว
     */

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
                    "สร้าง QR Code ไม่สำเร็จ",
                    error
                );

            }

        }
    );

}



/* =========================================================
   สร้าง Barcode
   CODE128
   ========================================================= */

function createBarcode(
    studentId
) {

    const barcode =
        document.getElementById(
            "studentBarcode"
        );


    const barcodeStudentId =
        document.getElementById(
            "barcodeStudentId"
        );


    if (
        !barcode ||
        !studentId
    ) {

        return;

    }


    /*
     * ตรวจสอบ JsBarcode
     */

    if (
        typeof JsBarcode === "undefined"
    ) {

        console.error(
            "ไม่พบ JsBarcode Library"
        );

        return;

    }


    /*
     * สร้าง Barcode
     */

    try {

        JsBarcode(
            barcode,
            String(studentId),
            {

                format: "CODE128",

                lineColor: "#000000",

                background: "#FFFFFF",

                width: 2,

                height: 55,

                displayValue: false,

                margin: 2

            }
        );


        /*
         * แสดงรหัสใต้ Barcode
         */

        if (
            barcodeStudentId
        ) {

            barcodeStudentId.textContent =
                studentId;

        }

    } catch (error) {

        console.error(
            "สร้าง Barcode ไม่สำเร็จ",
            error
        );

    }

}



/* =========================================================
   กลับหน้าหลัก
   ========================================================= */

function goBack() {

    /*
     * ถ้ามี dashboard.html
     */

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


    /*
     * ตรวจสอบ html2canvas
     */

    if (
        typeof html2canvas === "undefined"
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


            let fileName =
                "student-card";


            if (
                studentId &&
                studentId.textContent
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


        }
    )
    .catch(
        function (error) {

            console.error(
                "ดาวน์โหลดบัตรไม่สำเร็จ",
                error
            );


            alert(
                "ไม่สามารถดาวน์โหลดบัตรได้"
            );

        }
    );

}
