import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
} from 'react-native-reanimated';

export default function SplashScreenPage() {
  const scale = useSharedValue(0.8);
  const floating = useSharedValue(0);
  const opacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo animation
    scale.value = withTiming(1, {
      duration: 1800,
      easing: Easing.out(Easing.exp),
    });

    opacity.value = withTiming(1, {
      duration: 1500,
      easing: Easing.out(Easing.ease),
    });

    // Subtitle appears slightly later
    subtitleOpacity.value = withDelay(
      800,
      withTiming(1, { duration: 1200 })
    );

    // Subtle floating animation
    floating.value = withRepeat(
      withTiming(-10, {
        duration: 2500,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: floating.value },
    ],
    opacity: opacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.background} />

      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Image
          source={require('../assets/splash.png')}
          style={styles.logo}
        />
      </Animated.View>

      <Animated.Text style={[styles.appName, textStyle]}>
        Student Redressal System
      </Animated.Text>

      <Animated.Text style={[styles.tagline, subtitleStyle]}>
        Empowering Students. Ensuring Fairness.
      </Animated.Text>

      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#ffffff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F3057', // Deep institutional blue
    justifyContent: 'center',
    alignItems: 'center',
  },

  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F3057',
  },

  logoContainer: {
    marginBottom: 25,
  },

  logo: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },

  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginTop: 10,
  },

  tagline: {
    fontSize: 14,
    color: '#D9E6F2',
    marginTop: 8,
    letterSpacing: 0.5,
  },

  loaderContainer: {
    position: 'absolute',
    bottom: 60,
  },
});