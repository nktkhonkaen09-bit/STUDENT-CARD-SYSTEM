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

        initializeAttendanceReport();

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeAttendanceReport() {

    try {

        if (
            !checkStudentSession()
        ) {

            return;

        }


        await loadStudentProfile();

        await loadAttendanceReport();

    }

    catch (error) {

        console.error(
            "ATTENDANCE REPORT INITIALIZE ERROR:",
            error
        );


        showMessage(
            error.message ||
            "ไม่สามารถโหลดรายงานผลการเข้าเรียนได้",
            "error"
        );

    }

}


/* =========================================================
   SESSION
========================================================= */

function checkStudentSession() {

    const token =
        getStudentTokenForReport();


    if (!token) {

        window.location.replace(
            "index.html"
        );

        return false;

    }


    return true;

}


function getStudentTokenForReport() {

    let token = "";


    if (
        typeof getStudentToken ===
        "function"
    ) {

        try {

            token =
                clean(
                    getStudentToken()
                );

        }

        catch (error) {

            console.warn(
                "getStudentToken WARNING:",
                error
            );

        }

    }


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
        getStudentTokenForReport();


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

        throw new Error(
            "SESSION_EXPIRED"
        );

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
   LOAD ATTENDANCE REPORT
========================================================= */

async function loadAttendanceReport() {

    const container =
        document.getElementById(
            "courseReports"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        '<div class="loading">' +
        'กำลังคำนวณผลการเข้าเรียน...' +
        '</div>';


    const token =
        getStudentTokenForReport();


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
                            "getAttendanceReport",

                        token:
                            token

                    }),

                cache:
                    "no-store"

            }
        );


    if (!response.ok) {

        throw new Error(
            "Attendance Report API HTTP " +
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

        throw new Error(
            "SESSION_EXPIRED"
        );

    }


    if (
        !result ||
        !result.success
    ) {

        throw new Error(

            result &&
            result.message

                ? result.message

                : "ไม่สามารถโหลดรายงานผลการเข้าเรียนได้"

        );

    }


    renderSummary(
        result
    );


    renderCourseReports(
        result.courses || []
    );

}


/* =========================================================
   SUMMARY
========================================================= */

function renderSummary(
    result
) {

    setText(
        "totalCourses",
        result.total_courses || 0
    );


    setText(
        "eligibleCourses",
        result.eligible_courses || 0
    );


    setText(
        "notEligibleCourses",
        result.not_eligible_courses || 0
    );

}


/* =========================================================
   COURSE REPORT
========================================================= */

function renderCourseReports(
    courses
) {

    const container =
        document.getElementById(
            "courseReports"
        );


    if (!container) {

        return;

    }


    if (!courses.length) {

        container.innerHTML =

            '<div class="empty-state">' +
            'ยังไม่มีวิชาที่ลงทะเบียน' +
            '</div>';

        return;

    }


    container.innerHTML =
        "";


    courses.forEach(
        function (course) {

            const percent =
                Number(
                    course.percentage || 0
                );


            const safePercent =
                Math.max(
                    0,
                    Math.min(
                        100,
                        percent
                    )
                );


            const passed =
                !!course.eligibleForExam;


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "course-report-item " +
                (
                    passed
                        ? "pass"
                        : "fail"
                );


            const dates =
                Array.isArray(
                    course.attendedDates
                )
                    ? course.attendedDates
                    : [];


            let datesHtml =
                "";


            if (dates.length) {

                datesHtml =

                    '<div class="attendance-dates">' +

                        '<strong>วันที่เข้าเรียน:</strong> ' +

                        escapeHtml(
                            dates.join(
                                ", "
                            )
                        ) +

                    '</div>';

            }


            item.innerHTML =

                '<div class="course-report-top">' +

                    '<div>' +

                        '<div class="course-report-code">' +

                            escapeHtml(
                                course.courseCode ||
                                "-"
                            ) +

                        '</div>' +

                        '<div class="course-report-meta">' +

                            'ผู้สอน: ' +

                            escapeHtml(
                                course.teacherCode ||
                                "-"
                            ) +

                            ' • ห้อง: ' +

                            escapeHtml(
                                course.room ||
                                "-"
                            ) +

                        '</div>' +

                    '</div>' +


                    '<div class="course-report-name">' +

                        escapeHtml(
                            course.courseName ||
                            "-"
                        ) +

                    '</div>' +


                    '<div class="course-report-percent">' +

                        '<strong>' +

                            safePercent.toFixed(
                                2
                            ) +

                            '%' +

                        '</strong>' +

                        '<span>' +
                            'ของเวลาเรียน' +
                        '</span>' +

                    '</div>' +

                '</div>' +


                '<div class="progress-track">' +

                    '<div ' +

                        'class="progress-bar" ' +

                        'style="width:' +
                        safePercent +
                        '%"' +

                    '></div>' +

                '</div>' +


                '<div class="course-report-bottom">' +

                    '<div class="attendance-count">' +

                        'เข้าเรียน ' +

                        '<strong>' +

                            Number(
                                course.attendedCount || 0
                            ) +

                        '</strong>' +

                        ' / ' +

                        Number(
                            course.totalClasses || 18
                        ) +

                        ' ครั้ง' +

                        ' • ขาด ' +

                        '<strong>' +

                            Number(
                                course.absentCount || 0
                            ) +

                        '</strong>' +

                        ' ครั้ง' +

                    '</div>' +


                    '<div class="exam-status ' +

                        (
                            passed
                                ? "pass"
                                : "fail"
                        ) +

                    '">' +

                        (
                            passed
                                ? "✅ มีสิทธิ์เข้าสอบ"
                                : "❌ ไม่มีสิทธิ์เข้าสอบ"
                        ) +

                    '</div>' +

                '</div>' +

                datesHtml;


            container.appendChild(
                item
            );

        }
    );

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

