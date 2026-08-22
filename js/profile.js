"use strict";


/* =========================================
   START
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        if (!checkSession()) {
            return;
        }

        loadStudent();

        bindPhotoUpload();

    }
);


/* =========================================
   CHECK SESSION
========================================= */

function checkSession() {

    const token =
        sessionStorage.getItem(
            CONFIG.SESSION_KEY
        );


    const student =
        sessionStorage.getItem(
            CONFIG.STUDENT_KEY
        );


    if (!token || !student) {

        window.location.href =
            "index.html";

        return false;

    }


    return true;

}


/* =========================================
   LOAD STUDENT
========================================= */

function loadStudent() {

    const raw =
        sessionStorage.getItem(
            CONFIG.STUDENT_KEY
        );


    if (!raw) {
        return;
    }


    try {

        const student =
            JSON.parse(raw);


        console.log(
            "PROFILE STUDENT:",
            student
        );


        /* =================================
           FULL THAI NAME
        ================================= */

        const fullName =

            (student.prefix_th || "") +

            (student.firstname_th || "") +

            " " +

            (student.lastname_th || "");


        /* =================================
           FULL ENGLISH NAME
        ================================= */

        const fullNameEn =

            (student.firstname_en || "") +

            " " +

            (student.lastname_en || "");


        /* =================================
           PHOTO
        ================================= */

        setProfilePhoto(
            student.photo_url
        );


        /* =================================
           TOP PROFILE
        ================================= */

        setText(
            "profileFullName",
            fullName.trim() || "-"
        );


        setText(
            "profileFullNameEn",
            fullNameEn.trim() || "-"
        );


        setText(
            "profileStudentId",
            "รหัส " +
            (student.student_id || "-")
        );


        setText(
            "profileStatus",
            student.status || "-"
        );


        /* =================================
           INFORMATION
        ================================= */

        setText(
            "studentId",
            student.student_id || "-"
        );


        setText(
            "studentName",
            fullName.trim() || "-"
        );


        setText(
            "studentNameEn",
            fullNameEn.trim() || "-"
        );


        setText(
            "studentDepartment",
            student.department || "-"
        );


        setText(
            "studentStatus",
            student.status || "-"
        );


        setText(
            "studentPhone",
            student.phone || "-"
        );


        setText(
            "issueDate",
            student.issue_date || "-"
        );


        setText(
            "expireDate",
            student.expire_date || "-"
        );


    } catch (error) {

        console.error(
            "PROFILE ERROR:",
            error
        );

    }

}


/* =========================================
   PROFILE PHOTO
========================================= */

function setProfilePhoto(
    photoUrl
) {

    const photo =
        document.getElementById(
            "profilePhoto"
        );


    if (!photo) {
        return;
    }


    let url =
        String(
            photoUrl || ""
        ).trim();


    /*
     * ถ้ายังไม่มี URL
     * ใช้ GitHub รูปเดิมเป็น fallback
     */

    if (!url) {

        const raw =
            sessionStorage.getItem(
                CONFIG.STUDENT_KEY
            );


        try {

            const student =
                JSON.parse(
                    raw || "{}"
                );


            if (student.student_id) {

                url =
                    "https://raw.githubusercontent.com/" +
                    "nktkhonkaen09-bit/" +
                    "STUDENT-CARD-SYSTEM/" +
                    "main/assets/students/" +
                    student.student_id +
                    ".png";

            }

        } catch (error) {

            console.warn(
                "PHOTO FALLBACK ERROR",
                error
            );

        }

    }


    photo.style.display =
        "";


    photo.src =
        url;


    photo.onerror =
        function () {

            this.onerror =
                null;

            this.src =
                "assets/default-student.png";

        };

}


/* =========================================
   PHOTO UPLOAD BIND
========================================= */

function bindPhotoUpload() {

    const changeButton =
        document.getElementById(
            "changePhotoBtn"
        );


    const fileInput =
        document.getElementById(
            "photoFileInput"
        );


    const cancelButton =
        document.getElementById(
            "cancelPhotoUploadBtn"
        );


    const confirmButton =
        document.getElementById(
            "confirmPhotoUploadBtn"
        );


    if (changeButton) {

        changeButton.addEventListener(
            "click",
            function () {

                if (fileInput) {

                    fileInput.click();

                }

            }
        );

    }


    if (fileInput) {

        fileInput.addEventListener(
            "change",
            handlePhotoSelected
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closePhotoPreview
        );

    }


    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            uploadSelectedPhoto
        );

    }


    const overlay =
        document.getElementById(
            "photoPreviewOverlay"
        );


    if (overlay) {

        overlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    overlay
                ) {

                    closePhotoPreview();

                }

            }
        );

    }

}


/* =========================================
   PHOTO SELECTED
========================================= */

let selectedPhotoFile = null;


