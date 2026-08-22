/* =========================================================
   STUDENT COURSE REGISTRATION
   js/registration.js
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

let availableCourses = [];

let currentRegistrations = [];

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

    checkStudentSession();

    loadStudentSummary();

    await Promise.all([

        loadMyRegistrations(),

        loadAvailableCourses()

    ]);

}


/* =========================================================
   CHECK SESSION
========================================================= */

function checkStudentSession() {

    const token =
        typeof getStudentToken === "function"
            ? getStudentToken()
            : sessionStorage.getItem(
                "student_session"
            );


    if (!token) {

        window.location.replace(
            "index.html"
        );

    }

}


/* =========================================================
   LOAD STUDENT SUMMARY
========================================================= */

function loadStudentSummary() {

    const raw =
        typeof getStudentData === "function"
            ? getStudentData()
            : sessionStorage.getItem(
                "student_data"
            );


    if (!raw) {

        return;

    }


    let student = raw;


    if (typeof raw === "string") {

        try {

            student =
                JSON.parse(
                    raw
                );

        }
        catch (error) {

            console.error(
                "REGISTRATION STUDENT DATA ERROR:",
                error
            );

            return;

        }

    }


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


/* =========================================================
   API
========================================================= */

async function registrationApi(
    payload
) {

    const apiUrl =
        CONFIG.API_URL;


    if (!apiUrl) {

        throw new Error(
            "ไม่พบ API_URL"
        );

    }


    const token =
        typeof getStudentToken === "function"
            ? getStudentToken()
            : sessionStorage.getItem(
                "student_session"
            );


    const response =
        await fetch(
            apiUrl,
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"

                },

                body:
                    JSON.stringify({

                        ...payload,

                        token:
                            token

                    })

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


    if (
        result &&
        result.code ===
        "STUDENT_SESSION_EXPIRED"
    ) {

        if (
            typeof clearStudentSession ===
            "function"
        ) {

            clearStudentSession();

        }
        else {

            sessionStorage.removeItem(
                "student_session"
            );

            sessionStorage.removeItem(
                "student_data"
            );

        }


        window.location.replace(
            "index.html"
        );


        throw new Error(
            "SESSION_EXPIRED"
        );

    }


    return result;

}


/* =========================================================
   LOAD AVAILABLE COURSES
========================================================= */

async function loadAvailableCourses() {

    const container =
        document.getElementById(
            "courseList"
        );


    try {

        const result =
            await registrationApi({

                action:
                    "getAvailableCourses"

            });


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
            result.courses || [];


        renderCourseList();


    }
    catch (error) {

        console.error(
            "LOAD COURSES ERROR:",
            error
        );


        if (container) {

            container.innerHTML =

                '<div class="empty-state">' +

                'ไม่สามารถโหลดรายวิชาได้' +

                '</div>';

        }

    }

}


/* =========================================================
   LOAD CURRENT REGISTRATIONS
========================================================= */

async function loadMyRegistrations() {

    const container =
        document.getElementById(
            "myRegistrations"
        );


    try {

        const result =
            await registrationApi({

                action:
                    "getMyRegistrations"

            });


        if (
            !result ||
            !result.success
        ) {

            throw new Error(

                result &&
                result.message

                    ? result.message

                    : "ไม่สามารถโหลดรายการลงทะเบียนได้"

            );

        }


        currentRegistrations =
            result.registrations || [];


        renderMyRegistrations();


    }
    catch (error) {

        console.error(
            "LOAD MY REGISTRATIONS ERROR:",
            error
        );


        if (container) {

            container.innerHTML =

                '<div class="empty-state">' +

                'ยังไม่มีรายการลงทะเบียน' +

                '</div>';

        }

    }

}


/* =========================================================
   RENDER AVAILABLE COURSES
========================================================= */

function renderCourseList() {

    const container =
        document.getElementById(
            "courseList"
        );


    if (!container) {

        return;

    }


    if (!availableCourses.length) {

        container.innerHTML =

            '<div class="empty-state">' +

            'ขณะนี้ยังไม่มีรายวิชาที่เปิดให้ลงทะเบียน' +

            '</div>';

        return;

    }


    container.innerHTML = "";


    availableCourses.forEach(

        function (course, index) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "course-item";


            const alreadyRegistered =
                isCourseRegistered(
                    course.code
                );


            const selected =
                findSelectedRegistration(
                    course.code
                );


            let optionsHtml =
                "";


            (course.options || [])
                .forEach(

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
                                            ? 'checked'
                                            : ''
                                    ) +

                                    (
                                        alreadyRegistered
                                            ? 'disabled'
                                            : ''
                                    ) +

                                    ' onchange="selectCourseOption(' +
                                        index +
                                        ',' +
                                        optionIndex +
                                    ')">' +

                                '<span class="option-main">' +

                                    '<span class="option-teacher">' +
                                        escapeHtml(
                                            option.teacherName ||
                                            option.teacherCode ||
                                            "-"
                                        ) +
                                    '</span>' +

                                    '<span class="option-detail">' +

                                        'รหัสผู้สอน: ' +
                                        escapeHtml(
                                            option.teacherCode ||
                                            "-"
                                        ) +

                                        ' • ห้อง: ' +
                                        escapeHtml(
                                            option.room ||
                                            "-"
                                        ) +

                                    '</span>' +

                                '</span>' +

                            '</label>';

                    }

                );


            item.innerHTML =

                '<div class="course-header">' +

                    '<input ' +

                        'type="checkbox" ' +

                        'class="course-check" ' +

                        'id="course-' +
                        index +
                        '" ' +

                        (
                            selected ||
                            alreadyRegistered
                                ? 'checked'
                                : ''
                        ) +

                        (
                            alreadyRegistered
                                ? 'disabled'
                                : ''
                        ) +

                        ' onchange="toggleCourse(' +
                            index +
                        ')">' +

                    '<div>' +

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

                    '</div>' +

                '</div>' +

                '<div class="course-options">' +

                    (
                        alreadyRegistered

                            ? (

                                '<div class="empty-state">' +

                                'ลงทะเบียนวิชานี้แล้ว' +

                                '</div>'

                            )

                            : optionsHtml
                    ) +

                '</div>';


            container.appendChild(
                item
            );

        }

    );

}


