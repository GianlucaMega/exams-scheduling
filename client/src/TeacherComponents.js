import React from 'react'
import Navbar from 'react-bootstrap/Navbar'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Table from 'react-bootstrap/Table'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import {Redirect} from 'react-router-dom'
import Jumbotron from 'react-bootstrap/Jumbotron'
import Accordion from 'react-bootstrap/Accordion'
import Card from 'react-bootstrap/Card'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Toast from 'react-bootstrap/Toast'
import API from './API.js'
import moment from 'moment'

/*
    This is the main component of the teacher page,it always renders the students list
    and also the the form for the exam creation if the mode is set properly
*/

class HomeTeacher extends React.Component{
    constructor(props){
        super(props);
        this.state={redirect:false,newExam:false,loading:true,dataReady:false,name:"",surname:"",courseId:"-1",courseName:""};
    }

    /**
     * Closes the exam form
     */
    closeExamForm = () => this.setState({newExam:false,dataReady:false});
 
    /**
     * Logout handler
     */
    logout = ()=>{
        API.logout();
        this.setState({redirect:"logout"});
    }

    /* If data.id==-1 the teacher is not logged in, HomeTeacher uses "redirect" to render the <Redirect> to the home page
        passing also some details about the error (see render()). DataReady is used to trigger the render of the overview 
        only when data are available.
    */ 
    componentDidMount(){
        API.getTeacherData(this.props.id).then(val =>{
            let data=val; 
            this.setState({name:data.teacherName,
                            surname:data.surname,
                            courseName:data.courseName,
                            courseId:data.id,
                            loading:false,
                            dataReady:(data.id=="-1"?false:true),
                            redirect:(data.id=="-1"?"unauthorized":false)})} )
    }

    /*  Triggers the render of the <StudentList> only when courseId is a valid id
        or a component requested a data update by setting dataReady to false
    */
    componentDidUpdate(){
        if((!this.state.dataReady)&&(this.state.courseId!="-1"))
            this.setState({dataReady:true});
        }
        
    render(){
        //Redirects to the home page setting in the state an error message in case of unauthorized access (id=="-1")
        if (this.state.redirect)
            return(<Redirect to={{pathname:"/", state:{errDispl:true,err:(this.state.redirect=="unauthorized" ? "Error: you should be authenticated first!" : "")}}}/>);

        return(this.state.courseId!="-1")&&(<>

                <Nav id={this.props.id} name={this.state.name} surname={this.state.surname} logout={this.logout}/>

                <div style={{marginLeft:"1em"}}>
                    <div className="d-flex align-items-baseline"><p style={{fontSize:"25px", marginLeft:"1em",marginTop:"3.5em",marginBottom:"1em"}}>{this.state.courseId+" "+this.state.courseName} -</p>
                    {
                        (!this.state.newExam) && (
                            <Button variant="outline-info" size="sm" style={{marginLeft:"0.5em"}} onClick={ ()=>this.setState({"newExam":!this.state.newExam}) }>Create new exam</Button>
                        )
                    }
                    </div>
                    {
                        (this.state.newExam) && (
                            <NewExamForm teacherId={this.props.id} courseId={this.state.courseId} closeExamForm={this.closeExamForm}/>
                        )
                    } 
                
                    {
                        (this.state.dataReady) && (
                            <StudentList teacherId={this.props.id} name={this.state.name} surname={this.state.surname} courseName={this.state.courseName} courseId={this.state.courseId}/>
                        )
                    }

                </div>
            </>
        )
    
}
}


function Nav(props){
    return(
        <Navbar bg="dark" variant="dark" fixed="top" className="shadow">
        <Container fluid>
            <Navbar.Brand>Hello, {props.name + ' ' + props.surname}!</Navbar.Brand>
            <Button variant="outline-light" onClick={props.logout}>Logout</Button>
        </Container>
    </Navbar>
    )
}

/*
    SessionInfo contains the input elements useful to create a new session during
    the exam creation. It is created as many times as NewExamForm.state.sessions says.
    Every <input> when onChange fires saves its value into the proper field of the SessionInfo 
    state and also in the NewExamForm.state.sData array which contains all the sessions'
    info. SlotDuration is used for error check in NewExamForm    
*/
class SessionInfo extends React.Component{
    constructor(props){
        super(props);
        this.state={date:"",time:"",duration:this.props.slotDuration,slotDuration:this.props.slotDuration};
    }

