import io from 'socket.io-client';
import React from 'react';
import { Image, StatusBar, StyleSheet, Text, Vibration, View } from 'react-native';
import { AppLoading, Audio, Font, KeepAwake, ScreenOrientation } from 'expo';
import { Buffer } from 'buffer';

const DESKTOP_ENDPOINT = 'http://192.168.1.26:3000';

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
      displayImageHeight: null,
      displayImageURI: null,
      displayImageWidth: null,
      displayMessage: 'Prêt ?',
      isReady: false,
      remainingTime: 3600,
    };

    this.alarmSound = new Audio.Sound();
    this.ringSound = new Audio.Sound();

    this.dataReceived = this.dataReceived.bind(this);
    this.initializeSocket = this.initializeSocket.bind(this);
  }

  async componentWillMount() {
    this.initializeSocket();

    await Font.loadAsync({
      FreeMono: require('./assets/FreeMono.ttf'),
    });

    await this.alarmSound.loadAsync(require('./assets/alarm.mp3'));
    await this.ringSound.loadAsync(require('./assets/phone-ring.mp3'));

    this.setState({ isReady: true });

    ScreenOrientation.allow(ScreenOrientation.Orientation.LANDSCAPE_LEFT);
    StatusBar.setHidden(true);
  }

  initializeSocket() {
    this.socket = io(DESKTOP_ENDPOINT);

    this.socket.on('app message', async message => {
      this.dataReceived({
        displayImageHeight: null,
        displayImageURI: null,
        displayImageWidth: null,
        displayMessage: JSON.parse(message),
      });
    });

    this.socket.on('app timer updated', remainingTime => {
      if (remainingTime === 0) {
        this.alarmSound.playAsync();
        return;
      }
      this.setState({ remainingTime });
    });

    this.socket.on('app send image', image => {
      const widthFactor = image.width / 500 < 1 ? 1 : image.width / 400;
      const heightFactor = image.height / 250 < 1 ? 1 : image.height / 250;
      const sizeFactor = heightFactor > widthFactor ? heightFactor : widthFactor;
      this.dataReceived({
        displayImageURI: `data:image/png;base64, ${Buffer.from(image.fileBuffer).toString(
          'base64'
        )}`,
        displayImageHeight: Math.round(image.height / sizeFactor),
        displayImageWidth: Math.round(image.width / sizeFactor),
      });
    });
  }

  async dataReceived(newState) {
    this.setState(newState);
    Vibration.vibrate(1000);
    await this.ringSound.replayAsync();
  }

  render() {
    const {
      displayImageHeight,
      displayImageURI,
      displayImageWidth,
      displayMessage,
      isReady,
      remainingTime,
    } = this.state;
    let sec = remainingTime % 60;
    sec = sec < 10 ? `0${sec}` : sec;
    let min = Math.floor((remainingTime / 60) % 60);
    min = min < 10 ? `0${min}` : min;
    let hours = Math.floor(remainingTime / 3600);
    hours = hours < 10 ? `0${hours}` : hours;

    if (!isReady) {
      return <AppLoading />;
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
          {displayImageURI ? (
            <Image
              source={{ uri: displayImageURI }}
              style={{
                width: displayImageWidth,
                height: displayImageHeight,
                marginTop: 20,
                marginBottom: 20,
              }}
            />
          ) : (
            <Text style={styles.text}>{displayMessage}</Text>
          )}
        </View>
      </View>
    );
  }
}
