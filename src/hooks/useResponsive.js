// src/hooks/useResponsive.js
// Approche mobile-first : chaque écran est pensé pour ~375-430px de large.
// Sur un écran plus large (web/PC), on ne réétire PAS les composants dans le
// vide — on centre une colonne de largeur contrainte, comme le fait X/LinkedIn
// en version desktop. Voir docs/ARCHITECTURE.md (ADR-001).
import { useWindowDimensions } from 'react-native';

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

// Largeur max de la colonne de contenu sur grand écran (évite les lignes de
// texte interminables et les cartes qui s'étirent de façon disproportionnée).
const MAX_CONTENT_WIDTH = 480;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isMobile = !isTablet;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    // À utiliser comme maxWidth + alignSelf: 'center' sur le conteneur racine
    // d'un écran pour obtenir l'effet "colonne centrée" sur web/desktop.
    contentMaxWidth: isTablet ? MAX_CONTENT_WIDTH : '100%',
  };
}