    render(){
        return <>
                <div className="d-flex justify-content-between mt-2">
                    <div>
                        <label className="mt-2" htmlFor={`startDate${this.props.id}`}>Day:</label>
                        <input type="date" id={`startDate${this.props.id}`}name="date" min="1970-01-01" max="9999-12-31" required 
                            onChange={ (ev)=>{ this.updateValue(ev.target.name,ev.target.value) } }></input>
                    </div>

                    <div>
                        <label className="mt-2" htmlFor={`startTime${this.props.id}`}>Starting time:</label>
                        <input type="time" id={`startTime${this.props.id}`} name="time" min="08:00" max="21:00" required 
                            onChange={ (ev)=>{ this.updateValue(ev.target.name,ev.target.value) } }></input>
                    </div>

                    <div>
                        <label className="mt-2" htmlFor={`sessionDuration${this.props.id}`}>Session duration (in minutes):</label>
                        {/*Tooltip next to the session duration input field*/}
                        <OverlayTrigger
                            placement='right'
                            overlay={
                                <Tooltip id='tooltip'>
                                Must be a multiple of the slot duration
                                </Tooltip>
                            }
                            >
                            <input type="number" id={`sessionDuration${this.props.id}`} name="duration" defaultValue={this.props.slotDuration} min={this.props.slotDuration} required step={this.props.slotDuration} 
                            onBlur={ (ev)=>{    /*  
                                                    When a user sets a session duration that value is checked and, if not valid, updated with the next valid value
                                                    (in this case sessionDuration must be multiple of slotDuration). This check starts only when the input loses 
                                                    focus in order to avoid changing value simultaneusly with the user's input
                                                */
                                                if((Number(ev.target.value) % Number(this.props.slotDuration) )!= 0 )
                                                    ev.target.value=Number(ev.target.value)+(Number(this.props.slotDuration)-(Number(ev.target.value) % Number(this.props.slotDuration) ));
                                                this.updateValue(ev.target.name,ev.target.value);} }
                            onChange={ ev => { /*
                                                    This event updates the state only if the vaue inserted is correct 
                                                    (intercepts also the value selection made with the arrows of the input)
                                                */

                                                if((Number(ev.target.value) % Number(this.props.slotDuration) )== 0 )
                                                    this.updateValue(ev.target.name,ev.target.value);
                            }}></input>
                        
                        </OverlayTrigger>
                    </div>
                </div>
            </>
    }
    

    /**
     * Updates the corresponding state field. 
     * It also sends the session information in the NewExamForm's state
     * @param {String} name Name of the field
     * @param {*} value Value to be inserted
     */
    updateValue=(name,value)=>{

        this.setState({[name]:value});

        //Code below is needed in order to send the updated data
        let newState={
                "date" : (name==="date" ? value : this.state.date),
                "time" : (name==="time" ? value : this.state.time),
                "duration" : (name==="duration" ? value : this.state.duration),
                "slotDuration" : this.props.slotDuration
                };

        if((newState.date!=="") && (newState.time!=="") && (newState.duration!=="")){
            this.props.setSession(this.props.id,newState);
        }
        
    }
}

/*
    This is the component that renders the whole exam creation form.
    In its state are held the data retrieved from the <input> elements inside the form.
    err is used to hold errors' description when creating a new exam
*/
class NewExamForm extends React.Component{
    constructor(props){
        super(props);
        this.state={sessions:1,sData:[],slotDuration:"1", loading:true, students:[],selectedStudents:[], selStudNum:0, examDate:"", err:""};
    }

    examFormRef=React.createRef();

    componentDidMount(){
        API.getSelectableStudents(this.props.teacherId,this.props.courseId).then(d=>this.setState({students:d,loading:false}));
    }

    /**
     * Checks if all data inserted are correct. For every error saves a description
     * Returns {err,msg}, if err is true in msg is stored the error description
     */
    checkDataValidity = () => {
        //HTML native validation
        if(this.examFormRef.current.checkValidity()){
            let error=[];

            if((typeof this.state.selectedStudents[0])=='undefined')
                error.push("At least one student must be selected");
             
            for(let s of this.state.sData){
                if(s.slotDuration!=this.state.slotDuration){
                    error.push(`Slot duration changed, please check session durations (error on ${s.date} session)`)
                }

                if(moment(s.date).isBefore(this.state.examDate)){
                    error.push(`Sessions can't start before the exam date (please check ${s.date} session)`);
                }

                if(moment(s.date+" "+s.time).add(s.duration,'m').isSameOrAfter(moment(s.date+" 00:01").add(1,'d'))){
                    error.push(`Sessions must start and end in the same day (please check ${s.date} session)`);
                }
            }
            //If there were errors above it returns the details
            return ((typeof error[0])!='undefined' ? {err:true,msg:error} : {err:false,msg:""});
        } else{
            this.examFormRef.current.reportValidity();
            return {err:true,msg:["Please insert all data"]};
        } 
    }

