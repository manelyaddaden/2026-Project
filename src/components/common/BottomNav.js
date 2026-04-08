import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { styles } from '../../styles/styles';

// Bottom Navigation Component
export function BottomNav({ currentPage, onNavigate }) {
  return (
    <View style={styles.bottomNavBar}>
      <TouchableOpacity 
        style={[styles.bottomNavItem, currentPage === 'home' && styles.bottomNavItemActive]}
        onPress={() => onNavigate('home')}
      >
        <Text style={styles.bottomNavIcon}>🏠</Text>
        <Text style={[styles.bottomNavLabel, currentPage === 'home' && styles.bottomNavLabelActive]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.bottomNavItem, currentPage === 'myItems' && styles.bottomNavItemActive]}
        onPress={() => onNavigate('myItems')}
      >
        <Text style={styles.bottomNavIcon}>📦</Text>
        <Text style={[styles.bottomNavLabel, currentPage === 'myItems' && styles.bottomNavLabelActive]}>My Items</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.bottomNavItem, (currentPage === 'creation1' || currentPage === 'creation2') && styles.bottomNavItemActive]}
        onPress={() => onNavigate('creation1')}
      >
        <Text style={styles.bottomNavIcon}>➕</Text>
        <Text style={[styles.bottomNavLabel, (currentPage === 'creation1' || currentPage === 'creation2') && styles.bottomNavLabelActive]}>Add</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.bottomNavItem, currentPage === 'profile' && styles.bottomNavItemActive]}
        onPress={() => onNavigate('profile')}
      >
        <Text style={styles.bottomNavIcon}>👤</Text>
        <Text style={[styles.bottomNavLabel, currentPage === 'profile' && styles.bottomNavLabelActive]}>Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.bottomNavItem, currentPage === 'safety' && styles.bottomNavItemActive]}
        onPress={() => onNavigate('safety')}
      >
        <Text style={styles.bottomNavIcon}>🛡️</Text>
        <Text style={[styles.bottomNavLabel, currentPage === 'safety' && styles.bottomNavLabelActive]}>Safety</Text>
      </TouchableOpacity>
    </View>
  );
}
