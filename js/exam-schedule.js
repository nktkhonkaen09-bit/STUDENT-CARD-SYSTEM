"use strict";


/* =========================================================
   API
========================================================= */

const STUDENT_CARD_API_URL =
    (
        typeof CONFIG !== "undefined" &&
        CONFIG.API_URL
    )
        ? CONFIG.API_URL
        : "";


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

        initializeExamSchedule();

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeExamSchedule() {

    try {

        if (
            !checkStudentSession()
        ) {

            return;

        }


        await loadStudentProfile();

        await loadExamSchedule();

    }

    catch (error) {

        console.error(
            "EXAM SCHEDULE INITIALIZE ERROR:",
            error
        );


        showMessage(
            error.message ||
            "ไม่สามารถโหลดตารางสอบได้",
            "error"
        );

    }

}


/* =========================================================
   SESSION
========================================================= */

function checkStudentSession() {

    const token =
        getStudentToken();


    if (!token) {

        window.location.replace(
            "index.html"
        );

        return false;

    }


    return true;

}


function getStudentToken() {

    let token = "";


    if (!token) {

        token =
            clean(
                sessionStorage.getItem(
                    "student_session"
                )
            );

    }


    if (
        !token &&
        typeof CONFIG !== "undefined" &&
        CONFIG.SESSION_KEY
    ) {

        token =
            clean(
                sessionStorage.getItem(
                    CONFIG.SESSION_KEY
                )
            );

    }


    return token;

}


/* =========================================================
   LOAD STUDENT
========================================================= */

async function loadStudentProfile() {

    const token =
        getStudentToken();


    if (!STUDENT_CARD_API_URL) {

        throw new Error(
            "ไม่พบ API_URL ของ Student Card"
        );

    }


    const response =
        await fetch(
            STUDENT_CARD_API_URL,
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"

                },

                body:
                    JSON.stringify({

                        action:
                            "getProfile",

                        token:
                            token

                    }),

                cache:
                    "no-store"

            }
        );


    if (!response.ok) {

        throw new Error(
            "Student Card API HTTP " +
            response.status
        );

    }


    const result =
        await response.json();


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

        clearSessionAndRedirect();

        return;

    }


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


    currentStudent =
        result.student ||
        result.data ||
        null;


    if (!currentStudent) {

        throw new Error(
            "ไม่พบข้อมูลนักศึกษา"
        );

    }


    renderStudentProfile();

}


/* =========================================================
   RENDER STUDENT
========================================================= */

function renderStudentProfile() {

    if (!currentStudent) {

        return;

    }


    const fullName =
        [

            currentStudent.prefix_th || "",

            currentStudent.firstname_th || "",

            currentStudent.lastname_th || ""

        ]

            .filter(
                function (value) {

                    return clean(
                        value
                    ) !== "";

                }
            )

            .join(" ")

            .trim();


    const fullNameEn =
        [

            currentStudent.firstname_en || "",

            currentStudent.lastname_en || ""

        ]

            .filter(
                function (value) {

                    return clean(
                        value
                    ) !== "";

                }
            )

            .join(" ")

            .trim();


    setText(
        "studentFullName",
        fullName || "-"
    );


    setText(
        "studentFullNameEn",
        fullNameEn || "-"
    );


    setText(
        "studentId",
        currentStudent.student_id || "-"
    );


    setText(
        "studentDepartment",
        currentStudent.department || "-"
    );


    const photo =
        document.getElementById(
            "studentPhoto"
        );


    if (!photo) {

        return;

    }


    const photoUrl =
        clean(
            currentStudent.photo_url
        );


    if (!photoUrl) {

        photo.removeAttribute(
            "src"
        );

        return;

    }


    photo.src =
        photoUrl;


    photo.onerror =
        function () {

            this.removeAttribute(
                "src"
            );

        };

}


/* =========================================================
   LOAD EXAM SCHEDULE
========================================================= */

