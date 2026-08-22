"use strict";


/* =========================================================
   API
========================================================= */


/*
 * Student Card API
 *
 * ใช้สำหรับ:
 * - ตรวจ Session
 * - ดึงข้อมูลนักศึกษาจาก Students
 */

const STUDENT_CARD_API_URL =
    (
        typeof CONFIG !== "undefined" &&
        CONFIG.API_URL
    )
        ? CONFIG.API_URL
        : "";


/*
 * Attendance API
 *
 * ใช้สำหรับ:
 * - ค้นหารายวิชา
 * - อ่านผู้สอน
 * - อ่านห้องเรียน
 *
 * ยังไม่ใช้บันทึกลงทะเบียนในขั้นนี้
 */

const ATTENDANCE_API_URL =
    "https://script.google.com/macros/s/AKfycbyeZp9LubywmnFuv5DEBjjZESAoz-u387cNtNe4DmnyXcRdVZ03zs_1GTri76XwZQQnkQ/exec";


/* =========================================================
   STATE
========================================================= */

let currentStudent = null;

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

    try {

        const hasSession =
            checkStudentSession();


        if (!hasSession) {

            return;

        }


        await loadStudentProfile();

        await loadAvailableCourses();

        renderSelectedList();

    }

    catch (error) {

        console.error(
            "REGISTRATION INITIALIZE ERROR:",
            error
        );


        showMessage(
            error.message ||
            "ไม่สามารถเปิดระบบลงทะเบียนได้",
            "error"
        );

    }

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
            clean(
                getStudentToken()
            );

    }


    if (!token) {

        token =
            clean(
                sessionStorage.getItem(
                    "student_session"
                )
            );

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
   GET TOKEN
========================================================= */

function getRegistrationToken() {

    let token = "";


    if (
        typeof getStudentToken ===
        "function"
    ) {

        token =
            clean(
                getStudentToken()
            );

    }


    if (!token) {

        token =
            clean(
                sessionStorage.getItem(
                    "student_session"
                )
            );

    }


    return token;

}


/* =========================================================
   LOAD STUDENT PROFILE
   อ่านจาก STUDENT-CARD-SYSTEM / Students
========================================================= */

async function loadStudentProfile() {

    const token =
        getRegistrationToken();


    if (!token) {

        throw new Error(
            "ไม่พบ Session นักศึกษา"
        );

    }


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
                            "getStudentProfile",

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
   RENDER STUDENT PROFILE
========================================================= */

function renderStudentProfile() {

    const student =
        currentStudent;


    if (!student) {

        return;

    }


    const fullName =
        [

            student.prefix_th || "",

            student.firstname_th || "",

            student.lastname_th || ""

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

            student.firstname_en || "",

            student.lastname_en || ""

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
        student.student_id || "-"
    );


    setText(
        "studentDepartment",
        student.department || "-"
    );


    setText(
        "studentStatus",
        student.status || "-"
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
            student.photo_url
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
   LOAD ALL COURSES
========================================================= */

async function loadAvailableCourses() {

    const resultsBox =
        document.getElementById(
            "courseSearchResults"
        );


    if (!resultsBox) {

        return;

    }


    try {

        resultsBox.innerHTML =

            '<div class="loading">' +

            'กำลังเตรียมข้อมูลรายวิชา...' +

            '</div>';


        const response =
            await fetch(

                ATTENDANCE_API_URL +

                "?action=getAllRegistrationCourses",

                {

                    method:
                        "GET",

                    cache:
                        "no-store"

                }

            );


        if (!response.ok) {

            throw new Error(
                "Attendance API HTTP " +
                response.status
            );

        }


        const result =
            await response.json();


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


        resultsBox.innerHTML =

            '<div class="empty-state">' +

            'พิมพ์รหัสวิชาเพื่อค้นหา' +

            '</div>';

    }

    catch (error) {

        console.error(
            "LOAD COURSES ERROR:",
            error
        );


        resultsBox.innerHTML =

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


                    const duplicate =
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
                        duplicate
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
   SEARCH COURSES
========================================================= */

function searchCourses() {

    const input =
        document.getElementById(
            "courseSearchInput"
        );


    const resultsBox =
        document.getElementById(
            "courseSearchResults"
        );


    if (
        !input ||
        !resultsBox
    ) {

        return;

    }


    const keyword =
        clean(
            input.value
        )
        .toLowerCase();


    hideSearchMessage();


    if (!keyword) {

        resultsBox.innerHTML =

            '<div class="empty-state">' +

            'กรุณาพิมพ์รหัสวิชา' +

            '</div>';

        return;

    }


    const results =
        availableCourses.filter(
            function (course) {

                return (

                    course.code
                        .toLowerCase()
                        .includes(
                            keyword
                        )

                );

            }
        );


    if (!results.length) {

        resultsBox.innerHTML =

            '<div class="empty-state">' +

            'ไม่พบรหัสวิชา "' +

            escapeHtml(
                input.value
            ) +

            '"' +

            '</div>';

        return;

    }


    renderSearchResults(
        results
    );

}


/* =========================================================
   ENTER
========================================================= */

function handleSearchKeydown(
    event
) {

    if (
        event.key ===
        "Enter"
    ) {

        event.preventDefault();

        searchCourses();

    }

}


/* =========================================================
   RENDER SEARCH RESULTS
========================================================= */

function renderSearchResults(
    courses
) {

    const container =
        document.getElementById(
            "courseSearchResults"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    courses.forEach(
        function (course) {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "course-result-item";


            let optionsHtml =
                "";


            if (
                !course.options.length
            ) {

                optionsHtml =

                    '<div class="empty-state">' +

                    'ไม่พบกลุ่มเรียนของวิชานี้' +

                    '</div>';

            }

            else {

                optionsHtml =
                    course.options
                        .map(
                            function (
                                option,
                                index
                            ) {

                                const selected =
                                    findSelectedCourse(
                                        course.code
                                    );


                                const checked =

                                    !!(
                                        selected &&

                                        selected.teacherCode ===
                                            option.teacherCode &&

                                        selected.room ===
                                            option.room
                                    );


                                return (

                                    '<label class="course-option">' +

                                        '<input ' +

                                            'type="radio" ' +

                                            'name="course-option-' +
                                            escapeHtml(
                                                course.code
                                            ) +
                                            '" ' +

                                            'value="' +
                                            index +
                                            '" ' +

                                            (
                                                checked
                                                    ? "checked"
                                                    : ""
                                            ) +

                                            ' onchange="selectCourseOption(\'' +

                                                escapeJavaScript(
                                                    course.code
                                                ) +

                                                '\',' +

                                                index +

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

                                    '</label>'

                                );

                            }
                        )
                        .join("");

            }


            wrapper.innerHTML =

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

                '<div class="course-option-title">' +

                    'เลือกกลุ่มเรียน' +

                '</div>' +

                '<div class="course-options">' +

                    optionsHtml +

                '</div>';


            container.appendChild(
                wrapper
            );

        }
    );

}


/* =========================================================
   SELECT COURSE
========================================================= */

function selectCourseOption(
    courseCode,
    optionIndex
) {

    const course =
        availableCourses.find(
            function (item) {

                return (
                    item.code ===
                    courseCode
                );

            }
        );


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


    renderSelectedList();

    searchCourses();

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
        )

        ||

        null

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


    renderSelectedList();

    searchCourses();

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
   SEARCH MESSAGE
========================================================= */

function hideSearchMessage() {

    const box =
        document.getElementById(
            "searchMessage"
        );


    if (!box) {

        return;

    }


    box.textContent =
        "";


    box.className =
        "search-message";

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