async function handlePhotoSelected(
    event
) {

    const file =
        event.target.files &&
        event.target.files[0];


    if (!file) {
        return;
    }


    const allowedTypes = [

        "image/jpeg",
        "image/png",
        "image/webp"

    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        showPhotoStatus(
            "รองรับเฉพาะ JPG, PNG และ WEBP",
            "error"
        );

        resetPhotoInput();

        return;

    }


    if (
        file.size >
        4 * 1024 * 1024
    ) {

        showPhotoStatus(
            "รูปภาพต้องมีขนาดไม่เกิน 4 MB",
            "error"
        );

        resetPhotoInput();

        return;

    }


    selectedPhotoFile =
        file;


    try {

        const previewUrl =
            await createPreviewUrl(
                file
            );


        const preview =
            document.getElementById(
                "photoPreview"
            );


        if (preview) {

            preview.src =
                previewUrl;

        }


        openPhotoPreview();


        clearPhotoStatus();


    } catch (error) {

        console.error(
            "PHOTO PREVIEW ERROR",
            error
        );

        showPhotoStatus(
            "ไม่สามารถอ่านรูปภาพได้",
            "error"
        );

        resetPhotoInput();

    }

}


/* =========================================
   CREATE PREVIEW
========================================= */

function createPreviewUrl(
    file
) {

    return new Promise(
        function (resolve, reject) {

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
                file
            );

        }
    );

}


/* =========================================
   OPEN PREVIEW
========================================= */

function openPhotoPreview() {

    const overlay =
        document.getElementById(
            "photoPreviewOverlay"
        );


    if (!overlay) {
        return;
    }


    overlay.classList.add(
        "show"
    );


    overlay.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";

}


/* =========================================
   CLOSE PREVIEW
========================================= */

function closePhotoPreview() {

    const overlay =
        document.getElementById(
            "photoPreviewOverlay"
        );


    if (overlay) {

        overlay.classList.remove(
            "show"
        );


        overlay.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    document.body.style.overflow =
        "";


    selectedPhotoFile =
        null;


    resetPhotoInput();

}


/* =========================================
   UPLOAD PHOTO
========================================= */

async function uploadSelectedPhoto() {

    if (!selectedPhotoFile) {

        showPhotoStatus(
            "กรุณาเลือกรูปภาพ",
            "error"
        );

        return;

    }


    const token =
        sessionStorage.getItem(
            CONFIG.SESSION_KEY
        );


    if (!token) {

        window.location.href =
            "index.html";

        return;

    }


    const confirmButton =
        document.getElementById(
            "confirmPhotoUploadBtn"
        );


    try {

        setPhotoUploadButtonLoading(
            confirmButton,
            true
        );


        showPhotoStatus(
            "กำลังเตรียมรูปภาพ...",
            "loading"
        );


        const prepared =
            await prepareImage(
                selectedPhotoFile
            );


        showPhotoStatus(
            "กำลังอัปโหลดรูปภาพ...",
            "loading"
        );


        const result =
            await apiRequest({

                action:
                    "studentUploadPhoto",

                token:
                    token,

                mime_type:
                    prepared.mimeType,

                base64:
                    prepared.base64,

                file_name:
                    prepared.fileName

            });


        if (
            !result ||
            !result.success
        ) {

            if (
                isSessionExpired(
                    result
                )
            ) {

                alert(
                    "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่"
                );


                window.location.href =
                    "index.html";


                return;

            }


            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "อัปโหลดรูปภาพไม่สำเร็จ"
            );

        }


        /*
         * อัปเดต Session นักศึกษา
         */

        updateStudentPhotoInSession(
            result.photo_url
        );


        /*
         * แสดงรูปใหม่ทันที
         */

        setProfilePhoto(
            result.photo_url
        );


        closePhotoPreview();


        showPhotoStatus(
            "เปลี่ยนรูปโปรไฟล์สำเร็จ",
            "success"
        );


    } catch (error) {

        console.error(
            "UPLOAD PHOTO ERROR",
            error
        );


        showPhotoStatus(
            error.message ||
            "ไม่สามารถอัปโหลดรูปภาพได้",
            "error"
        );


    } finally {

        setPhotoUploadButtonLoading(
            confirmButton,
            false
        );

    }

}


/* =========================================
   PREPARE IMAGE
   ลดขนาดก่อนส่งขึ้น Apps Script
========================================= */