async function loadExamSchedule() {

    const container =
        document.getElementById(
            "examList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        '<div class="loading">' +
        'กำลังโหลดตารางสอบ...' +
        '</div>';


    const token =
        getStudentToken();


    const response =
        await fetch(
            STUDENT_CARD_API_URL,
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"

                },

                body:
                    JSON.stringify({

                        action:
                            "getExamSchedule",

                        token:
                            token,

                        semester:
                            "1",

                        academic_year:
                            "2569"

                    }),

                cache:
                    "no-store"

            }
        );


    if (!response.ok) {

        throw new Error(
            "Exam Schedule API HTTP " +
            response.status
        );

    }


    const result =
        await response.json();


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

        clearSessionAndRedirect();

        return;

    }


    if (
        !result ||
        !result.success
    ) {

        throw new Error(

            result &&
            result.message

                ? result.message

                : "ไม่สามารถโหลดตารางสอบได้"

        );

    }


    setText(
        "examCount",
        result.exam_count || 0
    );


    setText(
        "examSemester",
        result.semester || "-"
    );


    setText(
        "examAcademicYear",
        result.academic_year || "-"
    );


    renderNextExam(
        result.next_exam
    );


    renderExamList(
        result.exams || []
    );

}


/* =========================================================
   NEXT EXAM
========================================================= */

function renderNextExam(
    exam
) {

    if (!exam) {

        setText(
            "nextExamDate",
            "-"
        );


        setText(
            "nextExamTime",
            "-"
        );


        setText(
            "nextExamName",
            "ยังไม่มีตารางสอบ"
        );


        setText(
            "nextExamDetail",
            "-"
        );


        return;

    }


    const countdown =
        getExamCountdown(
            exam.examDate
        );


    setText(
        "nextExamDate",
        exam.examDate || "-"
    );


    setText(
        "nextExamTime",

        (
            exam.startTime ||
            "-"
        )

        +

        (

            exam.endTime
                ? " - " + exam.endTime
                : ""

        )

    );


    setText(
        "nextExamName",

        (
            exam.courseCode ||
            ""
        )

        +

        " - "

        +

        (
            exam.courseName ||
            "-"
        )

    );


    setText(
        "nextExamDetail",

        "📅 " +
        (
            exam.examDate ||
            "-"
        )

        +

        "  ⏰ "

        +

        (
            exam.startTime ||
            "-"
        )

        +

        (

            exam.endTime
                ? " - " + exam.endTime
                : ""

        )

        +

        "  🏫 ห้อง " +

        (
            exam.examRoom ||
            "-"
        )

        +

        "  •  " +

        countdown.label

    );

}


/* =========================================================
   EXAM LIST
========================================================= */

