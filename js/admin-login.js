/*******************************************************
 * STUDENT CARD SYSTEM
 * admin-login.js
 *
 * หน้าที่:
 * 1. รับ Username / Password
 * 2. ส่ง adminLogin ไป Google Apps Script
 * 3. ตรวจสอบผล Login
 * 4. บันทึก Admin Session
 * 5. บันทึกข้อมูล Admin
 * 6. Redirect ไป admin-dashboard.html
 * 7. ป้องกันการ Login ซ้ำถ้ามี Session เดิม
 *******************************************************/


/*******************************************************
 * GLOBAL
 *******************************************************/

"use strict";


/*******************************************************
 * DOM READY
 *******************************************************/

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeAdminLogin();

    }
);


/*******************************************************
 * INITIALIZE
 *******************************************************/

function initializeAdminLogin() {

    const form =
        document.getElementById(
            "adminLoginForm"
        );


    if (!form) {

        console.error(
            "ไม่พบ #adminLoginForm"
        );

        return;

    }


    /*
     * ตรวจว่ามี Admin Session อยู่แล้วหรือไม่
     */

    checkExistingAdminSession();


    /*
     * Submit Login
     */

    form.addEventListener(
        "submit",
        handleAdminLogin
    );


    /*
     * Enter key ทำงานตาม form ปกติ
     */

}


/*******************************************************
 * CHECK EXISTING SESSION
 *******************************************************/

function checkExistingAdminSession() {

    try {

        const token =
            sessionStorage.getItem(
                CONFIG.ADMIN_SESSION_KEY
            );


        /*
         * ไม่มี Token
         * ให้ Login ตามปกติ
         */

        if (!token) {

            return;

        }


        /*
         * มี Token
         * ตรวจสอบกับ Server
         */

        verifyAdminSession(token);

    } catch (error) {

        console.error(
            "CHECK ADMIN SESSION ERROR:",
            error
        );

    }

}


/*******************************************************
 * VERIFY ADMIN SESSION
 *******************************************************/

async function verifyAdminSession(token) {

    try {

        const result =
            await callAdminAPI({

                action:
                    "adminGetStudents",

                token:
                    token

            });


        /*
         * Session ยังใช้งานได้
         */

        if (
            result &&
            result.success
        ) {

            /*
             * ไป Dashboard ได้เลย
             */

            window.location.replace(
                "admin-dashboard.html"
            );

            return;

        }


        /*
         * Session หมดอายุ
         */

        if (
            result &&
            result.code ===
                "ADMIN_SESSION_EXPIRED"
        ) {

            clearAdminSession();

            return;

        }


        /*
         * กรณีอื่น
         */

        clearAdminSession();

    } catch (error) {

        console.warn(
            "VERIFY ADMIN SESSION ERROR:",
            error
        );

        /*
         * ถ้าตรวจไม่ได้
         * ไม่บังคับ Redirect
         * ให้ผู้ใช้ Login ใหม่ได้
         */

    }

}


/*******************************************************
 * ADMIN LOGIN
 *******************************************************/

async function handleAdminLogin(event) {

    event.preventDefault();


    const usernameInput =
        document.getElementById(
            "adminUsername"
        );


    const passwordInput =
        document.getElementById(
            "adminPassword"
        );


    const button =
        document.getElementById(
            "adminLoginButton"
        );


    if (
        !usernameInput ||
        !passwordInput ||
        !button
    ) {

        console.error(
            "ไม่พบ Element ของ Admin Login"
        );

        return;

    }


    const username =
        String(
            usernameInput.value || ""
        ).trim();


    const password =
        String(
            passwordInput.value || ""
        );


    /*
     * ตรวจข้อมูล
     */

    if (!username) {

        showAdminMessage(
            "กรุณากรอกชื่อผู้ใช้",
            "error"
        );

        usernameInput.focus();

        return;

    }


    if (!password) {

        showAdminMessage(
            "กรุณากรอกรหัสผ่าน",
            "error"
        );

        passwordInput.focus();

        return;

    }


    /*
     * Disable ปุ่ม
     */

    button.disabled = true;

    button.dataset.originalText =
        button.textContent;


    button.textContent =
        "กำลังตรวจสอบ...";


    showAdminMessage(
        "กำลังเชื่อมต่อระบบ...",
        "info"
    );


    try {

        /*
         * ล้าง Session เดิมก่อน Login
         */

        clearAdminSession();


        /*
         * เรียก API
         */

        const result =
            await callAdminAPI({

                action:
                    "adminLogin",

                username:
                    username,

                password:
                    password

            });


        console.log(
            "ADMIN LOGIN RESULT:",
            result
        );


        /*
         * API Error
         */

        if (
            !result
        ) {

            throw new Error(
                "ไม่ได้รับข้อมูลจาก Server"
            );

        }


        /*
         * Login ไม่สำเร็จ
         */

        if (
            !result.success
        ) {

            showAdminMessage(

                result.message ||
                "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",

                "error"

            );

            return;

        }


        /*
         * ต้องมี Token
         */

        if (
            !result.token
        ) {

            throw new Error(
                "Server ไม่ส่ง Admin Session Token"
            );

        }


        /*
         * บันทึก Session
         */

        sessionStorage.setItem(

            CONFIG.ADMIN_SESSION_KEY,

            String(
                result.token
            )

        );


        /*
         * บันทึกข้อมูล Admin
         */

        const adminData =
            result.admin || {

                username:
                    username

            };


        sessionStorage.setItem(

            CONFIG.ADMIN_KEY,

            JSON.stringify(
                adminData
            )

        );


        /*
         * แจ้งสำเร็จ
         */

        showAdminMessage(

            "เข้าสู่ระบบสำเร็จ กำลังเข้าสู่ Admin Dashboard...",

            "success"

        );


        /*
         * Redirect
         */

        setTimeout(

            function () {

                window.location.replace(
                    "admin-dashboard.html"
                );

            },

            500

        );


    } catch (error) {

        console.error(
            "ADMIN LOGIN ERROR:",
            error
        );


        showAdminMessage(

            getAdminErrorMessage(error),

            "error"

        );


    } finally {

        /*
         * เปิดปุ่มกลับ
         *
         * ถ้ากำลัง Redirect
         * ก็ไม่เป็นปัญหา
         */

        setTimeout(

            function () {

                button.disabled = false;


                button.textContent =
                    button.dataset.originalText ||
                    "เข้าสู่ระบบ Admin";


            },

            700

        );

    }

}


