import React, { useState, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';
import { foodApi } from '../../services/api';

export const FoodScreen = (): React.JSX.Element => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const logMeal = useAuthStore((s) => s.logMeal);
  const mealLogs = useAuthStore((s) => s.mealLogs);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<Array<{ name: string; carbs: number }>>([]);
  const [totalCarbs, setTotalCarbs] = useState(0);

  // Reset form when navigating away
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedFoods([]);
        setTotalCarbs(0);
        setSearchQuery('');
      };
    }, []),
  );

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

  const saveMeal = async () => {
    if (selectedFoods.length === 0) {
      Alert.alert('Error', 'Please add at least one food item');
      return;
    }

    // Persist locally
    logMeal({ foods: selectedFoods, totalCarbs });

    // Attempt backend sync (non-blocking)
    foodApi.logMeal({ foods: selectedFoods, totalCarbs }).catch(() => {});

    setSelectedFoods([]);
    setTotalCarbs(0);
    setSearchQuery('');

    Alert.alert('Meal Saved', `${totalCarbs}g carbs logged.`, [{ text: 'OK' }]);
  };

  const calculateBolus = () => {
    if (totalCarbs === 0) {
      Alert.alert('No carbs', 'Add food items first.');
      return;
    }
    navigation.navigate('BolusCalculator' as never, { carbs: totalCarbs } as never);
  };

  // Today's meals
  const today = new Date().toDateString();
  const todayMeals = mealLogs.filter(
    (m) => new Date(m.timestamp).toDateString() === today,
  );
  const todayCarbs = todayMeals.reduce((sum, m) => sum + m.totalCarbs, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>Log Food</Text>
          {todayMeals.length > 0 && (
            <Text style={[styles.todaySummary, { color: theme.colors.text.secondary }]}>
              Today: {todayCarbs}g carbs across {todayMeals.length} meal{todayMeals.length > 1 ? 's' : ''}
            </Text>
          )}
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

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.colors.primary[500] }]}
                onPress={saveMeal}
              >
                <Icon name="content-save" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Save Meal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.colors.secondary[500] }]}
                onPress={calculateBolus}
              >
                <Icon name="calculator" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Calculate Bolus</Text>
              </TouchableOpacity>
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

        {/* Today's Meal Log */}
        {todayMeals.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Today's Meals
            </Text>
            {todayMeals.map((meal) => (
              <View
                key={meal.id}
                style={[styles.mealLogRow, { borderBottomColor: theme.colors.border }]}
              >
                <View>
                  <Text style={[styles.mealLogFoods, { color: theme.colors.text.primary }]}>
                    {meal.foods.map((f) => f.name).join(', ')}
                  </Text>
                  <Text style={[styles.mealLogTime, { color: theme.colors.text.secondary }]}>
                    {new Date(meal.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text style={[styles.mealLogCarbs, { color: theme.colors.primary[500] }]}>
                  {meal.totalCarbs}g
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700' },
  todaySummary: { fontSize: 14, marginTop: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16 },
  section: { borderRadius: 12, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectedItemText: { fontSize: 16 },
  selectedItemRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  carbsText: { fontSize: 14, fontWeight: '500' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    marginBottom: 12,
  },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 16, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 12,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  quickAddGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickAddItem: { width: '47%', borderRadius: 12, padding: 16, alignItems: 'center' },
  quickAddName: { fontSize: 14, fontWeight: '500', marginTop: 8, textAlign: 'center' },
  quickAddCarbs: { fontSize: 12, marginTop: 4 },
  mealLogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  mealLogFoods: { fontSize: 14, fontWeight: '500', maxWidth: '80%' },
  mealLogTime: { fontSize: 12, marginTop: 2 },
  mealLogCarbs: { fontSize: 16, fontWeight: '700' },
});