/* =========================================================
   TOGGLE COURSE
========================================================= */

function toggleCourse(
    courseIndex
) {

    const course =
        availableCourses[
            courseIndex
        ];


    if (!course) {

        return;

    }


    const checkbox =
        document.getElementById(
            "course-" +
            courseIndex
        );


    if (!checkbox) {

        return;

    }


    if (!checkbox.checked) {

        removeSelectedCourse(
            course.code
        );

    }


    else {

        /*
         * ยังไม่ลงทะเบียนจริง
         * จะเลือกได้เมื่อเลือกอาจารย์/ห้อง
         */

        const firstOption =
            (course.options || [])[0];


        if (firstOption) {

            addOrUpdateSelected(

                course,

                firstOption

            );

        }

    }


    renderCourseList();

    renderSelectedList();

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
        (course.options || [])[
            optionIndex
        ];


    if (!option) {

        return;

    }


    const checkbox =
        document.getElementById(
            "course-" +
            courseIndex
        );


    if (checkbox) {

        checkbox.checked =
            true;

    }


    addOrUpdateSelected(

        course,

        option

    );


    renderSelectedList();

}


/* =========================================================
   ADD / UPDATE SELECTED
========================================================= */

function addOrUpdateSelected(
    course,
    option
) {

    const existingIndex =
        selectedRegistrations.findIndex(

            function (item) {

                return (
                    item.courseCode ===
                    course.code
                );

            }

        );


    const value = {

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


    if (
        existingIndex >= 0
    ) {

        selectedRegistrations[
            existingIndex
        ] =
            value;

    }
    else {

        selectedRegistrations.push(
            value
        );

    }

}


/* =========================================================
   FIND SELECTED
========================================================= */

function findSelectedRegistration(
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
   REMOVE
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

}


/* =========================================================
   IS REGISTERED
========================================================= */

function isCourseRegistered(
    courseCode
) {

    return currentRegistrations.some(

        function (item) {

            return (
                item.courseCode ===
                courseCode &&
                String(
                    item.status ||
                    ""
                ).trim() ===
                "เรียน"
            );

        }

    );

}


/* =========================================================
   RENDER MY REGISTRATIONS
========================================================= */

function renderMyRegistrations() {

    const container =
        document.getElementById(
            "myRegistrations"
        );


    if (!container) {

        return;

    }


    if (!currentRegistrations.length) {

        container.innerHTML =

            '<div class="empty-state">' +

            'ยังไม่มีรายวิชาที่ลงทะเบียน' +

            '</div>';

        return;

    }


    container.innerHTML = "";


    currentRegistrations.forEach(

        function (item) {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "current-registration";


            div.innerHTML =

                '<div class="current-registration-code">' +

                    escapeHtml(
                        item.courseCode ||
                        "-"
                    ) +

                    ' • ' +

                    escapeHtml(
                        item.courseName ||
                        ""
                    ) +

                '</div>' +

                '<div class="current-registration-detail">' +

                    'อาจารย์: ' +
                    escapeHtml(
                        item.teacherName ||
                        item.teacherCode ||
                        "-"
                    ) +

                    ' • ห้อง: ' +
                    escapeHtml(
                        item.room ||
                        "-"
                    ) +

                    ' • สถานะ: ' +
                    escapeHtml(
                        item.status ||
                        "-"
                    ) +

                '</div>';


            container.appendChild(
                div
            );

        }

    );

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


    const button =
        document.getElementById(
            "registerButton"
        );


    if (!container) {

        return;

    }


    if (!selectedRegistrations.length) {

        container.innerHTML =

            '<div class="empty-state">' +

            'ยังไม่ได้เลือกรายวิชา' +

            '</div>';

    }

    else {

        container.innerHTML = "";


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
                                item.teacherName ||
                                item.teacherCode ||
                                "-"
                            ) +

                            ' • ห้อง: ' +

                            escapeHtml(
                                item.room ||
                                "-"
                            ) +

                        '</div>' +

                    '</div>' +

                    '<button ' +

                        'type="button" ' +

                        'class="remove-selected" ' +

                        'onclick="removeSelectedAndRefresh(\'' +

                            escapeAttribute(
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


    if (button) {

        button.disabled =
            selectedRegistrations.length === 0;

    }

}


/* =========================================================
   REMOVE + REFRESH
========================================================= */

function removeSelectedAndRefresh(
    courseCode
) {

    removeSelectedCourse(
        courseCode
    );

    renderCourseList();

    renderSelectedList();

}


/* =========================================================
   SUBMIT REGISTRATION
========================================================= */

async function submitRegistration() {

    if (
        !selectedRegistrations.length
    ) {

        return;

    }


    const button =
        document.getElementById(
            "registerButton"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "กำลังบันทึก...";

    }


    hideMessage();


    try {

        const result =
            await registrationApi({

                action:
                    "registerCourses",

                registrations:
                    selectedRegistrations

            });


        if (
            !result ||
            !result.success
        ) {

            throw new Error(

                result &&
                result.message

                    ? result.message

                    : "ไม่สามารถบันทึกการลงทะเบียนได้"

            );

        }


        showMessage(
            result.message ||
            "ลงทะเบียนเรียนสำเร็จ",
            "success"
        );


        selectedRegistrations =
            [];


        await loadMyRegistrations();

        await loadAvailableCourses();

        renderSelectedList();


    }
    catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );


        showMessage(
            error.message ||
            "ไม่สามารถลงทะเบียนเรียนได้",
            "error"
        );

    }

    finally {

        if (button) {

            button.textContent =
                "✅ ยืนยันการลงทะเบียน";

            button.disabled =
                selectedRegistrations.length === 0;

        }

    }

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


function hideMessage() {

    const box =
        document.getElementById(
            "message"
        );


    if (!box) {

        return;

    }


    box.className =
        "message";

    box.textContent =
        "";

}


/* =========================================================
   BACK
========================================================= */

function goBack() {

    window.location.href =
        "dashboard.html";

}


/* =========================================================
   TEXT HELPERS
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


/* =========================================================
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(
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


/* =========================================================
   INITIAL RENDER
========================================================= */

renderSelectedList();
