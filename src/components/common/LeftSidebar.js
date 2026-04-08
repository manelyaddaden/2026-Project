import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { styles } from '../../styles/styles';

// Left Sidebar Navigation
export function LeftSidebar({ currentPage, onNavigate }) {
  return (
    <View style={styles.leftSidebar}>
      <View style={styles.sidebarBrand}>
        <Text style={styles.sidebarBrandText}>LF</Text>
      </View>
      
      <View style={styles.sidebarNav}>
        <TouchableOpacity 
          style={[styles.sidebarNavItem, currentPage === 'home' && styles.sidebarNavItemActive]}
          onPress={() => onNavigate('home')}
        >
          <Text style={styles.sidebarNavIcon}>🏠</Text>
          <Text style={styles.sidebarNavLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sidebarNavItem, currentPage === 'myItems' && styles.sidebarNavItemActive]}
          onPress={() => onNavigate('myItems')}
        >
          <Text style={styles.sidebarNavIcon}>📦</Text>
          <Text style={styles.sidebarNavLabel}>My Items</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sidebarNavItem, (currentPage === 'creation1' || currentPage === 'creation2') && styles.sidebarNavItemActive]}
          onPress={() => onNavigate('creation1')}
        >
          <Text style={styles.sidebarNavIcon}>➕</Text>
          <Text style={styles.sidebarNavLabel}>Add Item</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sidebarNavItem, currentPage === 'profile' && styles.sidebarNavItemActive]}
          onPress={() => onNavigate('profile')}
        >
          <Text style={styles.sidebarNavIcon}>👤</Text>
          <Text style={styles.sidebarNavLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
