import React, { Component } from 'react';
import { Text, View, Image } from 'react-native';

export default class HelloWorldApp extends Component {
  render() {
    var pic = {
      uri: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Bananavarieties.jpg'
    }
    return (
        <Image source={pic} style={{width:400,height:200}}></Image>
    );
  }
}
