"use strict";


/* =========================================================
   CONFIG
========================================================= */


/*
 * Google Sheet ของ Attendance
 *
 * ใช้เป็นฐานข้อมูล:
 *
 * ผู้สอน
 * รายวิชา
 * นักเรียน
 * ลงทะเบียน
 * เช็คชื่อ
 */

const ATTENDANCE_SPREADSHEET_ID =
    "1chT5T41RORP1768uDRBlrT8Axt7Z-TmzHVUtiZhmyGk";


/*
 * สำคัญ:
 *
 * ใส่ Web App URL ของ attendance-scanner ตรงนี้
 *
 * ตัวอย่าง:
 *
 * https://script.google.com/macros/s/XXXXXXXX/exec
 */

const ATTENDANCE_API_URL =
    "https://script.google.com/macros/s/AKfycbyeZp9LubywmnFuv5DEBjjZESAoz-u387cNtNe4DmnyXcRdVZ03zs_1GTri76XwZQQnkQ/exec";


/* =========================================================
   STATE
========================================================= */

let availableCourses = [];


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeRegistration();

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeRegistration() {

    if (
        !checkStudentSession()
    ) {

        return;

    }


    loadStudentSummary();


    await loadAvailableCourses();

}


/* =========================================================
   SESSION
========================================================= */

function checkStudentSession() {

    let token = "";


    /*
     * ใช้ getStudentToken()
     * ของระบบเดิม ถ้ามี
     */

    if (
        typeof getStudentToken ===
        "function"
    ) {

        token =
            getStudentToken();

    }


    /*
     * fallback
     */

    if (!token) {

        token =
            sessionStorage.getItem(
                "student_session"
            ) || "";

    }


    if (!token) {

        window.location.replace(
            "index.html"
        );

        return false;

    }


    return true;

}


/* =========================================================
   STUDENT SUMMARY
========================================================= */

function loadStudentSummary() {

    const raw =
        sessionStorage.getItem(
            "student_data"
        );


    if (!raw) {

        return;

    }


    try {

        const student =
            JSON.parse(
                raw
            );


        const fullName =
            [

                student.prefix_th || "",

                student.firstname_th || "",

                student.lastname_th || ""

            ]

                .filter(
                    function (value) {

                        return String(
                            value || ""
                        ).trim() !== "";

                    }
                )

                .join(" ")
                .trim();


        setText(
            "studentName",
            fullName || "-"
        );


        setText(
            "studentId",

            "รหัส " +
            (
                student.student_id ||
                "-"
            )

        );

    }

    catch (error) {

        console.error(
            "REGISTRATION STUDENT ERROR:",
            error
        );

    }

}


/* =========================================================
   LOAD COURSES
========================================================= */

async function loadAvailableCourses() {

    const container =
        document.getElementById(
            "courseList"
        );


    if (!container) {

        return;

    }


    /*
     * ถ้ายังไม่ได้ใส่ Web App URL
     */

    if (
        !ATTENDANCE_API_URL
    ) {

        container.innerHTML =

            '<div class="empty-state">' +

            'ยังไม่ได้ตั้งค่า Web App URL ของระบบ Attendance' +

            '<br><br>' +

            'กรุณาใส่ ATTENDANCE_API_URL ใน registration.js' +

            '</div>';

        return;

    }


    try {

        /*
         * เรียก getCourses
         *
         * ระบบ Attendance เดิมมี action นี้อยู่แล้ว
         */

        const url =
            ATTENDANCE_API_URL +
            "?action=getCourses";


        const response =
            await fetch(
                url
            );


        if (
            !response.ok
        ) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        const result =
            await response.json();


        console.log(
            "ATTENDANCE COURSES:",
            result
        );


        if (
            !result ||
            !result.success
        ) {

            throw new Error(

                result &&
                result.message

                    ? result.message

                    : "ไม่สามารถโหลดรายวิชาได้"

            );

        }


        /*
         * ระบบ Attendance V1.5.2
         * ส่ง courses เป็น:
         *
         * [
         *   {
         *     code,
         *     name,
         *     room
         *   }
         * ]
         *
         * แต่ถ้าวิชาเดียวมีหลายอาจารย์/ห้อง
         * เราจะรวมข้อมูลให้เป็นกลุ่ม
         */

        availableCourses =
            normalizeCourses(
                result.courses || []
            );


        renderCourses();


    }

    catch (error) {

        console.error(
            "LOAD ATTENDANCE COURSES ERROR:",
            error
        );


        container.innerHTML =

            '<div class="empty-state">' +

            escapeHtml(
                error.message ||
                "ไม่สามารถโหลดรายวิชาได้"
            ) +

            '</div>';

    }

}


/* =========================================================
   NORMALIZE COURSES
========================================================= */

function normalizeCourses(
    courses
) {

    const grouped = {};


    courses.forEach(
        function (course) {

            const code =
                clean(
                    course.code
                );


            const name =
                clean(
                    course.name
                );


            const room =
                clean(
                    course.room
                );


            if (
                !code ||
                !name
            ) {

                return;

            }


            if (
                !grouped[code]
            ) {

                grouped[code] = {

                    code:
                        code,

                    name:
                        name,

                    options:
                        []

                };

            }


            const exists =
                grouped[code]
                    .options
                    .some(
                        function (option) {

                            return (
                                option.room ===
                                room
                            );

                        }
                    );


            if (!exists) {

                grouped[code]
                    .options
                    .push({

                        room:
                            room

                    });

            }

        }
    );


    return Object
        .keys(
            grouped
        )
        .map(
            function (key) {

                return grouped[key];

            }
        );

}


/* =========================================================
   RENDER
========================================================= */

function renderCourses() {

    const container =
        document.getElementById(
            "courseList"
        );


    if (!container) {

        return;

    }


    if (
        !availableCourses.length
    ) {

        container.innerHTML =

            '<div class="empty-state">' +

            'ยังไม่มีรายวิชา' +

            '</div>';

        return;

    }


    container.innerHTML = "";


    availableCourses.forEach(
        function (course) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "course-item";


            let optionsHtml =
                "";


            course.options.forEach(
                function (option) {

                    optionsHtml +=

                        '<div class="course-option">' +

                            '<div class="option-teacher">' +
                                'ห้องเรียน: ' +
                                escapeHtml(
                                    option.room ||
                                    "-"
                                ) +
                            '</div>' +

                            '<div class="option-detail">' +
                                'รหัสวิชา: ' +
                                escapeHtml(
                                    course.code
                                ) +
                            '</div>' +

                        '</div>';

                }
            );


            item.innerHTML =

                '<div class="course-code">' +

                    escapeHtml(
                        course.code
                    ) +

                '</div>' +

                '<div class="course-name">' +

                    escapeHtml(
                        course.name
                    ) +

                '</div>' +

                '<div class="course-option-list">' +

                    optionsHtml +

                '</div>';


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
   CLEAN
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
            : String(value);

}


/* =========================================================
   ESCAPE HTML
========================================================= */

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
