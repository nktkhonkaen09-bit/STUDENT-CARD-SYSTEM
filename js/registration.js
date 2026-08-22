/* =========================================================
   STUDENT COURSE REGISTRATION
   js/registration.js
========================================================= */

"use strict";


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

    if (!checkStudentSession()) {

        return;

    }


    loadStudentSummary();


    await loadMyRegistrations();


    await loadAvailableCourses();


    renderSelectedList();

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
   API
========================================================= */

async function registrationApi(
    payload
) {

    const apiUrl =
        CONFIG.API_URL;


    if (!apiUrl) {

        throw new Error(
            "ไม่พบ API_URL ใน config.js"
        );

    }


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

        throw new Error(
            "ไม่พบ Session นักศึกษา"
        );

    }


    const requestBody = {

        ...payload,

        token:
            token

    };


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
                    JSON.stringify(
                        requestBody
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
            "student_session"
        );


        sessionStorage.removeItem(
            "student_data"
        );


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
            Array.isArray(
                result.courses
            )
                ? result.courses
                : [];


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

                escapeHtml(
                    error.message ||
                    "ไม่สามารถโหลดรายวิชาได้"
                ) +

                '</div>';

        }

    }

}


/* =========================================================
   LOAD MY REGISTRATIONS
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
            Array.isArray(
                result.registrations
            )
                ? result.registrations
                : [];


        renderMyRegistrations();

    }
    catch (error) {

        console.error(
            "LOAD REGISTRATIONS ERROR:",
            error
        );


        if (container) {

            container.innerHTML =

                '<div class="empty-state">' +

                escapeHtml(
                    error.message ||
                    "ยังไม่มีรายการลงทะเบียน"
                ) +

                '</div>';

        }

    }

}


/* =========================================================
   GROUP / RENDER COURSES
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
        function (course, courseIndex) {

            const registered =
                isCourseRegistered(
                    course.code
                );


            const selected =
                findSelectedRegistration(
                    course.code
                );


            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "course-item";


            let optionsHtml =
                "";


            if (
                !registered
            ) {

                const options =
                    Array.isArray(
                        course.options
                    )
                        ? course.options
                        : [];


                options.forEach(
                    function (
                        option,
                        optionIndex
                    ) {

                        const isChecked =
                            !!(
                                selected &&

                                selected.teacherCode ===
                                    option.teacherCode &&

                                selected.room ===
                                    option.room
                            );


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
                                isChecked
                                    ? 'checked'
                                    : ''
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

            }


            wrapper.innerHTML =

                '<div class="course-header">' +

                '<input ' +

                'type="checkbox" ' +

                'class="course-check" ' +

                'id="course-' +
                courseIndex +
                '" ' +

                (
                    selected ||
                    registered
                        ? 'checked'
                        : ''
                ) +

                (
                    registered
                        ? 'disabled'
                        : ''
                ) +

                ' onchange="toggleCourse(' +
                courseIndex +
                ')"' +

                '>' +

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
                    registered

                        ? (

                            '<div class="empty-state">' +
                            'ลงทะเบียนวิชานี้แล้ว' +
                            '</div>'

                        )

                        : optionsHtml
                ) +

                '</div>';


            container.appendChild(
                wrapper
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

        const selected =
            findSelectedRegistration(
                course.code
            );


        if (!selected) {

            const firstOption =
                Array.isArray(
                    course.options
                )
                    ? course.options[0]
                    : null;


            if (firstOption) {

                addOrUpdateSelected(
                    course,
                    firstOption
                );

            }

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


    const options =
        Array.isArray(
            course.options
        )
            ? course.options
            : [];


    const option =
        options[
            optionIndex
        ];


    if (!option) {

        return;

    }


    addOrUpdateSelected(
        course,
        option
    );


    const checkbox =
        document.getElementById(
            "course-" +
            courseIndex
        );


    if (checkbox) {

        checkbox.checked =
            true;

    }


    renderSelectedList();

}


/* =========================================================
   ADD / UPDATE SELECTED
========================================================= */

function addOrUpdateSelected(
    course,
    option
) {

    const newValue = {

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


    const index =
        selectedRegistrations.findIndex(
            function (item) {

                return (
                    item.courseCode ===
                    course.code
                );

            }
        );


    if (index >= 0) {

        selectedRegistrations[index] =
            newValue;

    }
    else {

        selectedRegistrations.push(
            newValue
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
                    item.status || ""
                ).trim() ===
                "เรียน"

            );

        }
    );

}


/* =========================================================
   RENDER CURRENT REGISTRATIONS
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

            'ยังไม่มีวิชาที่ลงทะเบียน' +

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

                    'onclick="removeSelectedAndRefresh(&quot;' +

                    escapeHtml(
                        item.courseCode
                    ) +

                    '&quot;)"' +

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
            selectedRegistrations.length ===
            0;

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


    const originalText =
        button
            ? button.textContent
            : "";


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


        selectedRegistrations =
            [];


        await loadMyRegistrations();

        await loadAvailableCourses();

        renderSelectedList();


        showMessage(
            result.message ||
            "ลงทะเบียนเรียนสำเร็จ",
            "success"
        );

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
                originalText ||
                "✅ ยืนยันการลงทะเบียน";

            button.disabled =
                selectedRegistrations.length ===
                0;

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
   HELPERS
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
   INITIAL
========================================================= */

renderSelectedList();
