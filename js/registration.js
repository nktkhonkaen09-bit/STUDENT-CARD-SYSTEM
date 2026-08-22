"use strict";


/* =========================================================
   ATTENDANCE API
========================================================= */

const ATTENDANCE_API_URL =
    "https://script.google.com/macros/s/AKfycbyeZp9LubywmnFuv5DEBjjZESAoz-u387cNtNe4DmnyXcRdVZ03zs_1GTri76XwZQQnkQ/exec";


/* =========================================================
   STATE
========================================================= */

let availableCourses = [];

let selectedRegistrations = [];


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

    renderSelectedList();

    await loadAvailableCourses();

}


/* =========================================================
   SESSION
========================================================= */

function checkStudentSession() {

    let token = "";


    if (
        typeof getStudentToken ===
        "function"
    ) {

        token =
            getStudentToken();

    }


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
            "STUDENT DATA ERROR:",
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


    try {

        const url =
            ATTENDANCE_API_URL +
            "?action=getAllRegistrationCourses";


        const response =
            await fetch(
                url,
                {
                    method:
                        "GET",

                    cache:
                        "no-store"
                }
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
            "ATTENDANCE REGISTRATION COURSES:",
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


        availableCourses =
            normalizeCourses(
                result.courses || []
            );


        renderCourseList();


    }

    catch (error) {

        console.error(
            "LOAD COURSES ERROR:",
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


            const options =
                Array.isArray(
                    course.options
                )
                    ? course.options
                    : [];


            options.forEach(
                function (option) {

                    const teacherCode =
                        clean(
                            option.teacherCode
                        );


                    const teacherName =
                        clean(
                            option.teacherName
                        );


                    const room =
                        clean(
                            option.room
                        );


                    if (
                        !teacherCode ||
                        !room
                    ) {

                        return;

                    }


                    const exists =
                        grouped[code]
                            .options
                            .some(
                                function (item) {

                                    return (

                                        item.teacherCode ===
                                        teacherCode

                                        &&

                                        item.room ===
                                        room

                                    );

                                }
                            );


                    if (
                        exists
                    ) {

                        return;

                    }


                    grouped[code]
                        .options
                        .push({

                            teacherCode:
                                teacherCode,

                            teacherName:
                                teacherName ||
                                teacherCode,

                            room:
                                room

                        });

                }
            );

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
   RENDER COURSE LIST
========================================================= */

function renderCourseList() {

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

            'ยังไม่มีรายวิชาที่เปิดให้ลงทะเบียน' +

            '</div>';

        return;

    }


    container.innerHTML =
        "";


    availableCourses.forEach(
        function (
            course,
            courseIndex
        ) {

            const selected =
                findSelectedCourse(
                    course.code
                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "course-item";


            let optionsHtml =
                "";


            course.options.forEach(
                function (
                    option,
                    optionIndex
                ) {

                    const checked =
                        selected &&

                        selected.teacherCode ===
                            option.teacherCode &&

                        selected.room ===
                            option.room;


                    optionsHtml +=

                        '<label class="course-option">' +

                            '<input ' +

                                'type="radio" ' +

                                'name="course-' +
                                escapeHtml(
                                    course.code
                                ) +
                                '" ' +

                                'value="' +
                                optionIndex +
                                '" ' +

                                (
                                    checked
                                        ? "checked"
                                        : ""
                                ) +

                                ' onchange="selectCourseOption(' +
                                    courseIndex +
                                    ',' +
                                    optionIndex +
                                ')"' +

                            '>' +

                            '<span class="option-main">' +

                                '<span class="option-teacher">' +

                                    escapeHtml(
                                        option.teacherName
                                    ) +

                                '</span>' +

                                '<span class="option-detail">' +

                                    'รหัสผู้สอน: ' +

                                    escapeHtml(
                                        option.teacherCode
                                    ) +

                                    ' • ห้อง: ' +

                                    escapeHtml(
                                        option.room
                                    ) +

                                '</span>' +

                            '</span>' +

                        '</label>';

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
   SELECT COURSE OPTION
========================================================= */

function selectCourseOption(
    courseIndex,
    optionIndex
) {

    const course =
        availableCourses[
            courseIndex
        ];


    if (!course) {

        return;

    }


    const option =
        course.options[
            optionIndex
        ];


    if (!option) {

        return;

    }


    const selected = {

        courseCode:
            course.code,

        courseName:
            course.name,

        teacherCode:
            option.teacherCode,

        teacherName:
            option.teacherName,

        room:
            option.room

    };


    const existingIndex =
        selectedRegistrations.findIndex(
            function (item) {

                return (
                    item.courseCode ===
                    course.code
                );

            }
        );


    if (
        existingIndex >= 0
    ) {

        selectedRegistrations[
            existingIndex
        ] =
            selected;

    }

    else {

        selectedRegistrations.push(
            selected
        );

    }


    renderCourseList();

    renderSelectedList();

}


/* =========================================================
   FIND SELECTED
========================================================= */

function findSelectedCourse(
    courseCode
) {

    return (
        selectedRegistrations.find(
            function (item) {

                return (
                    item.courseCode ===
                    courseCode
                );

            }
        ) || null
    );

}


/* =========================================================
   REMOVE SELECTED
========================================================= */

function removeSelectedCourse(
    courseCode
) {

    selectedRegistrations =
        selectedRegistrations.filter(
            function (item) {

                return (
                    item.courseCode !==
                    courseCode
                );

            }
        );


    renderCourseList();

    renderSelectedList();

}


/* =========================================================
   RENDER SELECTED
========================================================= */

function renderSelectedList() {

    const container =
        document.getElementById(
            "selectedList"
        );


    const count =
        document.getElementById(
            "selectedCount"
        );


    if (!container) {

        return;

    }


    if (
        !selectedRegistrations.length
    ) {

        container.innerHTML =

            '<div class="empty-state">' +

            'ยังไม่ได้เลือกรายวิชา' +

            '</div>';

    }

    else {

        container.innerHTML =
            "";


        selectedRegistrations.forEach(
            function (item) {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "selected-item";


                div.innerHTML =

                    '<div class="selected-info">' +

                        '<div class="selected-course">' +

                            escapeHtml(
                                item.courseCode
                            ) +

                            ' • ' +

                            escapeHtml(
                                item.courseName
                            ) +

                        '</div>' +

                        '<div class="selected-detail">' +

                            'อาจารย์: ' +

                            escapeHtml(
                                item.teacherName
                            ) +

                            ' • ห้อง: ' +

                            escapeHtml(
                                item.room
                            ) +

                        '</div>' +

                    '</div>' +

                    '<button ' +

                        'type="button" ' +

                        'class="remove-selected" ' +

                        'onclick="removeSelectedCourse(\'' +

                            escapeJavaScript(
                                item.courseCode
                            ) +

                        '\')" ' +

                    '>' +

                        '×' +

                    '</button>';


                container.appendChild(
                    div
                );

            }
        );

    }


    if (count) {

        count.textContent =
            String(
                selectedRegistrations.length
            );

    }

}


/* =========================================================
   PREVIEW
========================================================= */

function previewRegistration() {

    const box =
        document.getElementById(
            "message"
        );


    if (
        !selectedRegistrations.length
    ) {

        showMessage(
            "กรุณาเลือกรายวิชาอย่างน้อย 1 วิชา",
            "error"
        );

        return;

    }


    const lines = [

        "รายการลงทะเบียนที่เลือก:",

        ""

    ];


    selectedRegistrations.forEach(
        function (item, index) {

            lines.push(

                (
                    index + 1
                ) +

                ". " +

                item.courseCode +

                " - " +

                item.courseName

            );


            lines.push(

                "   " +

                item.teacherName +

                " | ห้อง " +

                item.room

            );

        }
    );


    showMessage(
        lines.join("\n"),
        "success"
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
            type === "success"
                ? "success"
                : "error"
        );


    window.scrollTo({

        top:
            0,

        behavior:
            "smooth"

    });

}


/* =========================================================
   BACK
========================================================= */

function goBack() {

    window.location.href =
        "dashboard.html";

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


function escapeJavaScript(
    value
) {

    return String(
        value == null
            ? ""
            : value
    )

        .replace(
            /\\/g,
            "\\\\"
        )

        .replace(
            /'/g,
            "\\'"
        );

}
