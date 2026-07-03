import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  Ionicons,
} from '@expo/vector-icons';

// Utilisation de ton fichier de constantes
import { COLORS } from '../constants/colors';

// Imports de tes composants dans le dossier components
import StoryItem from '../components/StoryItem';
import ComposerCards from '../components/ComposerCards';
import FeedPostCard from '../components/FeedPostCard';

export default function FeedScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Fond dégradé Indigo */}
      <LinearGradient
        colors={['#050530', '#07073D', '#040426']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={30} color="white" />
        </TouchableOpacity>

        <View style={styles.logoContainer}> 
          <Text style={styles.logo}>indigo</Text>
          <Text style={styles.logoSub}>TOUCO</Text>
        </View>

        <View style={styles.headerRight}>
          <Ionicons name="search-outline" size={26} color="white" />

          <View style={styles.notificationWrapper}>
            <Ionicons name="notifications-outline" size={26} color="white" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </View>

          <Ionicons name="chatbubble-ellipses-outline" size={25} color="white" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }} // Ajusté car la navigation est gérée par l'AppNavigator
      >
        {/* Barre des Stories / Filtres */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storyContainer}
        >
          <StoryItem
            image="https://i.pravatar.cc/300"
            title="Votre story"
            add
          />
          <StoryItem icon="compass-outline" active title="Découverte" />
          <StoryItem icon="color-filter-outline" title="Talents" />
          <StoryItem icon="briefcase-outline" title="Services" />
          <StoryItem icon="bag-handle-outline" title="Offres" />
          <StoryItem icon="business-outline" title="Entreprises" />
        </ScrollView>

        <ComposerCards />

        {/* Premier Post : Junior Tchamda */}
        <FeedPostCard
          user="Junior Tchamda"
          location="Menuisier • Dschang"
          time="2h"
          verified={true}
          rating="4,8"
          reviews="32 avis"
          title="Réalisation d’une armoire sur mesure 📦"
          description={"Disponible pour vos travaux de menuiserie intérieure.\nQualité 💯 • Respect des délais • Finition parfaite ✨"}
          hashtags="#Menuiserie #SurMesure"
          avatar="https://i.pravatar.cc/301"
          images={[
            'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
          ]}
        />

        {/* Deuxième Post : Recrutement */}
        <FeedPostCard
          user="TechVision SARL"
          location="Entreprise • Informatique"
          time="3h"
          verified={true}
          rating="5.0"
          reviews="12 avis"
          title="Nous recrutons un développeur Fullstack 💻"
          description="Rejoignez notre équipe dynamique et travaillez sur des projets innovants."
          hashtags="#Recrutement #Fullstack"
          avatar="https://i.pravatar.cc/302"
          images={[
            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
          ]}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 12,
  },
  logo: {
    color: 'white',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  logoSub: {
    color: '#E4B04E',
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 5,
    marginTop: -2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  notificationWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5B53D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#1A1A1A',
    fontWeight: '800',
    fontSize: 11,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  storyContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 18,
  },
});