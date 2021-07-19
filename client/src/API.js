const APIURL = 'http://localhost:3000/api';

/**
 * Retrieves student's data
 * @param {String} id Id of the requested student 
 * @returns {Object} Object with {id, name, surname} on success
 */
async function getStudentData(id){
    const res = await fetch(`${APIURL}/students/${id}`);
    if(res.status==404)
        return {id:"-1",name:"",surname:""};
    const val = await res.json();
    return val;
}

/**
 * Retrieves all the exams already done or booked by a student
 * @param {String} id Id of the requested student 
 * @returns {Array} Array of {id, slotDate, slotHour, mark, name} objects on success
 */
async function getStudentExams(id){
    const res = await fetch(`${APIURL}/students/${id}/exams`);
    const val = await res.json();
    return val;
}

/**
 * Retrieves all the slots that a student can book
 * @param {String} id Id of the requested student 
 * @returns {Array} Array of {id, name, slotDate, slotHour, duration, examDate} objects on success
 */
async function getAvailableSlots(id){
    const res = await fetch(`${APIURL}/students/${id}/slots`);
    const val = await res.json();
    return val;   
}

/**
 * Book a slot by passing slot info 
 * @param {String} id Id of the student
 * @param {Object} slot {studId, courseId, slotDate, slotHour} 
 * @returns {String} String with '200' on success
 */
async function bookSlot(id,slot){
    const res = await fetch( `${APIURL}/students/${id}/slots`,{
        method: 'put',
        headers: {
            'Content-Type': 'application/json'
          },
        body: JSON.stringify(slot)
    });
    const val = await res.json();
    return val;
}

/**
 * Delete a slot reservation by passing slot info 
 * @param {String} id Id of the student
 * @param {Object} slot {studId, courseId, slotDate, slotHour} 
 * @returns {String} String with '200' on success
 */
async function unbookSlot(id,slot){
    slot.studId=null;
    const res = await fetch( `${APIURL}/students/${id}/slots`,{
        method: 'put',
        headers: {
            'Content-Type': 'application/json'
          },
        body: JSON.stringify(slot)
    });
    const val = await res.json();
    return val;
}

/**
 * Retrieves teacher's name and surname and the associated course's info
 * @param {String} id Id of the requested teacher 
 * @returns {Object} Object with {teacherName, surname, id, courseName} on success 
 * or object with id=-1 when rejected
 */
async function getTeacherData(id){
    const res = await fetch(`${APIURL}/teachers/${id}`);
    if(res.status==401)
        return {teacherName:"",surname:"",id:"-1",courseName:""}
    const val = await res.json();
    return val;   
}

/**
 * Retrieves the list of all the selected students of the teacher searched with the booked slot's info if booked
 * @param {String} teacherId Id of the requested teacher 
 * @param {String} courseId Id of the course searched
 * @returns {Array} Array of {studId, name, surname, slotDate, slotHour, mark, Date} objects on success
 */
async function getResultsOverview(teacherId,courseId){
    const res = await fetch(`${APIURL}/teachers/${teacherId}/courses/${courseId}/overview`);
    const val = await res.json();
    return val;   
}

/**
 * Retrieves the list of the selectable students (exam not already passed) for the exam associated to the teacher searched 
 * @param {String} teacherId Id of the requested teacher 
 * @param {String} courseId Id of the course searched
 * @returns {Array} Array of {id, name, surname} objects on success
 */
async function getSelectableStudents(teacherId,courseId){
    const res = await fetch(`${APIURL}/teachers/${teacherId}/courses/${courseId}/selectables`);
    const val = await res.json();
    return val;   
}

/**
 * Saves all the exam information
 * @param {Array} slots Array with {courseId, slotDate, slotHour, duration, examDate} objects
 * @param {Array} selStud Array with {studId, courseId, date} objects
 * @param {String} teacherId  Id of the requested teacher
 * @param {String} courseId Id of the course searched
 * @returns {String} String with '200' on success
 */
async function createExam(slots,selStud,teacherId,courseId){
    const res = await fetch(`${APIURL}/teachers/${teacherId}/courses/${courseId}/slots`,{
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
            },
        body: JSON.stringify({
            'slots': slots,
            'selStud': selStud
            })
    });
    const val = await res.json();
    return val;
}

/**
 * Saves a mark for a specified slot
 * @param {Object} exam {studId, courseId, mark, slotDate, slotHour} 
 * @param {String} teacherId  Id of the requested teacher
 * @param {String} courseId Id of the course searched
 * @returns {String} String with '200' on success
 */
async function takeExam(exam,teacherId,courseId){
    exam.courseId=courseId;
    const res = await fetch(`${APIURL}/teachers/${teacherId}/courses/${courseId}/slots`,{
        method: 'put',
        headers: {
            'Content-Type': 'application/json'
          },
        body: JSON.stringify(exam)
    });
    const val = await res.json();
    return val;
}

/**
 * Tries to log in a user
 * @param {String} clUser Username
 * @param {String} clPassw PAssword
 * @returns {String} "Login success" on success or an error message
 */
async function login(clUser,clPassw){
    const res = await fetch(`${APIURL}/login`,{
        method:'post',
        headers :{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username:clUser,password:clPassw})
    });
    const val = await res.json();
    return val;
}

/**
 * Tries to log in a student
 * @param {*} id Id of the student
 * @returns {String} "Login success" on success or an error message
 */
async function studentLogin(id){
    const res = await fetch(`${APIURL}/students/${id}`);
    if(res.status==404)
        return{id:"-1",name:"",surname:""}
    else return "200";
}

/**
 * Logs out the user
 */
async function logout(){
    const res = await fetch(`${APIURL}/logout`,{
        method:'post',
    });
    const val = await res.json();
    return val;
}

export default {getStudentData,getStudentExams,getAvailableSlots,bookSlot,unbookSlot,getTeacherData,getResultsOverview,getSelectableStudents,createExam,takeExam,login,logout,studentLogin}