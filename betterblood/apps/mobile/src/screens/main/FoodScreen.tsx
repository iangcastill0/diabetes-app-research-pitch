import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeProvider';

export const FoodScreen = (): React.JSX.Element => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<Array<{ name: string; carbs: number }>>([]);
  const [totalCarbs, setTotalCarbs] = useState(0);

  const quickAddFoods = [
    { name: 'Apple', carbs: 25, icon: 'food-apple' },
    { name: 'Banana', carbs: 27, icon: 'food-apple' },
    { name: 'Rice (1 cup)', carbs: 45, icon: 'rice' },
    { name: 'Bread (1 slice)', carbs: 15, icon: 'bread-slice' },
    { name: 'Pasta (1 cup)', carbs: 40, icon: 'pasta' },
    { name: 'Milk (1 cup)', carbs: 12, icon: 'cup-water' },
  ];

  const addFood = (name: string, carbs: number) => {
    setSelectedFoods([...selectedFoods, { name, carbs }]);
    setTotalCarbs(totalCarbs + carbs);
  };

  const removeFood = (index: number) => {
    const removed = selectedFoods[index];
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
    setTotalCarbs(totalCarbs - removed.carbs);
  };

  const saveMeal = () => {
    if (selectedFoods.length === 0) {
      Alert.alert('Error', 'Please add at least one food item');
      return;
    }

    Alert.alert(
      'Meal Saved',
      `Total carbs: ${totalCarbs}g`,
      [{ text: 'OK' }]
    );

    // Reset
    setSelectedFoods([]);
    setTotalCarbs(0);
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Log Food
          </Text>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
          <Icon name="magnify" size={20} color={theme.colors.text.secondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search food database..."
            placeholderTextColor={theme.colors.text.disabled}
          />
        </View>

        {/* Selected Foods */}
        {selectedFoods.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Selected Items
            </Text>
            {selectedFoods.map((food, index) => (
              <View key={index} style={styles.selectedItem}>
                <Text style={[styles.selectedItemText, { color: theme.colors.text.primary }]}>
                  {food.name}
                </Text>
                <View style={styles.selectedItemRight}>
                  <Text style={[styles.carbsText, { color: theme.colors.primary[500] }]}>
                    {food.carbs}g
                  </Text>
                  <TouchableOpacity onPress={() => removeFood(index)}>
                    <Icon name="close-circle" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <View style={[styles.totalRow, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.totalLabel, { color: theme.colors.text.primary }]}>
                Total Carbs
              </Text>
              <Text style={[styles.totalValue, { color: theme.colors.primary[500] }]}>
                {totalCarbs}g
              </Text>
            </View>
          </View>
        )}

        {/* Quick Add */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Quick Add
          </Text>
          <View style={styles.quickAddGrid}>
            {quickAddFoods.map((food, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickAddItem, { backgroundColor: theme.colors.card }]}
                onPress={() => addFood(food.name, food.carbs)}
              >
                <Icon name={food.icon} size={24} color={theme.colors.primary[500]} />
                <Text style={[styles.quickAddName, { color: theme.colors.text.primary }]}>
                  {food.name}
                </Text>
                <Text style={[styles.quickAddCarbs, { color: theme.colors.text.secondary }]}>
                  {food.carbs}g carbs
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        {selectedFoods.length > 0 && (
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={saveMeal}
          >
            <Text style={styles.saveButtonText}>Save Meal</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectedItemText: {
    fontSize: 16,
  },
  selectedItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  carbsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAddItem: {
    width: '47%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  quickAddName: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  quickAddCarbs: {
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
