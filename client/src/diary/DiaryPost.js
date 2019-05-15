import React,{Component} from 'react';
// import ExplorPage from '../sharedSpace/ExplorPage';
// import Profile from '../Profile/Profile';
// import Post from './Post'
import {Modal,Button} from 'react-bootstrap';
import moment from 'moment';
import './diary.css';

class DiaryPost extends Component{
   constructor(props){

        super(props);
        this.state = {
            profile: {},
            name: '',
            email: '',
            authId:'',
            error: null,
            isLoaded: false,
            posts:[],
            editPost: false,
            selectedPost: "",
            postId: "",
            updatedPost: "",
            postbody: "",
            time: moment().format('MM/DD/YY hh:mm A')
        };
    }
   

    componentWillMount(){
        //call auth
        // this.setState({ profile: {} });

        // get the user auth if
        // store it as a variable
        const { userProfile, getProfile} = this.props.auth;


        // update state with user data
        if (!userProfile) {
          getProfile((err, profile) => {
            let sub = profile.sub.split("|");
            let id = sub[1]
            console.log('this is the id:', id)
            this.getUserpost(id)
            this.setState({
                profile: profile,
                authId: id,
                name: profile.name,
                email: profile.email
            })
            
          });
        } else {
            let sub = userProfile.sub.split("|");
            let id = sub[1]
            console.log(id)
            this.getUserpost(id)
          this.setState({
                profile: userProfile,
                authId: id,
                name: userProfile.name,
                email: userProfile.email
            });
          
        }
        
    }
    

    getUserpost = (id) => {
        console.log('this is the user id',id)
        // call the server 
        return fetch(`/diary/${id}`)
            .then(res=>{return res.json()})
            .then(userPosts => {
                console.log('users post',userPosts)
                this.setState({
                    isLoaded: true,
                    posts: userPosts
                });
            
            }).catch(err => console.log(err))
    }

 
    deletePost = (id, index) => {
        fetch(`/diary/${id}`,{
            method:'DELETE',
            headers:{
                'Accept': 'application/json'
            }
        })
        index = parseInt(index)
        // go to db delete where diary_id is id
        // if delete true the ....
        let prevPost = this.state.posts
        let newPost = prevPost.splice(index, 1)
        this.setState({
            posts: newPost
        })
        // else alert the user something went wrong and try again
    }

    handleEditPost = (id, index) => {
        let orginalPost = this.state.posts[index].diary_post;
        

        this.setState({
            editPost: true,
            selectedPost: index,
            postId: `${id}`,
            postbody: orginalPost
        });
    }

    handleAddPost = () => {
        this.setState({
            editPost: true
        })
    }

    handleClose = () => {
        this.setState({ editPost: false, selectedPost: "", updatedPost: "", postId: ""
     });
    }
    
    handleShow = () => {
        this.setState({ editPost: true });
    }

    saveEdit = (e,id) => {
        e.preventDefault()
        // edit post
        if( typeof this.state.postId === 'string' && this.state.postId.length > 0) {
            let payload = {
                updated_at: this.state.time,
                diary_Post: this.state.updatedPost
            }
            // send this.state.updatedPost to server
            // update post where id this.state.postId
            // put /diary/id
            // if post is updated then ....
            fetch(`/diary/${this.state.postId}`,{
                method: 'PUT',
                body:JSON.stringify(payload),
                headers:{'Content-Type':'application/json'}
            }).then(res => res.json());

            let post = this.state.posts[this.state.selectedPost]
            post.diary_post = this.state.updatedPost
    
            let oldPosts = this.state.posts;
            let newPosts = oldPosts.slice(this.state.selectedPost, 1, post)
    
            this.setState({
                posts: newPosts,
                editPost: false,
                selectedPost: "",
                postId: "",
                updatedPost: "",
                postbody: ""
            })
        }else {
            // creating a post
            let payload = {
                authid: this.state.authId,
                diary_post: this.state.updatedPost,
                created_at: this.state.time,
                updated_at: null,
                
            }
            console.log(payload);
            // console.log('this is payload',payload)
             fetch(`/diary`,{
                method: 'POST',
                body:JSON.stringify(payload),
                headers:{
                    'Content-Type':'application/json'
                }
             })
            .then(res=>{return res.json()})
            .then(newpost => {
                this.setState({
                    updatedPost: "",
                    editPost: false,
                    posts: [...this.state.posts, newpost]
                })
                
            
            }).catch(err => console.log(err))
    
            // send to server and add the response obj to this.state.posts
            // clear updatedPost "" and editPost false

        }
        
        // else alert user to try again
    }



    render(){
        console.log('this is the all the states',this.state)
        const {error, isLoaded, posts, name, editPost, selectedPost ,profile} = this.state;
        console.log('this is the client error',error)
        if(error){
            return<div>Error: {error.message}</div>;
        }else if (!isLoaded){
            return <div>Loading...</div>;
        }else{
            return (
            <div className='DiaryPost'> 
            <div className ='saveSpace'>
                <h2>Welcome, {name}!<br/> this is a space for your thoughts you don't want other to know</h2>
                <img src={profile.picture} alt="profile" />
                    <br />
                    <br />
                <div>
                    <Button onClick={this.handleShow}>Add New</Button>
                </div>
            </div>
            
                <ul>
                  
                    {(posts.length > 0)?
                        posts.map((post, index) =>(
                            <li className='diaryPost' key={index} data-id={post.diary_id}>
                                <div id='post'>
                                    <span>
                                        <h3>Dear Diary, </h3>
                                        <br/>
                                            <p id='text'>{post.diary_post}</p>
                                            <br/>
                                            <br/>
                                            <p>created at: {post.created_at}</p>
                                        
                                            {
                                                (post.updated_at !== null )? <p>last updated: {post.updated_at}</p>:''
                                            }
                                            <div id='diaryButton'>
                                                <button id='diaryButton'onClick={()=>this.deletePost(post.diary_id, index)}>Delete</button>
                                                <button  onClick={()=>this.handleEditPost(post.diary_id, index)}>Edit</button>
                                            </div>
                                        </span> 
                                </div>
                            </li>
                        ))
                    : 
                        "NO POST YET!"
                    }     
                   
                </ul>
                {/* <Post profileId ={this.props.profileId} addPost={this.handleAddPost}/> */} 
                
               
                 <Modal show={this.state.editPost} onHide={this.handleClose}>
                    <Modal.Header closeButton>
    
                    </Modal.Header>
                    <Modal.Body>
                    <div>
                test
                <textarea onChange={(e)=>{this.setState({updatedPost:e.target.value})}}>{this.state.postbody}</textarea>
    
                    <Button id='diaryButton' variant="secondary" onClick={this.handleClose}>
                            Cancel
                        </Button>
                        <Button id='diaryButton'variant="primary" onClick={this.saveEdit}>
                            Save Changes
                        </Button>
                 </div>
                    </Modal.Body>
                
                    
                    <Modal.Footer>
                       
                    </Modal.Footer>
                </Modal> 
                
              
            </div>)
        }
    }
}
export default DiaryPost;