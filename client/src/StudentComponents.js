import React from 'react'
import {Nav} from './TeacherComponents.js'
import Accordion from 'react-bootstrap/Accordion'
import Card from 'react-bootstrap/Card'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import API from './API.js'
import {Redirect} from 'react-router-dom'
import Tooltip from 'react-bootstrap/Tooltip'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'

/**
 * Main component of the student's page, renders the navbar and 
 * alternatively the exam book view and the slots overview.
 */
class HomeStudent extends React.Component{
    constructor(props){
        super(props);
        this.state={mode:"view",loading:true, id:"-1", name:"", surname:"",redirect:false};
    }

    componentDidMount(){
        API.getStudentData(this.props.id)
            .then(data=>this.setState({
                                        id:data.id,
                                        name:data.name,
                                        surname:data.surname,
                                        loading:false,
                                        redirect:(data.id=="-1"?"notfound":false)}))
    }

    render(){
        //err sends an error message to the home page 
        if(this.state.redirect)
            return <Redirect to={{pathname:"/", state:{errDispl:true,err:(this.state.redirect=="notfound" ? "Error: you should be authenticated first!" : "")}}}/>
        
        return (this.state.id!="-1")&&(<>
            
            <Nav id={this.props.id} name={this.state.name} surname={this.state.surname} logout={()=>this.setState({redirect:"logout"})}/>
            
            <Container style={{marginTop:"5em"}}>
                
                {(this.state.mode==="view") && (<>
                    <div className="d-flex align-items-baseline">
                        <p style={{fontSize:"25px",marginBottom:"1em"}}>Booked exams - </p>
                        <Button variant="outline-info" size="sm" onClick={()=>this.setState({mode:"exam"})} style={{marginLeft:"0.5em"}} >Book an exam!</Button>
                    </div>

                    <ExamsView id={this.props.id}/>
                    </>)
                }

                {(this.state.mode==="exam") && (<>
                    <div className="d-flex align-items-baseline">
                        <p style={{fontSize:"25px",marginBottom:"1em"}}>Available exams - </p>
                        <Button variant="outline-info" size="sm" onClick={()=>this.setState({mode:"view"})} style={{marginLeft:"0.5em"}} >View your booked exams</Button>
                    </div>
                    
                    <ExamsBook id={this.props.id}/>
                    </>)
                }

            </Container>
            </>
        )
    }
}


class ExamsBook extends React.Component{
    constructor(props){
        super(props);
        this.state= {courses:[],loading:true};
    }

    /**
     * Updates the list of slots by formatting them properly for the render phase 
     * @param {*} data List of available slots received from API
     */
    updateCourses = (data)=>{
        let newCourses=new Map();

        /*  
            Creates a map with id+examDate as keys and objects with
            id, name, examDate and an array of slots as values (one per course)
        */
        data.forEach(
            e=>{
                newCourses.set(e.id+e.examDate,{
                    id:e.id,
                    name:e.name,
                    examDate:e.examDate,
                    slots:(newCourses.get(e.id+e.examDate) ? newCourses.get(e.id+e.examDate).slots : [])
                });

                newCourses.get(e.id+e.examDate).slots.push({
                    date:e.slotDate,
                    hour:e.slotHour,
                    duration:e.duration
                });
            }
        );
        let nc=Array.from(newCourses.values());

        this.setState({courses:nc,loading:false});
    }

    componentDidMount(){
        API.getAvailableSlots(this.props.id).then(data=>this.updateCourses(data));
    }