    /**
     * Saves the exam's info in the DB after error checking
     */
    saveExam = () => {

        let checkResult=this.checkDataValidity();
        if(checkResult.err){
            this.setState({err: checkResult.msg});
            return;
        }

        let noDupl=[],sel=[];
        
        //Deleting the duplicates by saving the unique values in noDupl
        this.state.sData.forEach(
            (e) => {
                e.slots.forEach(
                    s=>{
                        if(!(noDupl.find(snd=>{return (s.date==snd.date)&&(s.duration==snd.duration)&&(s.time==snd.time)}))&&(s.date!="")&&(s.duration!="")&&(s.time!="")){
                            noDupl.push(
                                {
                                    courseId:this.props.courseId,
                                    slotDate:s.date,
                                    slotHour:s.time,
                                    duration:this.state.slotDuration,
                                    examDate:this.state.examDate
                                }
                            );
                        }    
                    }
                )
            }
        );

        //Populating the selected students array with the correctly formatted objects
        this.state.selectedStudents.forEach(
            e => sel.push(
                {
                    studId:e,
                    courseId:this.props.courseId,
                    date:this.state.examDate
                }
            )
        );

        if(noDupl.length<sel.length){
            this.setState({err: ["Not enough slots for the selected students"]});
            return;
        }
            
        API.createExam(noDupl,sel,this.props.teacherId,this.props.courseId);
        this.props.closeExamForm();
    }

    /**
     * Saves in the NewExamForm state the session's info
     * @param {*} id Id of the SessionInfo element
     * @param {*} session {date,time,duration,slotDuration} of the session
     */
    setSession=(id,session)=>{
        const newsData=this.state.sData;
        newsData[id]=session;
        newsData.forEach(
            e=>{
                let slots=[];
                let start=moment(e.date+" "+e.time);
                let numSlot=Math.trunc(Number(e.duration)/Number(this.state.slotDuration));

                //Slots creation
                for(let i=0;i<numSlot;i++){
                    slots.push({date:start.format('Y-MM-DD'),time:start.format('HH:mm'),duration:this.state.slotDuration});
                    start.add(Number(this.state.slotDuration),'m');
                }
                e.slots=slots;
            }
        );
        this.setState({sData:newsData});
    }


    /** 
     * Toggles a student in the state.selectedStudents array
     */ 
    setSelected=(id,val) =>{
        let sel2=[];
        sel2=this.state.selectedStudents;

        if(val) {
            sel2.push(id);
            this.setState( state=>{return {selStudNum:state.selStudNum+1} });
        } else{
            sel2.splice(sel2.indexOf(id),1);
            this.setState( state=>{return {selStudNum:state.selStudNum-1} });
        }

        this.setState({selectedStudents:sel2});
    };

