const express = require('express');
const morgan = require('morgan')
const PORT = 3001;
const BASEURI = '/api';
const dao = require('./DAO.js');
const jwt = require('express-jwt');
const jsonwebtoken = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const moment = require('moment');

const jwtSecret = 'HqS80xSwQu7TRzQKXYCgfHHCDKY3UsNSXirCCmDkisSrlyohXaO6ZqediauF5DIR';
const expireTime = 1800; //sec

app = new express();

app.use(cookieParser());
app.use(express.json());
app.use(morgan('tiny'));

/**
 * Login endpoint
 * Username and password are received via the request body and are used to determine whether the user 
 * doesn't exist at all, the password is incorrect, there was a database error or the data are correct.
 * If so, a jwt token is created and sent in the response object in the 'token' cookie 
 */
app.post( BASEURI + '/login', (req,res) => {
    const usern=req.body.username;
    const passw=req.body.password;
    dao.getLoginData(usern).then( userData =>{
        if(userData){
            if(bcrypt.compareSync(passw,userData.password)){ //Correct password
                const token = jsonwebtoken.sign({user:userData.id},jwtSecret,{expiresIn:expireTime});
                res.cookie('token',token,{ httpOnly: true, sameSite: true, maxAge: 1000*expireTime}).status(200).json({status:200,msg:"Login success!"});
            } else {    //Wrong password
                new Promise((resolve) => {setTimeout(resolve, 3000)}).then(() => res.status(401).json({status:401,msg:"Login error: wrong password!"}));
            }
        } else {
            res.status(404).json({status:404,msg:"Login error: user not found!"});
        }
    }).catch(err => res.status(400).json(err))
})

/**
 * Retrieves all the student's information (id, name, surname)
 */
app.get( BASEURI + '/students/:id', (req,res) => {
    dao.getStudentData(req.params.id)
        .then(data => {
            if(data)
                res.status(200).json(data)
            else
                res.status(404).json("Student not found!");
        })
        .catch(err => res.status(400).json(err));
}
)

/**
 * Retrieves the student's exams information (id, slotDate, slotHour, mark, name)
 */
app.get( BASEURI + '/students/:id/exams', (req,res) => {
    dao.getStudentExams(req.params.id)
        .then(data => res.status(200).json(data))
        .catch(err => res.status(400).json(err));
}
)

/**
 * Retrieves all the available slots for a student included those relative to
 * calls already booked, failed or not attended. These slots are filtered with
 * a list of unbookable calls' info (courseId,examDate)
 */
app.get( BASEURI + '/students/:id/slots', async (req,res) => {
    let all= await dao.getAvailableSlots(req.params.id);
    if(all=="Database error")
        res.status(400).json(all);

    let filt=await dao.getSlotsFilterData(req.params.id);
    if(filt=="Database error")
        res.status(400).json(filt);
    
    /*  if 'filt' is not empty 'all' must be filtered...
        all the entries of 'all' with the same courseId and examDate
        must not be included in the list of available slots because 
        'fit' contains courseId and examDate of the calls that a student 
        has already booked/failed/withdrew 
    */ 
    if(filt){
        let final=[];
        for(let a of all){
            let found=false;

            for(let f of filt){
                if((a.id==f.courseId)&&(a.examDate==f.examDate))
                    found=true;
            }
            
            if(!found){
                final.push(a);
            }
        }
        res.status(200).json(final);
    }
    else res.status(200).json(all);
}
)

/**
 * Books the selected slot for the student that sent the request
 */
app.put( BASEURI + '/students/:id/slots', (req,res) => {
    const slot = req.body;
    if((slot) && (moment(slot.slotDate).isValid()) && (moment(slot.slotHour,'HH:mm').isValid()) )
        dao.bookSlot(slot)
            .then(data => res.status(200).json(data))
            .catch(err => res.status(400).json(err));
    //Validation failed
    res.status(400).json('Bad request')
}
)