function prepareImage(
    file
) {

    return new Promise(
        function (resolve, reject) {

            const reader =
                new FileReader();


            reader.onload =
                function (event) {

                    const image =
                        new Image();


                    image.onload =
                        function () {

                            const maxSize =
                                1400;


                            let width =
                                image.naturalWidth;


                            let height =
                                image.naturalHeight;


                            if (
                                width >
                                height
                            ) {

                                if (
                                    width >
                                    maxSize
                                ) {

                                    height =
                                        Math.round(
                                            height *
                                            (
                                                maxSize /
                                                width
                                            )
                                        );

                                    width =
                                        maxSize;

                                }

                            } else {

                                if (
                                    height >
                                    maxSize
                                ) {

                                    width =
                                        Math.round(
                                            width *
                                            (
                                                maxSize /
                                                height
                                            )
                                        );

                                    height =
                                        maxSize;

                                }

                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;


                            canvas.height =
                                height;


                            const context =
                                canvas.getContext(
                                    "2d"
                                );


                            context.drawImage(
                                image,
                                0,
                                0,
                                width,
                                height
                            );


                            const dataUrl =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.88
                                );


                            const base64 =
                                dataUrl.split(
                                    ","
                                )[1];


                            const student =
                                getStoredStudent();


                            const studentId =
                                student &&
                                student.student_id
                                    ? student.student_id
                                    : "student-photo";


                            resolve({

                                mimeType:
                                    "image/jpeg",

                                base64:
                                    base64,

                                fileName:
                                    studentId +
                                    ".jpg"

                            });

                        };


                    image.onerror =
                        function () {

                            reject(
                                new Error(
                                    "ไม่สามารถประมวลผลรูปภาพได้"
                                )
                            );

                        };


                    image.src =
                        event.target.result;

                };


            reader.onerror =
                function () {

                    reject(
                        new Error(
                            "ไม่สามารถอ่านไฟล์รูปภาพได้"
                        )
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================
   API
========================================= */

async function apiRequest(
    data
) {

    if (
        typeof CONFIG === "undefined" ||
        !CONFIG.API_URL
    ) {

        throw new Error(
            "ไม่พบ CONFIG.API_URL"
        );

    }


    let response;


    try {

        response =
            await fetch(
                CONFIG.API_URL,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "text/plain;charset=utf-8"

                    },

                    body:
                        JSON.stringify(
                            data
                        )

                }
            );

    } catch (error) {

        throw new Error(
            "ไม่สามารถเชื่อมต่อระบบได้"
        );

    }


    if (!response.ok) {

        throw new Error(
            "HTTP " +
            response.status
        );

    }


    const text =
        await response.text();


    try {

        return JSON.parse(
            text
        );

    } catch (error) {

        console.error(
            "INVALID API RESPONSE",
            text
        );


        throw new Error(
            "ระบบส่งข้อมูลกลับมาไม่ถูกต้อง"
        );

    }

}


/* =========================================
   SESSION
========================================= */

function isSessionExpired(
    result
) {

    if (!result) {
        return false;
    }


    const code =
        String(
            result.code ||
            ""
        ).toUpperCase();


    const message =
        String(
            result.message ||
            ""
        ).toLowerCase();


    return (

        code.includes(
            "SESSION"
        ) ||

        code.includes(
            "EXPIRED"
        ) ||

        message.includes(
            "session"
        ) ||

        message.includes(
            "หมดอายุ"
        )

    );

}


/* =========================================
   UPDATE SESSION PHOTO
========================================= */

function updateStudentPhotoInSession(
    photoUrl
) {

    const keys = [

        CONFIG.STUDENT_KEY,

        "studentData",

        "student"

    ];


    keys.forEach(
        function (key) {

            if (!key) {
                return;
            }


            try {

                const raw =
                    sessionStorage.getItem(
                        key
                    );


                if (!raw) {
                    return;
                }


                const student =
                    JSON.parse(
                        raw
                    );


                student.photo_url =
                    photoUrl;


                sessionStorage.setItem(
                    key,
                    JSON.stringify(
                        student
                    )
                );


            } catch (error) {

                console.warn(
                    "UPDATE SESSION PHOTO ERROR",
                    key,
                    error
                );

            }

        }
    );

}


/* =========================================
   GET STORED STUDENT
========================================= */

function getStoredStudent() {

    try {

        const raw =
            sessionStorage.getItem(
                CONFIG.STUDENT_KEY
            );


        return raw
            ? JSON.parse(raw)
            : null;

    } catch (error) {

        return null;

    }

}


/* =========================================
   PHOTO STATUS
========================================= */

function showPhotoStatus(
    text,
    type
) {

    const element =
        document.getElementById(
            "photoUploadStatus"
        );


    if (!element) {
        return;
    }


    element.textContent =
        text || "";


    element.className =
        "photo-upload-status " +
        (
            type ||
            ""
        );

}


function clearPhotoStatus() {

    showPhotoStatus(
        "",
        ""
    );

}


/* =========================================
   BUTTON LOADING
========================================= */

function setPhotoUploadButtonLoading(
    button,
    loading
) {

    if (!button) {
        return;
    }


    if (loading) {

        button.disabled =
            true;


        button.dataset.originalText =
            button.dataset.originalText ||
            button.textContent;


        button.textContent =
            "กำลังบันทึกรูป...";


    } else {

        button.disabled =
            false;


        button.textContent =
            button.dataset.originalText ||
            "💾 บันทึกรูป";

    }

}


/* =========================================
   RESET FILE INPUT
========================================= */

function resetPhotoInput() {

    const input =
        document.getElementById(
            "photoFileInput"
        );


    if (input) {

        input.value =
            "";

    }

}


/* =========================================
   SET TEXT
========================================= */

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
        value == null
            ? ""
            : value;

}


/* =========================================
   BACK
========================================= */

function goBack() {

    window.location.href =
        "dashboard.html";

}


/* =========================================
   OPEN STUDENT CARD
========================================= */

function openStudentCard() {

    window.location.href =
        "student-card.html";

}