/*******************************************************
 * CALL ADMIN API
 *******************************************************/

async function callAdminAPI(payload) {

    /*
     * ตรวจ CONFIG
     */

    if (
        typeof CONFIG ===
        "undefined"
    ) {

        throw new Error(
            "ไม่พบ CONFIG กรุณาตรวจสอบ config.js"
        );

    }


    if (
        !CONFIG.API_URL
    ) {

        throw new Error(
            "ไม่พบ CONFIG.API_URL"
        );

    }


    /*
     * POST JSON
     *
     * ใช้ text/plain
     * เพื่อหลีกเลี่ยงปัญหา CORS
     * กับ Google Apps Script
     */

    const response =
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
                        payload
                    )

            }

        );


    /*
     * ตรวจ HTTP
     */

    if (
        !response.ok
    ) {

        throw new Error(

            "HTTP Error " +
            response.status

        );

    }


    /*
     * อ่าน JSON
     */

    const text =
        await response.text();


    if (!text) {

        throw new Error(
            "Server ส่งข้อมูลว่างกลับมา"
        );

    }


    let result;


    try {

        result =
            JSON.parse(text);

    } catch (error) {

        console.error(
            "INVALID JSON FROM API:",
            text
        );

        throw new Error(
            "Server ส่งข้อมูลไม่ถูกต้อง"
        );

    }


    return result;

}


/*******************************************************
 * CLEAR ADMIN SESSION
 *******************************************************/

function clearAdminSession() {

    try {

        if (
            typeof CONFIG !==
            "undefined"
        ) {

            if (
                CONFIG.ADMIN_SESSION_KEY
            ) {

                sessionStorage.removeItem(
                    CONFIG.ADMIN_SESSION_KEY
                );

            }


            if (
                CONFIG.ADMIN_KEY
            ) {

                sessionStorage.removeItem(
                    CONFIG.ADMIN_KEY
                );

            }

        }


        /*
         * ป้องกันกรณีชื่อ Key เดิม
         */

        sessionStorage.removeItem(
            "admin_session"
        );


        sessionStorage.removeItem(
            "admin_data"
        );

    } catch (error) {

        console.warn(
            "CLEAR ADMIN SESSION ERROR:",
            error
        );

    }

}


/*******************************************************
 * SHOW MESSAGE
 *******************************************************/

function showAdminMessage(
    text,
    type
) {

    const message =
        document.getElementById(
            "adminMessage"
        );


    if (!message) {

        console.warn(
            "ไม่พบ #adminMessage"
        );

        return;

    }


    message.textContent =
        String(
            text || ""
        );


    /*
     * ล้าง Class เดิม
     */

    message.className =
        "message";


    /*
     * เพิ่มประเภท
     */

    if (type) {

        message.classList.add(
            type
        );

    }

}


/*******************************************************
 * ERROR MESSAGE
 *******************************************************/

function getAdminErrorMessage(error) {

    if (!error) {

        return (
            "เกิดข้อผิดพลาดในการเข้าสู่ระบบ"
        );

    }


    const message =
        String(
            error.message || ""
        );


    if (
        message.includes(
            "Failed to fetch"
        )
    ) {

        return (
            "ไม่สามารถเชื่อมต่อ Google Apps Script ได้ กรุณาตรวจสอบ API URL และการ Deploy"
        );

    }


    if (
        message.includes(
            "NetworkError"
        )
    ) {

        return (
            "ไม่สามารถเชื่อมต่อ Server ได้"
        );

    }


    if (
        message.includes(
            "HTTP Error 404"
        )
    ) {

        return (
            "ไม่พบ API กรุณาตรวจสอบ Web App URL"
        );

    }


    if (
        message.includes(
            "HTTP Error 403"
        )
    ) {

        return (
            "ไม่มีสิทธิ์เข้าถึง API กรุณาตรวจสอบการ Deploy Web App"
        );

    }


    if (
        message.includes(
            "HTTP Error 500"
        )
    ) {

        return (
            "Server เกิดข้อผิดพลาด กรุณาตรวจสอบ Google Apps Script"
        );

    }


    return (
        message ||
        "เกิดข้อผิดพลาดในการเข้าสู่ระบบ"
    );

}


/*******************************************************
 * OPTIONAL LOGOUT HELPER
 *
 * สามารถเรียกจากหน้าอื่นได้ เช่น
 *
 * logoutAdmin();
 *******************************************************/

function logoutAdmin() {

    clearAdminSession();


    window.location.replace(
        "admin-login.html"
    );

}


/*******************************************************
 * DEBUG
 *******************************************************/

function debugAdminSession() {

    const token =
        sessionStorage.getItem(
            CONFIG.ADMIN_SESSION_KEY
        );


    const admin =
        sessionStorage.getItem(
            CONFIG.ADMIN_KEY
        );


    console.log(
        "========== ADMIN SESSION =========="
    );


    console.log(
        "Token:",
        token
    );


    console.log(
        "Admin:",
        admin
    );


    console.log(
        "==================================="
    );

}