/** 
 * Middleware for cookie parsing
 */
app.use(cookieParser());

/**
 * Clears the cookie and sends a 200 OK packet. The client will delete the cookie in its local storage
 */
app.post( BASEURI + '/logout', (req, res) => {
    res.clearCookie('token').status(200).json("Logout success");
});

/**
 *  Middleware for JWT tokens validation 
 */ 
app.use(
    jwt({
      secret: jwtSecret,
      getToken: req => req.cookies.token,
      algorithms: ['HS256']
    })
  );
  
/** 
 * Custom middleware for better error check
 */
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      res.status(401).json("Authorization error");
    }
  });

/**
 * Retrieves teacher's information (teacherName, surname, id, courseName)
 */
app.get( BASEURI + '/teachers/:id', (req,res) => {
    if(req.user.user==req.params.id)
        dao.getTeacherData(req.params.id)
            .then(data => res.status(200).json(data))
            .catch(err => res.status(400).json(err));
    else res.status(401).json("Authentication error: not authorized");
}
)

/**
 * Retrieves teacher's created slots information (studId, name, surname, slotDate, slotHour, mark, Date)
 */
app.get( BASEURI + '/teachers/:id/courses/:course/overview', (req,res) => {
    dao.getResultsOverview(req.params.course)
        .then(data => res.status(200).json(data))
        .catch(err => res.status(400).json(err));
}
)

/**
 * Retrieves the list of the selectable students for that course (id, name, surname)
 */
app.get( BASEURI + '/teachers/:id/courses/:course/selectables', (req,res) => {
    dao.getSelectableStudents(req.params.course)
        .then(data => res.status(200).json(data))
        .catch(err => res.status(400).json(err));
}
)

/**
 * Saves in the DB the new slots and the seleced students for the call
 * pastErr is used for better error handling
 */
app.post( BASEURI + '/teachers/:id/courses/:course/slots',(req,res)=>{
    const slots=req.body.slots;
    const selStud=req.body.selStud;

    if(!(slots && selStud))
        res.status(400).json('Bad request');

    slots.map(e => { 
        if( (moment(e.slotDate).isValid()) && (moment(e.slotHour,'HH:mm').isValid()) && (moment(e.slotDate).isSameOrAfter(e.examDate)) )
        dao.createSlot(e);
    });
    selStud.map(e => {
        if(moment(e.date).isValid())
         dao.selectStudent(e);
    });

    let pastErr=false;

    Promise.all(slots)
        .then(daores => res.status(200))
        .catch(e => pastErr=true);
    Promise.all(selStud)
        .then(daores => {if(pastErr) res.status(400).json('Database error'); else res.json('200 OK')})
        .catch(e => res.status(400).json('Database error'));

})

/**
 * Saves a mark for an exam (received in the request body). If the exam is passed sets the 
 * corresponding flag in the database.
 */
app.put( BASEURI + '/teachers/:id/courses/:course/slots', (req,res)=>{
    const exam=req.body;
    let pastErr=false;

    exam.courseId=req.params.course;
    if( (moment(exam.slotDate).isValid()) && 
        (moment(exam.slotHour,'HH:mm').isValid()) && 
        ( (exam.mark=="absent") || (exam.mark=="Fail") || (exam.mark=="Withdraw") || (exam.mark=="30L") || ((Number(exam.mark)<=30) && (Number(exam.mark)>=18)) )){
            dao.takeExam(exam).then(code => res.status(200)).catch(err=>pastErr=true);
        }

    if(exam.mark!="absent" && exam.mark!="withdraw" && exam.mark!="fail") //exam passed
        dao.setPassed(req.params.course,exam.studId)
            .then(code =>  {if(pastErr) res.status(400).send(); else res.send()})
            .catch(err=>res.status(400).send());

    else //exam not passed, must send proper response based upon pastErr
        if(pastErr)
            res.status(400).send();
        else
            res.status(200).send();
})

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));