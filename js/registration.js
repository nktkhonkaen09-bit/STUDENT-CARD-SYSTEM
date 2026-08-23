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


const ATTENDANCE_API_URL =
    "https://script.google.com/macros/s/AKfycbyeZp9LubywmnFuv5DEBjjZESAoz-u387cNtNe4DmnyXcRdVZ03zs_1GTri76XwZQQnkQ/exec";


/* =========================================================
   STATE
========================================================= */

let currentStudent = null;

let availableCourses = [];

let selectedRegistrations = [];

let registeredCourses = [];


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

        if (
            !checkStudentSession()
        ) {

            return;

        }


        await loadStudentProfile();

        await loadRegisteredCourses();

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

    const token =
        getRegistrationToken();


    if (!token) {

        window.location.replace(
            "index.html"
        );

        return false;

    }


    return true;

}


function getRegistrationToken() {

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
   LOAD STUDENT PROFILE
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

                method: "POST",

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
   LOAD REGISTERED COURSES
   Student Card API -> Session -> Attendance Spreadsheet
========================================================= */

async function loadRegisteredCourses() {

    const container =
        document.getElementById(
            "registeredCourses"
        );


    if (!container) {

        return;

    }


    try {

        container.innerHTML =
            '<div class="loading">' +
            'กำลังโหลดวิชาที่ลงทะเบียนแล้ว...' +
            '</div>';


        const token =
            getRegistrationToken();


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
                                "getMyRegistrations",

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

                    : "ไม่สามารถโหลดรายการลงทะเบียนได้"

            );

        }


        registeredCourses =
            Array.isArray(
                result.registrations
            )
                ? result.registrations
                : [];


        renderRegisteredCourses();

    }

    catch (error) {

        console.error(
            "LOAD REGISTERED COURSES ERROR:",
            error
        );


        container.innerHTML =

            '<div class="empty-state">' +

            escapeHtml(
                error.message ||
                "ไม่สามารถโหลดวิชาที่ลงทะเบียนได้"
            ) +

            '</div>';

    }

}


/* =========================================================
   RENDER REGISTERED COURSES
========================================================= */