function renderExamList(
    exams
) {

    const container =
        document.getElementById(
            "examList"
        );


    if (!container) {

        return;

    }


    if (!exams.length) {

        container.innerHTML =

            '<div class="empty-state">' +

            'ยังไม่มีข้อมูลตารางสอบของคุณ' +

            '</div>';

        return;

    }


    container.innerHTML =
        "";


    exams.forEach(
        function (exam) {

            const countdown =
                getExamCountdown(
                    exam.examDate
                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "exam-item";


            item.innerHTML =

                '<div class="exam-item-date">' +

                    '<strong>' +

                        escapeHtml(
                            exam.examDate ||
                            "-"
                        ) +

                    '</strong>' +

                    '<span>' +

                        escapeHtml(
                            exam.examType ||
                            "-"
                        ) +

                    '</span>' +

                '</div>' +


                '<div class="exam-item-course">' +

                    '<div class="exam-course-code">' +

                        escapeHtml(
                            exam.courseCode ||
                            "-"
                        ) +

                    '</div>' +

                    '<div class="exam-course-name">' +

                        escapeHtml(
                            exam.courseName ||
                            "-"
                        ) +

                    '</div>' +

                    '<div class="exam-course-teacher">' +

                        'ผู้สอน ' +

                        escapeHtml(
                            exam.teacherCode ||
                            "-"
                        ) +

                    '</div>' +

                    '<span class="exam-type">' +

                        escapeHtml(
                            exam.examType ||
                            "-"
                        ) +

                    '</span>' +

                '</div>' +


                '<div class="exam-item-time">' +

                    escapeHtml(
                        exam.startTime ||
                        "-"
                    ) +

                    ' - ' +

                    escapeHtml(
                        exam.endTime ||
                        "-"
                    ) +

                '</div>' +


                '<div class="exam-item-room">' +

                    '<div class="exam-room-label">' +
                        'ห้องสอบ' +
                    '</div>' +

                    '<div class="exam-room-value">' +

                        escapeHtml(
                            exam.examRoom ||
                            "-"
                        ) +

                    '</div>' +

                    '<div class="exam-countdown">' +

                        escapeHtml(
                            countdown.label
                        ) +

                    '</div>' +

                '</div>';


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   COUNTDOWN
========================================================= */

function getExamCountdown(
    dateText
) {

    const examDate =
        parseThaiExamDate(
            dateText
        );


    if (!examDate) {

        return {

            status:
                "unknown",

            label:
                ""

        };

    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    examDate.setHours(
        0,
        0,
        0,
        0
    );


    const diff =
        examDate.getTime() -
        today.getTime();


    const oneDay =
        24 *
        60 *
        60 *
        1000;


    const days =
        Math.round(
            diff /
            oneDay
        );


    if (days < 0) {

        return {

            status:
                "past",

            label:
                "สอบเสร็จแล้ว"

        };

    }


    if (days === 0) {

        return {

            status:
                "today",

            label:
                "สอบวันนี้"

        };

    }


    if (days === 1) {

        return {

            status:
                "tomorrow",

            label:
                "สอบพรุ่งนี้"

        };

    }


    return {

        status:
            "upcoming",

        label:
            "เหลือ " +
            days +
            " วัน"

    };

}


/* =========================================================
   PARSE THAI DATE
========================================================= */

function parseThaiExamDate(
    value
) {

    const text =
        clean(value);


    const match =
        text.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
        );


    if (!match) {

        return null;

    }


    let year =
        Number(
            match[3]
        );


    if (
        year > 2400
    ) {

        year -= 543;

    }


    const month =
        Number(
            match[2]
        ) - 1;


    const day =
        Number(
            match[1]
        );


    const result =
        new Date(
            year,
            month,
            day
        );


    if (
        isNaN(
            result.getTime()
        )
    ) {

        return null;

    }


    return result;

}


/* =========================================================
   BACK
========================================================= */

function goBack() {

    window.location.href =
        "dashboard.html";

}


/* =========================================================
   SESSION CLEAR
========================================================= */

function clearSessionAndRedirect() {

    sessionStorage.removeItem(
        "student_session"
    );


    sessionStorage.removeItem(
        "student_data"
    );


    if (
        typeof CONFIG !== "undefined" &&
        CONFIG.SESSION_KEY
    ) {

        sessionStorage.removeItem(
            CONFIG.SESSION_KEY
        );

    }


    if (
        typeof CONFIG !== "undefined" &&
        CONFIG.STUDENT_KEY
    ) {

        sessionStorage.removeItem(
            CONFIG.STUDENT_KEY
        );

    }


    window.location.replace(
        "index.html"
    );

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message,
    type
) {

    const box =
        document.getElementById(
            "message"
        );


    if (!box) {

        return;

    }


    box.textContent =
        message;


    box.className =
        "message show " +
        (
            type === "error"
                ? "error"
                : ""
        );

}


/* =========================================================
   HELPERS
========================================================= */

function clean(
    value
) {

    return String(
        value == null
            ? ""
            : value
    ).trim();

}


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


function escapeHtml(
    value
) {

    return String(
        value == null
            ? ""
            : value
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}
