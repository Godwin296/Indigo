import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { postService } from '../services/PostService';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 140;

const AVAILABILITY_LABELS = {
  disponible: 'Disponible',
  occupe: 'Occupé',
  indisponible: 'Indisponible',
};

export default function ProfileScreen({ navigation }) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('Aperçu');
  const [userPosts, setUserPosts] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    postService
      .fetchUserPosts(user.id)
      .then(setUserPosts)
      .catch((e) => console.error('Erreur chargement publications:', e.message));
  }, [user?.id]);

  const realisations = userPosts.filter((p) => p.post_type === 'realisation');

  // --- ÉTATS POUR L'ANIMATION DU NOM ---
  const [isRealIdentity, setIsRealIdentity] = useState(false);
  const pseudo = profile?.pseudo || 'Utilisateur';
  const realName = profile?.profiles_private?.real_name || pseudo;
  const [displayName, setDisplayName] = useState(pseudo);

  const socialAvatar = profile?.avatar_url || 'https://i.pravatar.cc/300';
  const realPhoto = profile?.profiles_private?.real_photo_url || socialAvatar;
  const coverImage = profile?.cover_url || 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1200';
  const memberSince = profile?.created_at
    ? `${Math.max(1, Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (365 * 24 * 3600 * 1000)))} an(s)`
    : '—';

  // --- LOGIQUE TYPEWRITER (Machine à écrire) ---
  useEffect(() => {
    let targetName = isRealIdentity ? realName : pseudo;
    let timer;

    if (displayName !== targetName) {
      if (targetName.startsWith(displayName)) {
        // Mode ÉCRITURE : on ajoute une lettre
        timer = setTimeout(() => {
          setDisplayName(targetName.slice(0, displayName.length + 1));
        }, 40); 
      } else {
        // Mode EFFACEMENT : on retire une lettre
        timer = setTimeout(() => {
          setDisplayName(displayName.slice(0, -1));
        }, 20);
      }
    }
    return () => clearTimeout(timer);
  }, [displayName, isRealIdentity, pseudo, realName]);

  // Détecter le swipe sur l'avatar
  const onAvatarScroll = (event) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    // Si on a scrollé plus de la moitié de la taille de l'avatar
    if (xOffset > AVATAR_SIZE / 2) {
      setIsRealIdentity(true);
    } else {
      setIsRealIdentity(false);
    }
  };

  // --- MOTEUR DE RENDU DES ONGLET ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Aperçu':
        return (
          <View style={styles.contentSection}>
            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <Text style={styles.sectionTitle}>À propos</Text>
                <AboutItem label="Spécialité" value={profile?.main_skill || 'Non renseigné'} />
                <AboutItem label="Expérience" value={profile?.experience_years ? `${profile.experience_years}+ ans d'expérience` : 'Non renseigné'} />
                <AboutItem label="Disponibilité" value={AVAILABILITY_LABELS[profile?.availability] || 'Non renseigné'} isTag />
                <AboutItem label="Quartier" value={profile?.neighborhood || profile?.city || 'Dschang'} />
              </View>
              <View style={styles.halfColumn}>
                 <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Compétence principale</Text>
                 </View>
                 {profile?.main_skill ? (
                   <SkillItem name={profile.main_skill} level={0.9} />
                 ) : (
                   <Text style={styles.aboutValue}>Ajoute ta compétence dans "Modifier le profil"</Text>
                 )}

                 <TouchableOpacity
                   style={[styles.expertCard, { marginTop: 20 }]}
                   onPress={() => !profile?.verified_badge && navigation.navigate('RequestVerification')}
                 >
                    <LinearGradient colors={['#3F37C9', '#6C3BFF']} style={styles.expertIcon}>
                      <MaterialCommunityIcons name="crown" size={22} color="#E4B04E" />
                    </LinearGradient>
                    <View style={{marginLeft: 12}}>
                      <Text style={styles.expertTitle}>{profile?.verified_badge ? 'Expert Vérifié' : 'Pas encore vérifié'}</Text>
                      <Text style={styles.expertSub}>
                        {profile?.verified_badge ? 'Profil certifié Indigo' : 'Toucher pour demander la vérification'}
                      </Text>
                    </View>
                 </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 'Réalisations':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Projets récents</Text>
            {realisations.length === 0 ? (
              <Text style={styles.aboutValue}>
                Aucune réalisation publiée pour l'instant — publie une "Réalisation" depuis l'onglet Publier.
              </Text>
            ) : (
              <View style={styles.galleryGrid}>
                {realisations.map((post) => (
                  <View key={post.id} style={styles.galleryCard}>
                    <Image
                      source={{ uri: post.media?.[0]?.url || 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500' }}
                      style={styles.galleryImg}
                    />
                    <Text style={styles.galleryTitle}>{post.title}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      case 'Avis':
        // Système d'avis réel = Module 4 (notation post-contrat), Chantier C.
        // Exemple illustratif en attendant.
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Avis clients (156)</Text>
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewUser}>Dr. Landry T.</Text>
                <Text style={styles.reviewDate}>Il y a 2 jours</Text>
              </View>
              <View style={styles.starsRow}>
                {[1,2,3,4,5].map(s => <Ionicons key={s} name="star" size={14} color="#E4B04E" />)}
              </View>
              <Text style={styles.reviewText}>"Junior est très pro. Il a compris mes besoins pour mon app de clinique immédiatement."</Text>
            </View>
          </View>
        );

      case 'Services':
        const services = userPosts.filter((p) => p.post_type === 'service');
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Mes Services</Text>
            {services.length === 0 ? (
              <Text style={styles.aboutValue}>Aucun service publié pour l'instant.</Text>
            ) : (
              services.map((s) => (
                <ServiceItem
                  key={s.id}
                  title={s.title}
                  desc={s.description}
                  price={s.price ? `Dès ${s.price} FCFA` : 'Prix sur demande'}
                />
              ))
            )}
          </View>
        );

      case 'Infos':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Informations privées</Text>
            <InfoItem icon="mail" label="Email" value={isRealIdentity ? (profile?.profiles_private?.email || 'Non renseigné') : '••••••••@indigo.com'} />
            <InfoItem icon="call" label="Numéro" value={isRealIdentity ? (profile?.profiles_private?.phone || 'Non renseigné') : '+237 •••••••••'} />
            <InfoItem icon="pin" label="Quartier" value={profile?.neighborhood || profile?.city || 'Dschang'} />
          </View>
        );
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <ImageBackground 
          source={{ uri: coverImage }} 
          style={styles.coverImage}
        >
          <LinearGradient colors={['rgba(5,5,48,0.2)', 'rgba(5,5,48,1)']} style={styles.coverOverlay}>
             <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color="white" /></TouchableOpacity>
             <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('EditProfile')}><Ionicons name="settings-outline" size={24} color="white" /></TouchableOpacity>
             <TouchableOpacity style={styles.editCoverBtn} onPress={() => navigation.navigate('EditProfile')}>
                <Ionicons name="camera-outline" size={16} color="white" />
                <Text style={styles.editCoverText}>Modifier</Text>
             </TouchableOpacity>
          </LinearGradient>
        </ImageBackground>

        {/* PROFIL CORE */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <ScrollView 
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                onScroll={onAvatarScroll}
                scrollEventThrottle={16}
              >
                <Image source={{ uri: socialAvatar }} style={styles.avatarSlide} />
                {/* Utilisation de Key pour forcer le refresh sur tablette */}
                <Image key={realPhoto} source={{ uri: realPhoto }} style={styles.avatarSlide} />
              </ScrollView>
            </View>
            <TouchableOpacity style={styles.avatarEditBtn} onPress={() => navigation.navigate('EditProfile')}><Ionicons name="camera" size={18} color="white" /></TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.editProfileFloat} onPress={() => navigation.navigate('EditProfile')}><Ionicons name="pencil" size={22} color="white" /></TouchableOpacity>

          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              {/* Affichage du nom avec curseur clignotant */}
              <Text style={styles.userName}>{displayName}<Text style={{color: COLORS.primary}}>|</Text></Text>
              <MaterialCommunityIcons 
                name={isRealIdentity ? "shield-check" : "check-decagram"} 
                size={24} 
                color={isRealIdentity ? "#4CAF50" : (profile?.verified_badge ? "#E4B04E" : "#555")} 
              />
            </View>
            <Text style={styles.userHandle}>
                {isRealIdentity ? "Identité Réelle" : `@${pseudo.toLowerCase().replace(/\s/g, '_')}`}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.onlineBadge} />
            <Text style={styles.statusText}>{AVAILABILITY_LABELS[profile?.availability] || 'Disponible'} • <Text style={{color: COLORS.primary}}>{profile?.main_skill || 'Talent'}</Text></Text>
            <Ionicons name="location" size={14} color={COLORS.primary} style={{marginLeft: 15}} />
            <Text style={styles.statusText}>{profile?.neighborhood || profile?.city || 'Dschang'}</Text>
          </View>

          <Text style={styles.bioText}>{profile?.bio || 'Aucune bio pour l’instant — ajoute-la depuis "Modifier le profil".'}</Text>

          <View style={styles.statsContainer}>
            <StatItem label="Note" value={profile?.rating_average ? profile.rating_average.toFixed(1) : '—'} icon="star" color="#E4B04E" />
            <View style={styles.statDivider} />
            <StatItem label="Contrats" value={profile?.contracts_completed ?? 0} />
            <View style={styles.statDivider} />
            <StatItem label="Avis" value={profile?.rating_count ?? 0} />
            <View style={styles.statDivider} />
            <StatItem label="Ancienneté" value={memberSince} />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.contactBtn}>
              <Ionicons name="chatbubble-ellipses" size={20} color="white" />
              <Text style={styles.actionBtnText}>Contacter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call-outline" size={20} color="white" />
              <Text style={styles.actionBtnText}>Appeler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.plusBtn}><Ionicons name="ellipsis-horizontal" size={20} color="white" /></TouchableOpacity>
          </View>
        </View>

        {/* TABS MENU */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Aperçu', 'Réalisations', 'Avis', 'Services', 'Infos'].map(tab => (
              <TouchableOpacity 
                key={tab} 
                onPress={() => setActiveTab(tab)}
                style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* DYNAMIC CONTENT */}
        {renderTabContent()}

        <View style={{height: 100}} />
      </ScrollView>
    </View>
  );
}