function renderRegisteredCourses() {

    const container =
        document.getElementById(
            "registeredCourses"
        );


    if (!container) {

        return;

    }


    if (
        !registeredCourses.length
    ) {

        container.innerHTML =

            '<div class="empty-state">' +
            'ยังไม่มีวิชาที่ลงทะเบียน' +
            '</div>';

        return;

    }


    container.innerHTML =
        "";


    registeredCourses.forEach(
        function (item) {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "registered-course-item";


            row.innerHTML =

                '<div class="registered-course-code">' +

                    escapeHtml(
                        item.courseCode || "-"
                    ) +

                '</div>' +

                '<div class="registered-course-name">' +

                    escapeHtml(
                        item.courseName || "-"
                    ) +

                '</div>' +

                '<div class="registered-course-teacher">' +

                    escapeHtml(
                        item.teacherName ||
                        item.teacherCode ||
                        "-"
                    ) +

                '</div>' +

                '<div class="registered-course-room">' +

                    escapeHtml(
                        item.room || "-"
                    ) +

                '</div>' +

                '<div class="registered-course-status">' +

                    escapeHtml(
                        item.status || "เรียน"
                    ) +

                '</div>';


            container.appendChild(
                row
            );

        }
    );

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
   ENTER SEARCH
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
   IS ALREADY REGISTERED
========================================================= */

function isCourseAlreadyRegistered(
    courseCode
) {

    return registeredCourses.some(
        function (item) {

            return (

                clean(
                    item.courseCode
                )
                ===
                clean(
                    courseCode
                )

            );

        }
    );

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


    const header =
        document.createElement(
            "div"
        );


    header.className =
        "course-table-header";


    header.innerHTML =

        '<div>เลือก</div>' +

        '<div>รหัสวิชา</div>' +

        '<div>รายวิชา</div>' +

        '<div>รหัสผู้สอน</div>' +

        '<div>ห้อง</div>';


    container.appendChild(
        header
    );


    courses.forEach(
        function (course) {

            const alreadyRegistered =
                isCourseAlreadyRegistered(
                    course.code
                );


            course.options.forEach(
                function (
                    option,
                    optionIndex
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


                    const row =
                        document.createElement(
                            "div"
                        );


                    row.className =
                        "course-result-item";


                    row.innerHTML =

                        '<div class="course-cell select">' +

                            '<input ' +

                                'type="radio" ' +

                                'class="course-select-radio" ' +

                                'name="course-option-' +

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

                                (
                                    alreadyRegistered
                                        ? "disabled"
                                        : ""
                                ) +

                                ' aria-label="เลือก ' +

                                escapeHtml(
                                    course.code
                                ) +

                                '" ' +

                            '>' +

                        '</div>' +

                        '<div class="course-cell code">' +

                            escapeHtml(
                                course.code
                            ) +

                        '</div>' +

                        '<div class="course-cell course-name">' +

                            escapeHtml(
                                course.name
                            ) +

                        '</div>' +

                        '<div class="course-cell teacher">' +

                            escapeHtml(
                                option.teacherCode
                            ) +

                        '</div>' +

                        '<div class="course-cell room">' +

                            escapeHtml(
                                option.room
                            ) +

                        '</div>';


                    if (
                        alreadyRegistered
                    ) {

                        row.title =
                            "ลงทะเบียนวิชานี้แล้ว";

                        row.style.opacity =
                            "0.55";

                    }


                    const radio =
                        row.querySelector(
                            ".course-select-radio"
                        );


                    if (
                        radio &&
                        !alreadyRegistered
                    ) {

                        radio.addEventListener(
                            "change",
                            function () {

                                selectCourseOption(
                                    course.code,
                                    optionIndex
                                );

                            }
                        );

                    }


                    container.appendChild(
                        row
                    );

                }
            );

        }
    );


    if (
        courses.some(
            function (course) {

                return isCourseAlreadyRegistered(
                    course.code
                );

            }
        )
    ) {

        const note =
            document.createElement(
                "div"
            );


        note.className =
            "registered-note";


        note.textContent =
            "วิชาที่จางลง คือวิชาที่คุณลงทะเบียนไว้แล้ว";


        container.appendChild(
            note
        );

    }

}


/* =========================================================
   SELECT COURSE
========================================================= */

function selectCourseOption(
    courseCode,
    optionIndex
) {

    if (
        isCourseAlreadyRegistered(
            courseCode
        )
    ) {

        showMessage(
            "คุณลงทะเบียนวิชา " +
            courseCode +
            " แล้ว",
            "error"
        );

        return;

    }


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

                            'รหัสผู้สอน: ' +

                            escapeHtml(
                                item.teacherCode
                            ) +

                            ' • อาจารย์: ' +

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
   CONFIRM
========================================================= */

async function previewRegistration() {

    if (
        !selectedRegistrations.length
    ) {

        showMessage(
            "กรุณาเลือกรายวิชาอย่างน้อย 1 วิชา",
            "error"
        );

        return;

    }


    const confirmText =
        buildConfirmationText();


    const confirmed =
        window.confirm(
            confirmText
        );


    if (!confirmed) {

        return;

    }


    await submitRegistration();

}


/* =========================================================
   BUILD CONFIRMATION
========================================================= */

function buildConfirmationText() {

    const lines = [

        "ยืนยันการลงทะเบียนเรียน",

        "",

        "รหัสนักศึกษา: " +

            (
                currentStudent &&
                currentStudent.student_id

                    ? currentStudent.student_id

                    : "-"
            ),

        getStudentDisplayName(),

        "",

        "รายวิชาที่เลือก:"

    ];


    selectedRegistrations.forEach(
        function (
            item,
            index
        ) {

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

                " | " +

                item.teacherCode +

                " | ห้อง " +

                item.room

            );

        }
    );


    lines.push("");

    lines.push(
        "กด OK เพื่อยืนยันการลงทะเบียน"
    );


    return lines.join(
        "\n"
    );

}


/* =========================================================
   STUDENT NAME
========================================================= */

function getStudentDisplayName() {

    if (!currentStudent) {

        return "";

    }


    const name =
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


    return (
        name
            ? "ชื่อ: " + name
            : ""
    );

}


/* =========================================================
   SUBMIT
========================================================= */

async function submitRegistration() {

    if (
        !selectedRegistrations.length
    ) {

        return;

    }


    const button =
        document.getElementById(
            "previewButton"
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


    try {

        const token =
            getRegistrationToken();


        if (!token) {

            throw new Error(
                "Session นักศึกษาหมดอายุ"
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
                                "registerStudentCourses",

                            token:
                                token,

                            registrations:
                                selectedRegistrations.map(
                                    function (item) {

                                        return {

                                            courseCode:
                                                item.courseCode,

                                            teacherCode:
                                                item.teacherCode,

                                            room:
                                                item.room

                                        };

                                    }
                                )

                        }),

                    cache:
                        "no-store"

                }
            );


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

                    : "ไม่สามารถบันทึกการลงทะเบียนได้"

            );

        }


        selectedRegistrations =
            [];


        await loadRegisteredCourses();


        renderSelectedList();


        showMessage(

            result.message ||
            "ลงทะเบียนเรียนสำเร็จ",

            "success"

        );


        const input =
            document.getElementById(
                "courseSearchInput"
            );


        const resultsBox =
            document.getElementById(
                "courseSearchResults"
            );


        if (input) {

            input.value =
                "";

        }


        if (resultsBox) {

            resultsBox.innerHTML =

                '<div class="empty-state">' +
                'ลงทะเบียนเรียบร้อยแล้ว' +
                '</div>';

        }

    }

    catch (error) {

        console.error(
            "SUBMIT REGISTRATION ERROR:",
            error
        );


        showMessage(

            error.message ||
            "ไม่สามารถบันทึกการลงทะเบียนได้",

            "error"

        );

    }

    finally {

        if (button) {

            button.textContent =
                originalText ||
                "ตรวจสอบรายการ";

            button.disabled =
                false;

        }

    }

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


renderSelectedList();