    /* 
        For every course it renders the accordion header with the info about the course
        and the accordion body with the list of slots.
    */
    render(){
        return (
            <> {
                this.state.courses.map(
                    c=><Accordion key={`${c.id+c.examDate}Accordion`}>
                        <Card>
                            <Accordion.Toggle as={Card.Header}  eventKey="0">
                                <Accordion.Toggle as={Button} style={{color:"#17a2b8"}} variant="link" eventKey="0" > <div className="d-flex flex-column align-items-start"><p style={{marginBottom:"1px"}}>{`${c.id} - ${c.name} `}</p><p className="ml-5 mb-0">{` Exam date: ${c.examDate}`}</p></div></Accordion.Toggle>
                            </Accordion.Toggle>
                            <Accordion.Collapse eventKey="0">
                            <Card.Body>
                                {   
                                c.slots.map(
                                    s=><div className="d-flex justify-content-between align-items-baseline" key={`${s.date+s.hour}SlotDiv`}> 
                                    <p>{`${s.date} - ${s.hour}`}</p><p>{`Duration: ${s.duration} min`}</p>
                                    
                                    {/*Tooltip over booking button*/}
                                    <OverlayTrigger
                                        placement='right'
                                        overlay={
                                            <Tooltip id='tooltip'>
                                            Book now!
                                            </Tooltip>
                                        }
                                        >
                                        <button onClick={()=>{API.bookSlot(this.props.id,{studId:this.props.id,courseId:c.id,slotDate:s.date,slotHour:s.hour}); API.getAvailableSlots(this.props.id).then(data=>this.updateCourses(data)); }} style={{fontSize:"25px",border:0,color:"green",fontStyle:"bold",backgroundColor:"white"}}>
                                        <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-pencil-square" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456l-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                                        <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                                        </svg>
                                        </button>
                                    
                                    </OverlayTrigger>

                                    
                                    </div>
                                )
                                }
                            </Card.Body>
                            </Accordion.Collapse>
                        </Card>
                    </Accordion>
                )
            }</>
        )
    }
}


/**
 * This component renders the list of the already booked/failed/passed/withdrew slots.
 */
class ExamsView extends React.Component{
    constructor(props){
        super(props);
        this.state={exams:[],loading:true}
        
    }
    /**
     * Updates the list of slots by formatting them properly for the render phase 
     * @param {*} data List of slots received from the API
     */
    updateExams = (data)=>{
         /*  
            Creates a map with id as keys and objects with
            id, name and an array of attempts as values (one per course)
        */
        let newExams=new Map();
        data.forEach(
            e=>{
                newExams.set(e.id,{
                    id:e.id,
                    name:e.name,
                    attempts:(newExams.get(e.id) ? newExams.get(e.id).attempts : [])
                });

                newExams.get(e.id).attempts.push({
                    date:e.slotDate,
                    hour:e.slotHour,
                    mark:e.mark
                });
            }
        );
        let ne=Array.from(newExams.values());

        this.setState({exams:ne,loading:false});
    }

    componentDidMount(){
        API.getStudentExams(this.props.id).then(data=>this.updateExams(data));
    }

    render(){
        return (
            <>
            {
            this.state.exams.map(
                e=><Accordion key={`${e.id}Accordion`}>
                    <Card>
                    <Accordion.Toggle as={Card.Header}  eventKey="0">
                        <Accordion.Toggle as={Button} style={{color:"#17a2b8"}} variant="link" eventKey="0">{`${e.id} - ${e.name}`}</Accordion.Toggle>
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey="0">
                    <Card.Body >
                        {
                            e.attempts.map(
                                a=><div key={`${e.id+a.hour}SlotDiv`} className="d-flex justify-content-between align-items-baseline">
                                    <p>{`${a.date} - ${a.hour}`}</p>
                                    <div className="d-flex align-items-baseline">
                                        <p>{a.mark}</p>
                                        {
                                            (a.mark===null)&&(<>
                                            <p>Booked</p>
                                            {/*Tooltip over booking button*/}
                                            <OverlayTrigger
                                                placement='right'
                                                overlay={
                                                    <Tooltip id='tooltip'>
                                                    Delete your prenotation
                                                    </Tooltip>
                                                }
                                                >
                                            <button onClick={()=>{API.unbookSlot(this.props.id,{courseId:e.id,slotDate:a.date,slotHour:a.hour}); API.getStudentExams(this.props.id).then(data=>this.updateExams(data));}} style={{fontSize:"30px",border:0,color:"red",fontStyle:"bold",backgroundColor:"white"}}>
                                                <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-x pt-1" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                                                </svg>
                                            </button>
                                            </OverlayTrigger></>)
                                        }
                                    </div>
                                </div>
                                )
                        }
                    </Card.Body>
                    </Accordion.Collapse>
                </Card>
                </Accordion>
            )
            }
            
        </>
        )
    }
}

export {HomeStudent}