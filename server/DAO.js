'use strict';

const sqlite = require('sqlite3');

const db =  new sqlite.Database("./scheduling.sqlite", err => {if (err) {console.log("Error occurred in connecting to the database..."); throw err;}});

/**
 * Retrieves id and password of the requested teacher
 * @param {String} id Id of the requested teacher 
 * @returns {Promise} Promise with {id, password} when fulfilled or 'Database error' when rejected
 */
exports.getLoginData = function (id) {
    return new Promise((res,rej) => {
        const sql='SELECT id,password FROM Teacher WHERE id=?';
        db.get(sql,[id], (err,row)=>{
            if(err) {
                rej("Database error");
                return;
            }
            res(row);
        } );
    });
};

/**
 * Retrieves teacher's name and surname and the associated course's info
 * @param {String} id Id of the requested teacher 
 * @returns {Promise} Promise with {teacherName, surname, id, courseName} when fulfilled or 'Database error' when rejected
 */
exports.getTeacherData = function(id){
    return new Promise((res,rej) => {
        const sql='SELECT Teacher.name as teacherName,surname,Course.id,Course.name as courseName FROM Teacher,Course WHERE (Teacher.id=? AND Teacher.id=Course.teacherId)';
        db.get(sql,[id], (err,row)=>{
            if(err) {
                rej("Database error");
                return;
            }
            res(row);
        } );
    });
};

/**
 * Retrieves student's data
 * @param {String} id Id of the requested student 
 * @returns {Promise} Promise with {id, name, surname} when fulfilled or 'Database error' when rejected
 */
exports.getStudentData = function(id){
    return new Promise(
        (res,rej) => {
            const sql='SELECT * FROM Student WHERE id=?';
            db.get(sql,[id], (err,row)=>{
                if(err) {
                    rej("Database error");
                    return;
                }
                res(row);
            });
        }
    );
}

/**
 * Retrieves all the exams already done or booked by a student
 * @param {String} id Id of the requested student 
 * @returns {Promise} Promise with array of {id, slotDate, slotHour, mark, name} when fulfilled or 'Database error' when rejected
 */
exports.getStudentExams = function(id){
    return new Promise(
        (res,rej) => {
            const sql='select Course.id,slotDate,slotHour,mark,name FROM Course,Slot WHERE (Course.id=Slot.courseId AND studId=?)';
            db.all(sql,[id],(err,rows)=>{
                if(err) {
                    rej("Database error");
                    return;
                }
                res(rows);
            });
        }
    );
}

/*It returns all the available slots for a student, included the calls for which the student was absent 
or has failed/withdrawn the exam (these values are filtered in server.js with the getSlotsFilterData api call)*/

/**
 * Retrieves all the slots that a student can book
 * @param {String} id Id of the requested student 
 * @returns {Promise} Promise with {id, name, slotDate, slotHour, duration, examDate} when fulfilled or 'Database error' when rejected
 */
exports.getAvailableSlots=function(id){
    return new Promise(
        (res,rej) => {
            const sql="SELECT Slot.courseId as id,name,slotDate,slotHour,duration,examDate FROM Slot,Course,(SELECT SelectedStudent.courseId,SelectedStudent.date FROM SelectedStudent,(SELECT courseId from Enrollment where passed=0 and studId=?) as NotPassed WHERE SelectedStudent.courseId=NotPassed.courseId and studId=?) as AvailableSlot WHERE Slot.courseId=AvailableSlot.courseId AND Slot.examDate=AvailableSlot.date and Slot.studId is null AND Slot.courseId=Course.id";
            db.all(sql,[id,id],(err,rows)=>{
                if(err) {
                    rej("Database error");
                    return;
                }
                res(rows);
            });
        }
    );
}

/*This api returns all the (courseId,examDate) tuples of the already passed/failed/withdrew/not attended exams.
These tuples will be used by the server to delete from the available slots list those for that the student has 
already a result (mark/fail/withdraw/absent) */

/**
 * Used to filter the result of the getAvailableSlots
 * @param {String} id Id of the requested student 
 * @returns {Promise} Promise with {courseId, examDate} when fulfilled or 'Database error' when rejected
 */
exports.getSlotsFilterData = function(id){
    return new Promise(
        (res,rej) => {
            const sql="SELECT courseId,examDate FROM Slot WHERE studId=?";
            db.all(sql,[id],(err,rows)=>{
                if(err) {
                    rej("Database error");
                    return;
                }
                res(rows);
            });
        }
    );
}

/**
 * Retrieves the list of all the selected students of the teacher searched with the booked slot's info if booked
 * @param {String} id Id of the requested teacher 
 * @returns {Promise} Promise with array of {studId, name, surname, slotDate, slotHour, mark, Date} when fulfilled or 'Database error' when rejected
 */
