import io from 'socket.io-client';
import React from 'react';
import { StatusBar, StyleSheet, Text, Vibration, View } from 'react-native';
import { Font, KeepAwake, ScreenOrientation, Speech } from 'expo';

const DESKTOP_ENDPOINT = 'http://192.168.1.20:3000';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  timerContainer: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#0D5',
    width: '100%',
  },
  text: {
    color: '#0D5',
    fontSize: 25,
    fontFamily: 'FreeMono',
  },
  messageContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      displayMessage: 'Prêt ?',
      isReady: false,
      remainingTime: 3600,
    };

    this.initializeSocket = this.initializeSocket.bind(this);
  }

  async componentWillMount() {
    this.initializeSocket();

    await Font.loadAsync({
      FreeMono: require('./assets/FreeMono.ttf'),
    });

    this.setState({ isReady: true });

    ScreenOrientation.allow(ScreenOrientation.Orientation.LANDSCAPE_LEFT);
    StatusBar.setHidden(true);
    this.timer = setInterval(() => {
      if (this.state.remainingTime === 0) {
        clearInterval(this.timer);
        Speech.speak("Évacuation d'urgence !", {
          language: 'fr-FR',
        });
        return;
      }
      this.setState({ remainingTime: this.state.remainingTime - 1 });
    }, 1000);
  }

  initializeSocket() {
    this.socket = io(DESKTOP_ENDPOINT);

    this.socket.on('mobile message', message => {
      this.setState({ displayMessage: JSON.parse(message) });
      Vibration.vibrate(1000);
    });
  }

  render() {
    const { displayMessage, isReady, remainingTime } = this.state;
    let sec = remainingTime % 60;
    sec = sec < 10 ? `0${sec}` : sec;
    let min = Math.floor((remainingTime / 60) % 60);
    min = min < 10 ? `0${min}` : min;
    let hours = Math.floor(remainingTime / 3600);
    hours = hours < 10 ? `0${hours}` : hours;

    if (!isReady) {
      return null;
    }

    return (
      <View style={styles.container}>
        <KeepAwake />
        <View style={styles.timerContainer}>
          <Text style={styles.text}>Temps avant extinction</Text>
          <Text style={styles.text}>
            {hours}:{min}:{sec}
          </Text>
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.text}>{displayMessage}</Text>
        </View>
      </View>
    );
  }
}