    /**
     * Function to generate the slots number control labels in the exam form.
     * Checks for duplicates and returns the number of students selected, 
     * the number of slots created (duplicates excluded) and the difference 
     * between them. If the difference is negative also an error message is provided.
     * All is returned in a React fragment. 
     */
    checkNumSlots = () =>{
        let numSlots=0;
        let noDupl=[];
        
        this.state.sData.forEach(
            (e) => {
                e.slots.forEach(
                    s=>{
                        if(!(noDupl.find(snd=>{return (s.date==snd.date)&&(s.duration==snd.duration)&&(s.time==snd.time)}))&&(s.date!="")&&(s.duration!="")&&(s.time!="")){
                            noDupl.push(s);
                        }    
                    }
                )
            }
        );
        numSlots=noDupl.length;
        return <>
                <p>{`Selected students: ${this.state.selStudNum}`}<br/>{`Number of slots: ${numSlots}`}<br/>{"Delta (slots-number of selected students): "}{(numSlots-this.state.selStudNum<0 ? <span style={{color:"red"}}>{numSlots-this.state.selStudNum}</span> : <span>{numSlots-this.state.selStudNum}</span>)}</p>
                {(numSlots<this.state.selStudNum ? <small style={{color:"red"}}>Error:not enough slots defined! Please increase sessions' duration or define more sessions</small> : "")}
                </>
    }

    /**
     * Removes a session from the session state array by popping its 
     * entry and decrementing the sessions counter (if greater than one). 
     */
    removeSession = () =>{
        if(this.state.sessions-1 > 0) {
            //If the session isn't present in the array only state.sessions is modified
            if(this.state.sessions==this.state.sData.length){
                let newSData=this.state.sData;
                newSData.pop();
                this.setState({sData:newSData, sessions:this.state.sessions-1});
            }
            else  
                this.setState({sessions:this.state.sessions-1});
        }
    }


    render(){
    
        let sessionItems=[];
        for(let i=0;i<this.state.sessions;i++){
            sessionItems.push(<SessionInfo key={"session"+i} id={i} setSession={this.setSession} slotDuration={this.state.slotDuration}/>);
        }

        
        return (<>
            {(this.state.err!="")&&(
                <Toast animation={true} onClose={()=>this.setState({err:""})} style={{position:"fixed",zIndex:"1", backgroundColor:"white"}}>
                    <Toast.Header>
                        <strong className="mr-auto">Error!</strong>
                    </Toast.Header>
                    <Toast.Body>{this.state.err.map((s,i) => <div key={`div${i}`}><p>{s}</p><br/><br/></div>)}</Toast.Body>
                </Toast>)}

            <Jumbotron style={{marginLeft:"1em"}}>
                <h5 className="mb-3">Create new exam</h5>
                <form className="d-flex flex-column justify-content-between" ref={this.examFormRef}>

                <Accordion>
                    <Card>
                        <Accordion.Toggle as={Card.Header}  eventKey="0">
                            <Accordion.Toggle as={Button} variant="link" eventKey="0">Select students</Accordion.Toggle>
                        </Accordion.Toggle>
                        <Accordion.Collapse eventKey="0">
                        <Card.Body>
                            {
                                this.state.students.map(
                                    (s)=> <div key={s.id+"div"}>
                                        <input type="checkbox" name={s.id} id={s.id} onChange={ (ev)=>this.setSelected(ev.target.name,ev.target.checked) }></input>
                                        <label htmlFor={s.id} className="ml-2">{s.id + " " + s.name + " " + s.surname}</label>
                                        </div> 
                                )
                            }
                        </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                </Accordion>

                
                
                
                <div className="mt-4 mb-4 d-flex flex-start">
                
                <div>
                    <label htmlFor="slotDuration">Slot duration (in minutes):</label>
                    <input className="ml-2" type="number" id="slotDuration" name="slotDuration" defaultValue="1" min="1" max="1440" required onChange={ (ev)=>this.setState({[ev.target.name]:ev.target.value}) }></input>
                
                    {this.checkNumSlots()}
                
                </div>
                    
                <div className="ml-5">
                    <input className="ml-2 float-right" type="date" id="examDate" name="examDate" min="1970-01-01" max="9999-12-31" required onChange={ (ev)=>this.setState({[ev.target.name]:ev.target.value}) }></input>
                    <label className="mt-1 float-right" htmlFor="examDate">Date of the exam:</label>
                </div>
                
                </div>

                {sessionItems}

                <div className="mt-4">
                    <Button variant="outline-success" onClick={ ()=>this.setState({"sessions":this.state.sessions+1}) }>+</Button>   
                    <Button variant="outline-danger" onClick={this.removeSession} style={{marginLeft:"1em"}}>-</Button>
                </div>

                <div className="d-flex justify-content-between mt-5">
                    <Button variant="outline-info" onClick={this.saveExam}>Save</Button> 
                    <Button variant="outline-secondary" onClick={ ()=> { this.setState({sessions:1,sData:[],slotDuration:0, loading:true, students:[],selStudNum:0}); this.props.closeExamForm();}}>Cancel</Button>  
                </div> 
                </form>
            </Jumbotron>
        </>
        )
        
    }
}

/**
 * Renders the table with the details about every selected student
 */
class StudentList extends React.Component{

    constructor(props){
        super(props);
        this.state={loading:true,slots:[]};
    }

    componentDidMount(){
        API.getResultsOverview(this.props.teacherId,this.props.courseId).then(d=>this.setState({slots:d}));
    }

    updateList = () =>{
        API.getResultsOverview(this.props.teacherId,this.props.courseId).then(d=>this.setState({slots:d}));
    }

    render(){

        return(
                <Table borderless hover size="sm" style={{marginLeft:"3em"}} >
                                <thead>
                                    <tr>
                                        <th>Id</th>
                                        <th>Student</th>
                                        <th>Date and time</th>
                                    </tr>
                                </thead>

                                {
                                    this.state.slots.map(
                                        (s)=><tbody key={s.date+s.studId+"tbody"}>
                                                <ListItem slot={s} updateList={this.updateList} teacherId={this.props.teacherId} courseId={this.props.courseId}/>
                                            </tbody>
                                    )
                                }
                                
                            </Table>
        )
    }
}

/**
 * Single entry of the StudentList.
 * If mark is null the take exam button is showed.
 */
class ListItem extends React.Component{
    constructor(props){
        super(props);
        this.state={saveMark:false,abs:"",mark:"Fail"};
    }

    render(){
        return (
            <tr>
                <td className="pt-2">{this.props.slot.studId}</td>
                
                <td className="pt-2">{this.props.slot.name + " " + this.props.slot.surname}</td>
                
                <td className="pt-2">{(this.props.slot.slotDate ? this.props.slot.slotDate : "") + " " + (this.props.slot.slotHour ? this.props.slot.slotHour : "")}</td>
                
                {(!this.props.slot.mark)&&(this.props.slot.slotDate)&&(<td>{(this.state.saveMark ? <MarkForm takeExam={this.takeExam} changeValue={this.changeValue}/> : <Button size="sm" variant="outline-info" onClick={ ()=>this.setState({saveMark:!this.state.saveMark}) }>Take exam</Button>)}</td>)}
                
                {(this.props.slot.mark) && (<td className="pt-2">{this.props.slot.mark}</td>)}
                
                {(!this.props.slot.mark)&&(!this.props.slot.slotDate)&&(<td className="pt-2" style={{color:"grey"}}>Missing</td>)}</tr>
        )
    }

    /**
     * Saves the mark assigned by calling the proper API and hides the MarkForm.
     * Fires also a refresh of the overview.
     */
    takeExam = () =>{
        API.takeExam( 
            {
                mark: (this.state.abs ? "absent" : this.state.mark), 
                slotDate:this.props.slot.slotDate, 
                slotHour:this.props.slot.slotHour, 
                studId: this.props.slot.studId
            },
                this.props.teacherId,
                this.props.courseId);

        this.setState({saveMark:false});
        this.props.updateList();
    }

    changeValue=(name,value)=>this.setState({[name]:value});

}

/**
 * Little form for exam valutation input
 */
class MarkForm extends React.Component{
    constructor(props){
        super(props);
        this.state={abs:false};
    }
    render(){return ( 
                    <Form>
                        <Form.Row>
                        <Col>  
                        <Form.Check className="pt-1" name="abs" id="abs" inline type="checkbox" onChange={ (ev) => { this.setState({"abs":!this.state.abs}); this.props.changeValue(ev.target.name,ev.target.checked); }} />
                        <label className="pt-1" htmlFor="abs">Absent</label>
                        </Col>

                        {(!this.state.abs) && (<Col><Form.Control size="sm" as="select" name="mark" onChange={ (ev)=>{this.props.changeValue(ev.target.name,ev.target.value);} }>
                                                    <option value="Fail">Fail</option>
                                                    <option value="Withdraw">Withdraw</option>
                                                    <option value="18">18</option>
                                                    <option value="19">19</option>
                                                    <option value="20">20</option>
                                                    <option value="21">21</option>
                                                    <option value="22">22</option>
                                                    <option value="23">23</option>
                                                    <option value="24">24</option>
                                                    <option value="25">25</option>
                                                    <option value="26">26</option>
                                                    <option value="27">27</option>
                                                    <option value="28">28</option>
                                                    <option value="29">29</option>
                                                    <option value="30">30</option>
                                                    <option value="30L">30L</option>
                                                </Form.Control></Col>)}

                        <Col><Button size="sm" variant="outline-info" onClick={this.props.takeExam}>Save</Button>

                        <Button className="ml-2" size="sm" variant="outline-secondary" onClick={ ()=>{this.props.changeValue("saveMark",false); this.props.changeValue("abs",""); this.props.changeValue("mark","");}}>Cancel</Button></Col>
                        </Form.Row>
                    </Form>)
    }


}

export {HomeTeacher,Nav};