exports.getResultsOverview = function(id){
    return new Promise(
        (res,rej) => {
            const sql='SELECT Selected.studId,name,surname,slotDate,slotHour,mark,Date FROM (SELECT studId,name,surname,date FROM SelectedStudent,Student WHERE courseId=? AND SelectedStudent.studId=Student.id) as Selected LEFT JOIN Slot ON (Selected.studId=Slot.studId AND Slot.examDate=Selected.date)';
            db.all(sql,[id], (err,rows)=>{
                if(err) {
                    rej("Database error");
                    return;
                }
                res(rows);
            });
        }
    );  
}

/**
 * Retrieves the list of the selectable students (exam not already passed) for the exam associated to the teacher searched 
 * @param {String} id Id of the requested teacher 
 * @returns {Promise} Promise with array of {id, name, surname} when fulfilled or 'Database error' when rejected
 */
exports.getSelectableStudents = function(id){
    return new Promise(
        (res,rej)=>{
            const sql='SELECT Student.id,name,surname FROM Enrollment,Student WHERE Enrollment.studId=Student.id AND Enrollment.passed=0 and Enrollment.courseId=?';
            db.all(sql,[id], (err,rows)=>{
                if(err) {
                    rej("Database error");
                    return;
                }
                res(rows);
            });
        }
    );
}

/**
 * Book a slot by passing slot info
 * @param {Object} slot {studId, courseId, slotDate, slotHour} 
 * @returns {Promise} Promise with '200' when fulfilled or 'Database error' when rejected
 */
exports.bookSlot = function(slot){
    return new Promise(
        (res,rej)=>{
            const sql='UPDATE Slot SET studId=? WHERE courseId=? AND slotDate=? AND slotHour=?';
            db.run(sql,[slot.studId,slot.courseId,slot.slotDate,slot.slotHour], (err)=>{
                if(err) {
                    rej("Database error");
                    return;
                }
                res("200");
            });
        }
    );
}

/**
 * Create a slot by passing a slot object
 * @param {Object} slot {courseId, slotDate, slotHour, duration, examDate} 
 * @returns {Promise} Promise with '200' when fulfilled or 'Database error' when rejected
 */
exports.createSlot = function(slot){
    return new Promise(
        (res,rej)=>{
            const sql='INSERT INTO Slot ("courseId", "slotDate", "slotHour", "duration", "studId", "mark", "examDate") VALUES (?, ?, ?, ?, ?, ?, ?);';
            db.run(sql,[slot.courseId,slot.slotDate,slot.slotHour,slot.duration,null,null,slot.examDate], (err)=>{
                if(err) {
                    rej("Database error");
                    return;
                }
                res("200");
            });
        }
    );
}

/**
 * Includes a student in the selected ones for a specific exam
 * @param {Object} record {studId, courseId, date} 
 * @returns {Promise} Promise with '200' when fulfilled or 'Database error' when rejected
 */
exports.selectStudent = function(record){
    return new Promise(
        (res,rej)=>{
            const sql='INSERT INTO SelectedStudent ("studId", "courseId", "date") VALUES (?, ?, ?);';
            db.run(sql,[record.studId,record.courseId,record.date], (err)=>{
                if(err) {
                    rej("Database error");
                    return;
                }
                res("200");
            });
        }
    );
}

/**
 * Saves a mark for a specified slot
 * @param {Object} exam {studId, courseId, mark, slotDate, slotHour} 
 * @returns {Promise} Promise with '200' when fulfilled or 'Database error' when rejected
 */
exports.takeExam = function(exam){
    return new Promise(
        (res,rej)=>{
            const sql='UPDATE Slot SET mark=? WHERE courseId=? AND slotDate=? AND slotHour=? AND studId=?';
            db.run(sql,[exam.mark,exam.courseId,exam.slotDate,exam.slotHour,exam.studId], (err)=>{
                if(err) {
                    rej("Database error");
                    return;
                }
                res("200");
            });
        }
    );
}

/**
 * Sets the exam passed for a specified student
 * @param {String} courseId
 * @param {String} studId
 * @returns {Promise} Promise with '200' when fulfilled or 'Database error' when rejected
 */
exports.setPassed = function(courseId,studId){
    return new Promise(
        (res,rej)=>{
            const sql='UPDATE Enrollment SET passed=1 WHERE courseId=? AND studId=?';
            db.run(sql,[courseId,studId], (err)=>{
                if(err) {
                    rej("Database error");
                    return;
                }
                res("200");
            });
        }
    );
}