import React from 'react';
import { Alert, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Font, KeepAwake, Notifications, Permissions, ScreenOrientation } from 'expo';

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

    this.initializeNotifications = this.initializeNotifications.bind(this);
    this.handleNotificationReceived = this.handleNotificationReceived.bind(this);
  }

  async componentWillMount() {
    await Font.loadAsync({
      FreeMono: require('./assets/FreeMono.ttf'),
    });

    this.setState({ isReady: true });

    ScreenOrientation.allow(ScreenOrientation.Orientation.LANDSCAPE_LEFT);
    StatusBar.setHidden(true);
    setInterval(() => {
      this.setState({ remainingTime: this.state.remainingTime - 1 });
    }, 1000);

    this.initializeNotifications();
  }

  componentWillUnmount() {
    return this.eventHandle && this.eventHandle.remove();
  }

  async initializeNotifications() {
    try {
      const { status } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
      if (status !== 'granted') {
        Alert.alert(
          'Permissions manquante',
          "L'application requiert les notifications pour fonctionner."
        );
        return;
      }
      const token = await Notifications.getExpoPushTokenAsync();

      await fetch(`${DESKTOP_ENDPOINT}/set-token`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
        }),
      });
    } catch (err) {
      Alert.alert('Erreur', err.toString());
    }

    this.eventHandle = Notifications.addListener(this.handleNotificationReceived);
  }

  handleNotificationReceived(notification) {
    console.log(notification);
    this.setState({ displayMessage: notification.data.message });
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