// --- SOUS-COMPOSANTS ---
const ServiceItem = ({ title, desc, price }) => (
  <View style={styles.serviceCard}>
    <View style={{flex: 1}}>
      <Text style={styles.serviceTitle}>{title}</Text>
      <Text style={styles.serviceDesc}>{desc}</Text>
    </View>
    <Text style={styles.servicePrice}>{price}</Text>
  </View>
);

const InfoItem = ({ icon, label, value }) => (
  <View style={styles.infoItem}>
    <Ionicons name={icon} size={20} color={COLORS.primary} style={{width: 30}} />
    <View>
      <Text style={styles.aboutLabel}>{label}</Text>
      <Text style={styles.aboutValue}>{value}</Text>
    </View>
  </View>
);

const StatItem = ({ label, value, icon, color }) => (
  <View style={styles.statItem}>
    <View style={styles.statValueRow}>
      {icon && <Ionicons name={icon} size={14} color={color} style={{marginRight: 4}} />}
      <Text style={styles.statValue}>{value}</Text>
    </View>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SkillItem = ({ name, level }) => (
  <View style={styles.skillRow}>
    <Text style={styles.skillName}>{name}</Text>
    <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${level * 100}%` }]} /></View>
  </View>
);

const AboutItem = ({ label, value, isTag }) => (
  <View style={styles.aboutItem}>
    <Text style={styles.aboutLabel}>{label}</Text>
    {isTag ? (
      <View style={styles.tag}><Text style={styles.tagText}>{value}</Text></View>
    ) : (
      <Text style={styles.aboutValue}>{value}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050530' },
  coverImage: { height: 240, width: '100%' },
  coverOverlay: { flex: 1, padding: 20, justifyContent: 'flex-end', alignItems: 'flex-end' },
  backBtn: { position: 'absolute', top: 50, left: 20 },
  settingsBtn: { position: 'absolute', top: 50, right: 20 },
  editCoverBtn: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, alignItems: 'center', gap: 6 },
  editCoverText: { color: 'white', fontSize: 11, fontWeight: '600' },
  profileSection: { paddingHorizontal: 20, marginTop: -70 },
  avatarContainer: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  avatarWrapper: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, borderWidth: 4, borderColor: '#050530', backgroundColor: '#07073D', overflow: 'hidden' },
  avatarSlide: { width: AVATAR_SIZE - 8, height: AVATAR_SIZE - 8 },
  avatarEditBtn: { position: 'absolute', bottom: 5, right: 5, backgroundColor: COLORS.primary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#050530' },
  editProfileFloat: { position: 'absolute', top: 80, right: 0, backgroundColor: 'rgba(255,255,255,0.05)', width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  nameContainer: { marginTop: 15 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { color: 'white', fontSize: 30, fontWeight: '800' },
  userHandle: { color: '#888', fontSize: 15, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  onlineBadge: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50', marginRight: 8 },
  statusText: { color: '#aaa', fontSize: 14 },
  bioText: { color: '#ccc', fontSize: 15, marginTop: 15, lineHeight: 22 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 20, alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  statValue: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#666', fontSize: 10, marginTop: 5 },
  statValueRow: { flexDirection: 'row', alignItems: 'center' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 30 },
  contactBtn: { flex: 2, backgroundColor: COLORS.primary, flexDirection: 'row', height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 10 },
  callBtn: { flex: 2, backgroundColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  plusBtn: { width: 55, backgroundColor: 'rgba(255,255,255,0.05)', height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  tabsContainer: { flexDirection: 'row', marginTop: 35, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10 },
  tabItem: { paddingBottom: 15, marginRight: 25 },
  activeTabItem: { borderBottomWidth: 3, borderBottomColor: '#E4B04E' },
  tabText: { color: '#888', fontSize: 14 },
  activeTabText: { color: 'white', fontWeight: 'bold' },
  contentSection: { padding: 20 },
  row: { flexDirection: 'row', gap: 20 },
  halfColumn: { flex: 1 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  aboutItem: { marginBottom: 15 },
  aboutLabel: { color: '#555', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 },
  aboutValue: { color: '#ddd', fontSize: 14 },
  tag: { backgroundColor: 'rgba(76,175,80,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start' },
  tagText: { color: '#4CAF50', fontSize: 11, fontWeight: 'bold' },
  skillRow: { marginBottom: 18 },
  skillName: { color: '#bbb', fontSize: 14, marginBottom: 8 },
  progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  expertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 15 },
  expertIcon: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  expertTitle: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  expertSub: { color: '#666', fontSize: 11, marginTop: 2 },
  // Gallery
  galleryGrid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  galleryCard: { width: '48%', marginBottom: 15 },
  galleryImg: { width: '100%', height: 120, borderRadius: 12, backgroundColor: '#07073D' },
  galleryTitle: { color: '#ddd', marginTop: 8, fontSize: 12, fontWeight: 'bold' },
  // Reviews
  reviewCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 15, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewUser: { color: 'white', fontWeight: 'bold' },
  reviewDate: { color: '#555', fontSize: 10 },
  starsRow: { flexDirection: 'row', marginVertical: 5 },
  reviewText: { color: '#aaa', fontSize: 13, lineHeight: 18 },
  // Services
  serviceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 15, marginBottom: 12 },
  serviceTitle: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  serviceDesc: { color: '#777', fontSize: 12, marginTop: 4 },
  servicePrice: { color: COLORS.primary, fontWeight: 'bold' },
  // Infos
  infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12 }
});