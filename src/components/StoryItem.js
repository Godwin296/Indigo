import React from 'react';
import {View, Text, StyleSheet, Image,TouchableOpacity,} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function StoryItem({
  image,
  title,
  icon,
  active,
  add,
}) {
  return (
    <TouchableOpacity style={styles.container}>
      {image ? (
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: image }} style={styles.avatar} />

          {add && (
            <View style={styles.plusBadge}>
              <Ionicons name="add" size={16} color="white" />
            </View>
          )}
        </View>
      ) : (
        <LinearGradient
          colors={
            active
              ? ['#F5B53D', '#6C3BFF']
              : ['#592EFF', '#1E0F5E']
          }
          style={styles.gradientCircle}
        >
          <View style={styles.innerCircle}>
            <Ionicons name={icon} size={26} color="white" />
          </View>
        </LinearGradient>
      )}

      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },

  avatarWrapper: {
    position: 'relative',
  },

  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  plusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5B53D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#050530',
  },

  gradientCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  innerCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#0A0A4D',
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    color: 'white',
    marginTop: 10,
    fontSize: 15,
    fontWeight: '500',
  },
});