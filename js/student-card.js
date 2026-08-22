```javascript
/* =========================================================
   STUDENT CARD SYSTEM
   js/student-card.js
   ========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const STUDENT_CARD_CONFIG = {

    API_URL:
        typeof CONFIG !== "undefined" && CONFIG.API_URL
            ? CONFIG.API_URL
            : "",

    STUDENT_SESSION_KEY:
        "student_session",

    STUDENT_DATA_KEY:
        "student_data"

};


/* =========================================================
   STATE
========================================================= */

let currentStudent = null;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeStudentCard();

        initializeQR();

    }
);


/* =========================================================
   INITIALIZE STUDENT CARD
========================================================= */

async function initializeStudentCard() {

    try {

        const studentData =
            sessionStorage.getItem(
                STUDENT_CARD_CONFIG.STUDENT_DATA_KEY
            );


        /*
         * ถ้ามีข้อมูลนักศึกษาใน sessionStorage
         * ให้ใช้ข้อมูลนั้นก่อน
         */

        if (studentData) {

            try {

                currentStudent =
                    JSON.parse(
                        studentData
                    );


                if (currentStudent) {

                    renderStudentCard(
                        currentStudent
                    );

                    return;

                }

            }
            catch (error) {

                console.warn(
                    "ไม่สามารถอ่าน student_data:",
                    error
                );

            }

        }


        /*
         * ถ้าไม่มีข้อมูลใน sessionStorage
         * ให้โหลดจาก API
         */

        await loadStudentFromAPI();

    }

    catch (error) {

        console.error(
            "INITIALIZE STUDENT CARD ERROR:",
            error
        );


        showCardError(
            "ไม่สามารถโหลดข้อมูลนักศึกษาได้"
        );

    }

}


/* =========================================================
   LOAD STUDENT FROM API
========================================================= */

async function loadStudentFromAPI() {

    /*
     * ใช้ getStudentToken()
     * จาก config.js
     *
     * ถ้าไม่พบ ให้ใช้ sessionStorage โดยตรงเป็น fallback
     */

    const token =
        typeof getStudentToken === "function"
            ? getStudentToken()
            : (
                sessionStorage.getItem(
                    STUDENT_CARD_CONFIG.STUDENT_SESSION_KEY
                ) || ""
            );


    if (!token) {

        window.location.replace(
            "index.html"
        );

        return;

    }


    const result =
        await studentApiRequest({

            action:
                "getStudentProfile",

            token:
                token

        });


    if (
        !result ||
        !result.success
    ) {

        throw new Error(

            result &&
            result.message

                ? result.message

                : "ไม่สามารถโหลดข้อมูลนักศึกษาได้"

        );

    }


    /*
     * รองรับทั้ง result.student
     * และ result.data
     */

    currentStudent =
        result.student ||
        result.data ||
        result;


    /*
     * เก็บข้อมูลไว้ใน session
     */

    try {

        sessionStorage.setItem(
            STUDENT_CARD_CONFIG.STUDENT_DATA_KEY,
            JSON.stringify(
                currentStudent
            )
        );

    }
    catch (error) {

        console.warn(
            "ไม่สามารถบันทึก student_data:",
            error
        );

    }


    /*
     * แสดงข้อมูล
     */

    renderStudentCard(
        currentStudent
    );

}


/* =========================================================
   API REQUEST
========================================================= */

async function studentApiRequest(
    payload
) {

    if (
        !STUDENT_CARD_CONFIG.API_URL
    ) {

        throw new Error(
            "ไม่พบ API_URL ใน config.js"
        );

    }


    const response =
        await fetch(

            STUDENT_CARD_CONFIG.API_URL,

            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"

                },

                body:
                    JSON.stringify(
                        payload
                    )

            }

        );


    if (!response.ok) {

        throw new Error(
            "HTTP " +
            response.status
        );

    }


    const result =
        await response.json();


    console.log(
        "STUDENT CARD API RESULT:",
        result
    );


    /*
     * Session หมดอายุ
     */

    if (

        result &&

        (

            result.code ===
            "STUDENT_SESSION_EXPIRED"

            ||

            result.code ===
            "SESSION_EXPIRED"

        )

    ) {

        sessionStorage.removeItem(
            STUDENT_CARD_CONFIG.STUDENT_SESSION_KEY
        );


        sessionStorage.removeItem(
            STUDENT_CARD_CONFIG.STUDENT_DATA_KEY
        );


        /*
         * ลบ session key ของ config.js ด้วย
         */

        if (

            typeof CONFIG !== "undefined" &&

            CONFIG.SESSION_KEY

        ) {

            sessionStorage.removeItem(
                CONFIG.SESSION_KEY
            );

        }


        window.location.replace(
            "index.html"
        );


        throw new Error(
            "STUDENT_SESSION_EXPIRED"
        );

    }


    return result;

}


/* =========================================================
   RENDER STUDENT CARD
========================================================= */

function renderStudentCard(
    student
) {

    if (!student) {

        showCardError(
            "ไม่พบข้อมูลนักศึกษา"
        );

        return;

    }


    console.log(
        "STUDENT DATA:",
        student
    );


    /*
     * รหัสนักศึกษา
     */

    setText(
        "studentId",
        getStudentId(
            student
        )
    );


    /*
     * ชื่อ-สกุล
     */

    setText(
        "studentName",
        getStudentFullName(
            student
        )
    );


    /*
     * สาขาวิชา
     */

    setText(
        "studentDepartment",
        getStudentDepartment(
            student
        )
    );


    /*
     * สถานะ
     */

    setText(
        "studentStatus",
        getStudentStatus(
            student
        )
    );


    /*
     * วันออกบัตร
     */

    setText(
        "issueDate",
        formatDateOnly(
            student.issue_date
        )
    );


    /*
     * วันหมดอายุ
     */

    setText(
        "expireDate",
        formatDateOnly(
            student.expire_date
        )
    );


    /*
     * รูปนักศึกษา
     */

    setStudentPhoto(
        student
    );


    /*
     * Barcode
     */

    generateBarcode(
        getStudentId(
            student
        )
    );


    /*
     * QR Code
     */

    generateQRCode(
        getStudentId(
            student
        )
    );

}


/* =========================================================
   GET STUDENT ID
========================================================= */

function getStudentId(
    student
) {

    return (

        student.student_id ||

        student.studentId ||

        student.id ||

        ""

    );

}


/* =========================================================
   GET FULL NAME
========================================================= */

function getStudentFullName(
    student
) {

    const prefix =
        student.prefix_th ||
        student.prefix ||
        "";


    const firstname =
        student.firstname_th ||
        student.firstname ||
        student.first_name ||
        "";


    const lastname =
        student.lastname_th ||
        student.lastname ||
        student.last_name ||
        "";


    return [

        prefix,

        firstname,

        lastname

    ]

        .filter(
            function (value) {

                return String(
                    value || ""
                )
                .trim() !== "";

            }
        )

        .join(" ")

        .trim() || "-";

}


/* =========================================================
   GET DEPARTMENT
========================================================= */

function getStudentDepartment(
    student
) {

    return (

        student.department ||

        student.department_name ||

        student.major ||

        student.program ||

        "-"

    );

}


/* =========================================================
   GET STATUS
========================================================= */

function getStudentStatus(
    student
) {

    return (

        student.status ||

        student.student_status ||

        "-"

    );

}


/* =========================================================
   STUDENT PHOTO
========================================================= */

function setStudentPhoto(
    student
) {

    const photo =
        document.getElementById(
            "studentPhoto"
        );


    if (!photo) {

        return;

    }


    const photoUrl =

        student.photo_url ||

        student.photoUrl ||

        student.image_url ||

        student.image ||

        "";


    if (!photoUrl) {

        photo.removeAttribute(
            "src"
        );


        photo.style.backgroundColor =
            "#ffffff";


        return;

    }


    photo.src =
        photoUrl;


    photo.onerror =
        function () {

            console.warn(
                "ไม่สามารถโหลดรูปนักศึกษา:",
                photoUrl
            );


            photo.removeAttribute(
                "src"
            );

        };

}


/* =========================================================
   FORMAT DATE ONLY
========================================================= */

function formatDateOnly(
    value
) {

    if (

        value === null ||

        value === undefined ||

        value === ""

    ) {

        return "-";

    }


    /*
     * Date object
     */

    if (
        value instanceof Date
    ) {

        if (
            isNaN(
                value.getTime()
            )
        ) {

            return "-";

        }


        return formatDateParts(

            value.getDate(),

            value.getMonth() + 1,

            value.getFullYear()

        );

    }


    let text =
        String(
            value
        )
        .trim();


    if (!text) {

        return "-";

    }


    /*
     * ตัดเวลาออก
     */

    text =
        text
            .split("T")[0]
            .split(" ")[0]
            .trim();


    /*
     * dd/MM/yyyy
     */

    const slashMatch =
        text.match(

            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

        );


    if (slashMatch) {

        return formatDateParts(

            Number(
                slashMatch[1]
            ),

            Number(
                slashMatch[2]
            ),

            Number(
                slashMatch[3]
            )

        );

    }


    /*
     * yyyy-MM-dd
     */

    const isoMatch =
        text.match(

            /^(\d{4})-(\d{1,2})-(\d{1,2})$/

        );


    if (isoMatch) {

        return formatDateParts(

            Number(
                isoMatch[3]
            ),

            Number(
                isoMatch[2]
            ),

            Number(
                isoMatch[1]
            )

        );

    }


    /*
     * พยายามอ่านเป็น Date
     */

    const parsedDate =
        new Date(
            text
        );


    if (
        !isNaN(
            parsedDate.getTime()
        )
    ) {

        return formatDateParts(

            parsedDate.getDate(),

            parsedDate.getMonth() + 1,

            parsedDate.getFullYear()

        );

    }


    return text;

}


/* =========================================================
   FORMAT DATE PARTS
========================================================= */

function formatDateParts(
    day,
    month,
    year
) {

    return (

        String(
            day
        )
        .padStart(
            2,
            "0"
        )

        +

        "/"

        +

        String(
            month
        )
        .padStart(
            2,
            "0"
        )

        +

        "/"

        +

        String(
            year
        )

    );

}


/* =========================================================
   BARCODE
========================================================= */

function generateBarcode(
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

        return;

    }


    if (!studentId) {

        barcode.innerHTML =
            "";


        if (barcodeText) {

            barcodeText.textContent =
                "";

        }


        return;

    }


    if (
        typeof JsBarcode !==
        "function"
    ) {

        console.warn(
            "ไม่พบ JsBarcode"
        );


        return;

    }


    try {

        JsBarcode(

            barcode,

            String(
                studentId
            ),

            {

                format:
                    "CODE128",

                displayValue:
                    false,

                lineColor:
                    "#000000",

                background:
                    "#ffffff",

                width:
                    2,

                height:
                    70,

                margin:
                    0

            }

        );


        if (barcodeText) {

            barcodeText.textContent =
                studentId;

        }

    }

    catch (error) {

        console.error(
            "BARCODE ERROR:",
            error
        );

    }

}


/* =========================================================
   QR CODE
========================================================= */

function generateQRCode(
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

        return;

    }


    if (!studentId) {

        qr.removeAttribute(
            "src"
        );


        if (qrFull) {

            qrFull.removeAttribute(
                "src"
            );

        }


        return;

    }


    const qrUrl =

        "https://api.qrserver.com/v1/create-qr-code/" +

        "?size=500x500" +

        "&data=" +

        encodeURIComponent(
            String(
                studentId
            )
        );


    qr.src =
        qrUrl;


    if (qrFull) {

        qrFull.src =
            qrUrl;

    }

}


/* =========================================================
   INITIALIZE QR CLICK
========================================================= */

function initializeQR() {

    const qr =
        document.getElementById(
            "studentQR"
        );


    if (!qr) {

        return;

    }


    qr.addEventListener(
        "click",
        function () {

            openQR();

        }
    );

}


/* =========================================================
   OPEN QR FULL SCREEN
========================================================= */

function openQR() {

    const overlay =
        document.getElementById(
            "qrOverlay"
        );


    const qr =
        document.getElementById(
            "studentQR"
        );


    const qrFull =
        document.getElementById(
            "qrFull"
        );


    if (
        !overlay ||
        !qrFull
    ) {

        return;

    }


    if (
        qr &&
        qr.src
    ) {

        qrFull.src =
            qr.src;

    }


    overlay.classList.add(
        "show"
    );


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE QR
========================================================= */

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


/* =========================================================
   ESC KEY CLOSE QR
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeQR();

        }

    }
);


/* =========================================================
   GO BACK
========================================================= */

function goBack() {

    /*
     * ใช้ history ถ้ามี
     */

    if (
        window.history.length >
        1
    ) {

        window.history.back();

        return;

    }


    /*
     * ถ้าไม่มี history
     * กลับ Dashboard
     */

    window.location.replace(
        "dashboard.html"
    );

}


/* =========================================================
   DOWNLOAD STUDENT CARD
   รูปนักศึกษา + พื้นหลังบัตร
   จะถูกแปลงเป็น Data URL ก่อนสร้าง PNG
========================================================= */

async function downloadCard() {

    const card =
        document.getElementById(
            "studentCard"
        );


    const photo =
        document.getElementById(
            "studentPhoto"
        );


    if (!card) {

        alert(
            "ไม่พบข้อมูลบัตรนักศึกษา"
        );

        return;

    }


    if (
        typeof html2canvas !==
        "function"
    ) {

        alert(
            "ระบบดาวน์โหลดบัตรยังไม่พร้อมใช้งาน"
        );

        return;

    }


    const studentId =
        getStudentId(
            currentStudent || {}
        );


    if (!studentId) {

        alert(
            "ไม่พบรหัสนักศึกษา"
        );

        return;

    }


    /*
     * เก็บค่าเดิม
     */

    const originalPhotoSrc =
        photo
            ? photo.getAttribute(
                "src"
            )
            : null;


    const originalBackground =
        card.style.backgroundImage;


    let photoChanged =
        false;


    let backgroundChanged =
        false;


    try {

        /* =================================================
           STEP 1
           ขอรูปนักศึกษาจาก Backend
        ================================================= */

        if (photo) {

            try {

                const token =

                    typeof getStudentToken ===
                    "function"

                        ? getStudentToken()

                        : (

                            sessionStorage.getItem(
                                STUDENT_CARD_CONFIG.STUDENT_SESSION_KEY
                            ) || ""

                        );


                const result =
                    await studentApiRequest({

                        action:
                            "getStudentPhotoData",

                        token:
                            token

                    });


                if (

                    result &&

                    result.success &&

                    result.data_url

                ) {

                    await setImageSourceAndWait(

                        photo,

                        result.data_url

                    );


                    photoChanged =
                        true;

                }

                else {

                    console.warn(
                        "ไม่สามารถดึงรูปสำหรับดาวน์โหลด:",
                        result
                    );

                }

            }

            catch (error) {

                console.warn(
                    "PHOTO BASE64 ERROR:",
                    error
                );

            }

        }


        /* =================================================
           STEP 2
           แปลงพื้นหลังบัตรเป็น Data URL
        ================================================= */

        try {

            const backgroundUrl =

                "https://raw.githubusercontent.com/" +

                "nktkhonkaen09-bit/" +

                "STUDENT-CARD-SYSTEM/" +

                "main/assets/students/STD-BG.png";


            const backgroundDataUrl =

                await fetchImageAsDataUrl(
                    backgroundUrl
                );


            if (
                backgroundDataUrl
            ) {

                card.style.backgroundImage =

                    "url('" +
                    backgroundDataUrl +
                    "')";


                backgroundChanged =
                    true;

            }

        }

        catch (error) {

            console.warn(
                "BACKGROUND BASE64 ERROR:",
                error
            );

        }


        /* =================================================
           STEP 3
           รอรูปทั้งหมด
        ================================================= */

        await waitForImages(
            card
        );


        /* =================================================
           STEP 4
           รอให้ Browser ทำ DOM update
        ================================================= */

        await nextFrame();


        /* =================================================
           STEP 5
           สร้าง Canvas
        ================================================= */

        const canvas =
            await html2canvas(

                card,

                {

                    scale:
                        2,

                    useCORS:
                        false,

                    allowTaint:
                        false,

                    backgroundColor:
                        null,

                    imageTimeout:
                        15000,

                    logging:
                        false

                }

            );


        /* =================================================
           STEP 6
           ดาวน์โหลด PNG
        ================================================= */

        const link =
            document.createElement(
                "a"
            );


        link.download =

            "student-card-" +

            (

                studentId ||

                "card"

            ) +

            ".png";


        link.href =
            canvas.toDataURL(
                "image/png"
            );


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();

    }

    catch (error) {

        console.error(
            "DOWNLOAD CARD ERROR:",
            error
        );


        alert(
            "ไม่สามารถดาวน์โหลดบัตรได้"
        );

    }

    finally {

        /* =================================================
           คืนรูปนักศึกษาเดิม
        ================================================= */

        if (
            photo &&
            photoChanged
        ) {

            if (
                originalPhotoSrc
            ) {

                photo.src =
                    originalPhotoSrc;

            }

            else {

                photo.removeAttribute(
                    "src"
                );

            }

        }


        /* =================================================
           คืนพื้นหลังเดิม
        ================================================= */

        if (
            backgroundChanged
        ) {

            card.style.backgroundImage =
                originalBackground;

        }

    }

}


/* =========================================================
   FETCH IMAGE AS DATA URL
   ใช้กับพื้นหลังบัตรจาก GitHub
========================================================= */

async function fetchImageAsDataUrl(
    url
) {

    const response =
        await fetch(

            url,

            {

                mode:
                    "cors",

                cache:
                    "no-store"

            }

        );


    if (!response.ok) {

        throw new Error(

            "ไม่สามารถโหลดรูปได้ HTTP " +
            response.status

        );

    }


    const blob =
        await response.blob();


    return blobToDataUrl(
        blob
    );

}


/* =========================================================
   BLOB TO DATA URL
========================================================= */

function blobToDataUrl(
    blob
) {

    return new Promise(

        function (
            resolve,
            reject
        ) {

            const reader =
                new FileReader();


            reader.onload =
                function () {

                    resolve(
                        reader.result
                    );

                };


            reader.onerror =
                reject;


            reader.readAsDataURL(
                blob
            );

        }

    );

}


/* =========================================================
   SET IMAGE SOURCE + WAIT
========================================================= */

function setImageSourceAndWait(
    image,
    src
) {

    return new Promise(

        function (resolve) {

            let completed =
                false;


            function finish() {

                if (
                    completed
                ) {

                    return;

                }


                completed =
                    true;


                resolve();

            }


            image.onload =
                finish;


            image.onerror =
                finish;


            image.src =
                src;


            if (
                image.complete
            ) {

                finish();

            }

        }

    );

}


/* =========================================================
   WAIT FOR IMAGES
========================================================= */

function waitForImages(
    container
) {

    const images =
        Array.from(

            container.querySelectorAll(
                "img"
            )

        );


    if (!images.length) {

        return Promise.resolve();

    }


    return Promise.all(

        images.map(

            function (image) {

                if (
                    image.complete
                ) {

                    return Promise.resolve();

                }


                return new Promise(

                    function (resolve) {

                        image.onload =
                            resolve;

                        image.onerror =
                            resolve;

                    }

                );

            }

        )

    );

}


/* =========================================================
   NEXT FRAME
   ช่วยให้ Browser วาด Data URL
   ก่อนส่งเข้า html2canvas
========================================================= */

function nextFrame() {

    return new Promise(

        function (resolve) {

            requestAnimationFrame(

                function () {

                    requestAnimationFrame(
                        resolve
                    );

                }

            );

        }

    );

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.textContent =

        value == null ||
        value === ""

            ? "-"

            : String(
                value
            );

}


/* =========================================================
   SHOW ERROR
========================================================= */

function showCardError(
    message
) {

    console.error(
        message
    );


    setText(
        "studentId",
        "-"
    );


    setText(
        "studentName",
        "-"
    );


    setText(
        "studentDepartment",
        "-"
    );


    setText(
        "studentStatus",
        "-"
    );


    setText(
        "issueDate",
        "-"
    );


    setText(
        "expireDate",
        "-"
    );

}
```
