import React from "react";
import { View, Platform, KeyboardAvoidingView } from "react-native";
import { Bubble, GiftedChat } from "react-native-gifted-chat";
import * as firebase from "firebase";
import "firebase/firestore";
//import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDR2dfMQ-LEJsK1Ler79a_JL4e189k7Xqw",
  authDomain: "let--s-chat-1be9e.firebaseapp.com",
  projectId: "let--s-chat-1be9e",
  storageBucket: "let--s-chat-1be9e.appspot.com",
  messagingSenderId: "39544552828", //no  measurementId
};

export default class Chat extends React.Component {
  constructor(props) {
    super();
    this.state = {
      messages: [],
      uid: 0,
      user: {
        _id: "",
        name: "",
        avatar: "",
      },
    };

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    //this.referenceChatUser = null;
    this.referenceChatMessages = firebase.firestore().collection("messages");
  }

  componentDidMount() {
    // Set the page title once Chat is loaded
    let { name } = this.props.route.params;
    // Adds the name to top of screen
    this.props.navigation.setOptions({ title: name });
    this.unsubscribe = this.referenceChatMessages
      .orderBy("createdAt", "desc")
      .onSnapshot(this.onCollectionUpdate);

    /*   this.referenceChatMessages = firebase.firestore().collection("messages"); */
    this.authUnsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        await firebase.auth().signInAnonymously();
      }
      //update user state with currently active user data
      this.setState({
        uid: user.uid,
        messages: [],
        user: {
          _id: user.uid,
          name: name,
          avatar: "https://placeimg.com/140/142/any",
        },
      });

      // create a reference to the active user's documents
      this.referenceChatUser = firebase
        .firestore()
        .collection("messages")
        .where("uid", "==", this.state.uid);

      /* this.unsubscribeChatUser = this.referenceChatUser.onSnapshot(
        this.onCollectionUpdate
      ); */
    });
  }

  //update Collection
  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // go through each document
    querySnapshot.forEach((doc) => {
      // get the QueryDocumentSnapshot's data
      let data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: {
          _id: data.user._id,
          name: data.user.name,
          avatar: data.user.avatar,
        },
      });
    });
    this.setState({
      messages: messages,
    });
  };
  //unsubscribe from collection updates
  componentWillUnmount() {
    this.authUnsubscribe();
    this.unsubscribe();
  }

  onSend(messages = []) {
    this.setState(
      (previousState) => ({
        messages: GiftedChat.append(previousState.messages, messages),
      }),
      () => {
        this.addMessages();
      }
    );
  }
  //add new message to database
  addMessages() {
    const message = this.state.messages[0];
    this.referenceChatMessages.add({
      _id: message._id,
      text: message.text || "",
      createdAt: message.createdAt,
      user: this.state.user,
    });
  }
  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: "#1e085a",
          },
        }}
      />
    );
  }

  render() {
    //entered name state from Start screen gets displayed in status bar at the top of the app
    let { bgColor } = this.props.route.params;
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: bgColor,
        }}
        accessible={true}
      >
        <GiftedChat
          renderBubble={this.renderBubble.bind(this)}
          messages={this.state.messages}
          //user={this.state.user}
          onSend={(messages) => this.onSend(messages)}
          user={{
            _id: this.state.user._id,
            name: this.state.name,
            avatar: this.state.user.avatar,
          }}
        />

        {Platform.OS === "android" ? (
          <KeyboardAvoidingView behavior="height" />
        ) : null}
      </View>
    );
  }
}
