import React from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import {Redirect} from 'react-router-dom'
import API from './API.js'

/*
    When the route "/" is matched app.js renders the LoginChoice component
    which renders (basing on the state's attribute "mode") either the login
    type selectors or the login form selected.
*/
class LoginChoice extends React.Component{

    constructor(props){
        super(props);
        this.state={mode:"home",pastError:this.props.errDispl};
    }

    //Hides error messages from other pages
    resetPastError = () => this.setState({pastError:false})

    render() { 
        return  <div className="container-fluid">
        <div className="d-flex flex-column align-items-center">
        <h1 style={{textAlign:"center", marginTop:"1em",marginBottom:"3em",font:"roboto"}}>Exam Scheduling</h1>
        {(this.state.pastError)&&(<p style={{color:"red"}}>{this.props.err}</p>)}
        </div>
        {(this.state.mode==="home") && <ButtonGroup changeMode={this.changeMode}/>}
        {(this.state.mode!=="home") && <LoginForm mode={this.state.mode} changeMode={this.changeMode} resetPastError={this.resetPastError}/>}
        </div>
    }

    changeMode=(value)=>{
        this.setState({mode:value});
        this.resetPastError();
    }
}

/**
 * Renders the button group for the login type selection
 */
function ButtonGroup(props){
    return <div className="container-fluid d-flex justify-content-around "> 
        <Button variant="light" style={{opacity:"0.7",backgroundColor:"white"}} onClick={()=>props.changeMode("student")} > 
            <svg width="15em" height="15em" viewBox="0 0 16 16" className="bi bi-person" fill="currentColor" xmlns="http://www.w3.org/2000/svg" >
            <path fillRule="evenodd" d="M10 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm6 5c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
            </svg> 
            <br/> Student
        </Button>

        <Button variant="light" style={{opacity:"0.7",backgroundColor:"white"}} onClick={()=>props.changeMode("teacher")}> 
            <svg width="15em" height="15em" viewBox="0 0 16 16" className="bi bi-pencil-square" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456l-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
            <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
            </svg>
            <br/> Teacher
        </Button>
        </div>
}

/**
 * Renders the correct login form and provides the API calls for login.
 * It also displays any authentication or login error. 
 */
class LoginForm extends React.Component{

    constructor(props){
        super(props);
        this.state={id:"", password:"",err:""};
    }

    teacherLogin = ()=>{
        API.login(this.state.id,this.state.password).then( res=>{
            if(res.status!=200){
                this.setState({err:res.msg});
                this.props.resetPastError();
            } else  this.setState({err:"redirect-teacher"});
        })
    }

    studentLogin = ()=>{
        API.studentLogin(this.state.id).then(res=>{
            if(res!="200"){
                this.setState({err:"Student not found!"});
                this.props.resetPastError();
            } else  this.setState({err:"redirect-student"});
        })
    }

    render(){ 
        if(this.state.err==="redirect-teacher") 
            return <Redirect to={`/teachers/${this.state.id}`}/>

        if(this.state.err==="redirect-student") 
            return <Redirect to={`/students/${this.state.id}`}/>
    
        return ( 
                <div className="container d-flex flex-column align-items-center"> 
                    <h4 style={{marginBottom:"20px"}}>{this.props.mode.charAt(0).toUpperCase() + this.props.mode.slice(1) + " login"}</h4>
                    
                    {(this.state.err) && ( <h6 style={{color:"red"}}>{this.state.err}</h6>)}
                    
                    <Form onSubmit={ev=>ev.preventDefault()}>
                    
                        { (this.props.mode==="student") && ( <><Form.Group as={Row} controlId="formHorizontalStudent">
                            <Form.Label column sm={3}>ID</Form.Label>
                            <Col sm={9}>
                            <Form.Control name="id" type="text" placeholder="ID" onChange={ev=>this.setState({id:ev.target.value,password:""})}/>
                            </Col>
                            </Form.Group> 
                            <Button variant="outline-dark" onClick={()=>this.props.changeMode("home")} style={{marginRight:"12em"}}>Back</Button>
                            <Button variant="outline-dark" onClick={this.studentLogin}>Login</Button></>)
                        }

                        { (this.props.mode==="teacher") && ( <>
                            <Form.Group  controlId="formHorizontalTeacher">
                                <Row>
                                    <Form.Label column sm={3}>ID</Form.Label>
                                    <Col sm={9}>
                                        <Form.Control name="id" type="text" placeholder="ID" onChange={ev=>this.setState({id:ev.target.value})}/>
                                    </Col>
                                </Row>
                                <Row>
                                    <Form.Label column sm={3}>Password</Form.Label>
                                    <Col sm={9}>
                                        <Form.Control  name="password" type="password" placeholder="Password" onChange={ev=>this.setState({password:ev.target.value})}/>
                                    </Col>
                                </Row>
                            </Form.Group> 

                            <Button variant="outline-dark" onClick={()=>this.props.changeMode("home")} style={{marginRight:"12em"}}>Back</Button>
                            <Button variant="outline-dark" onClick={this.teacherLogin}>Login</Button></>) 
                        }  
                    </Form>
             </div>
    )}
}

export {LoginChoice}