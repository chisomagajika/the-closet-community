import React, {Component} from 'react'
import Chatkit from '@pusher/chatkit-client'
import MessagesList from './MessagesList'
import SendMessageForm from './SendMessageForm'
import TypingIndicator from './TypingIndicator';
import WhosOnlineList from './WhosOnlineList';
import RoomList from './RoomList';
// import {instanceLocator} from './config';
import NewRoomForm from './NewRoomForm';

class ChatScreen extends Component {
    constructor() {
        super()
        this.state = {
            currentUser: {},
            currentRoom: {},
            messages: [], 
            text: '', 
            usersWhoAreTyping: [], 
            joinableRooms: [],
            joinedRooms: [],
            roomId: null,
        }
    }
    componentDidMount(){
        // console.log('this is the username', this.props.currentUsername)
        const chatManager = new Chatkit.ChatManager({
            instanceLocator: 'v1:us1:59afa2c3-15d7-4933-a26a-71a8ce12da18',
            userId:this.props.currentUsername,
            tokenProvider: new Chatkit.TokenProvider({
                url:'/authenticate/'
            }),
        })
        chatManager
        .connect()
        .then(currentUser => {
            console.log(currentUser)
            this.setState({currentUser})
            return currentUser.subscribeToRoom({
               roomId:'19423717',
            //    messageLimit:100,
               hooks:{
                onMessage: message => {
                    this.setState({
                        messages: [...this.state.messages, message]
                    })
                }, 
                onUserStartedTyping: user => {
                    this.setState({
                        usersWhoAreTyping: [...this.state.usersWhoAreTyping, user.name]
                    })
                }, 
                onUserStoppedTyping: user => {
                    this.setState({
                        usersWhoAreTyping: this.state.usersWhoAreTyping.filter(
                            username => username !== user.name
                        )
                    })
                },
            },
        })
    })
    .then(currentRoom => {
        this.setState({currentRoom})
    })
    .catch(error => console.error('Error: ', error))

    //get other rooms that are already created
    chatManager.connect()
    .then(currentUser => {
        this.currentUser = currentUser
        this.getRooms()
    })
    .catch(err => console.log('Error on connecting: ', err))    
    }

    //create a public room
    createRoom = (name) => {
             this.currentUser.createRoom({
                name,
            })
            .then(room => this.subscribeToRoom(room.id))
            .catch(err => console.log('Error with createRoom: ', err)) 
    }

    //create a private room
    createPrivateRoom = (userToChatWith) => {
            this.currentUser.createRoom({
                name: `Private Chat Room: ${this.currentUser.id} | ${userToChatWith}`,
                private: true,
                addUserIds: [this.currentUser.id, userToChatWith]
              }) 
              .then(room => this.subscribeToRoom(room.id))
              .catch(err => console.log('Error with createRoom: ', err)) 
    }

    //get joinable rooms
    getRooms = () => {
        this.currentUser.getJoinableRooms()
        .then(joinableRooms => {
            this.setState({
                joinableRooms, 
                joinedRooms: this.currentUser.rooms
            })
        })
        .catch(err => console.log('Error on joinableRooms: ', err))    
    }

    //subscribe a user to a room
    subscribeToRoom = (roomId) => {
        this.setState({messages: []})
        this.currentUser.subscribeToRoom({
            roomId: `${roomId}`, 
            hooks: {
                onMessage: message => {
                    this.setState({
                        messages: [...this.state.messages, message]
                    })
                }
            }
        })
        .then(room => {
            this.setState({
                roomId: room.id
            })
            this.getRooms()
        })
        .catch(err => console.log('error on subscribing to room:', err))
    }
    
    //send a message
    sendMessage = (text) => {
        this.state.currentUser.sendMessage({
        text,
        roomId: this.state.roomId,
        })
    }

    //user typing status
    sendTypingEvent = () => {
        this.state.currentUser
        .isTypingIn({roomId: this.state.currentRoom.id})
        .catch(error => console.log('error', error))
    }

    render() {
        const styles = {
          container: {
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
          },
          chatContainer: {
            display: 'flex',
            flex: 1,
          },
          whosOnlineListContainer: {
            width: '300px',
            flex: 'none',
            padding: 20,
            backgroundColor: 'black',
            color: 'white',
           
          },
          chatListContainer: {
            padding: 20,
            width: '85%',
            display: 'flex',
            flexDirection: 'column',
          },
       }
       return (
        <div className='chatbody'>
            {/* <h1 className='text-center'>Hello, {this.props.currentUsername}! Welcome to the Chat Room! </h1> */}
            <div style={styles.container}>
                <div style={styles.chatContainer}>
                    <aside style={styles.whosOnlineListContainer}>
                        <h2>Who's Online?</h2>
                        <WhosOnlineList 
                            handleUserChat={this.createPrivateRoom}
                            users={this.state.currentRoom.users} 
                            currentUser={this.state.currentUser}
                            />
                        <RoomList 
                            roomId={this.state.roomId}
                            subscribeToRoom={this.subscribeToRoom}
                            rooms={[...this.state.joinableRooms, ...this.state.joinedRooms]}
                            />
                        <NewRoomForm createRoom={this.createRoom}/>
                    </aside>
                    <section style={styles.chatListContainer}>
                        <MessagesList 
                            roomId={this.state.roomId}
                            messages={this.state.messages} 
                            style={styles.chatList}
                            />
                        <TypingIndicator 
                            usersWhoAreTyping={this.state.usersWhoAreTyping}
                            />
                        <SendMessageForm 
                            disabled={!this.state.roomId}
                            onSubmit={this.sendMessage} 
                            onChange={this.sendTypingEvent}
                            />
                    </section>
                </div>
            </div>
        </div>
      )
    }
  }

export default ChatScreen;
