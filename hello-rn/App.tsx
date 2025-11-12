import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  FlatList,
  Text,
  Image,
  StyleSheet,
  View,
  ActivityIndicator,
  TextInput,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform, // Importa o Platform
  StatusBar, // Importa a StatusBar
} from 'react-native';

// --- (Tipos e Constantes da API - sem mudança) ---
type Category = {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
};
type CategoryApiResponse = { categories: Category[] };
type Meal = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
};
type MealApiResponse = { meals: Meal[] | null };
type MealDetail = {
  idMeal: string;
  strMeal: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  [key: string]: string | null;
};
type MealDetailApiResponse = { meals: MealDetail[] };
const API_CATEGORIES = 'https://www.themealdb.com/api/json/v1/1/categories.php';
const API_FILTER_BY_CATEGORY = 'https://www.themealdb.com/api/json/v1/1/filter.php?c=';
const API_LOOKUP_BY_ID = 'https://www.themealdb.com/api/json/v1/1/lookup.php?i=';


// --- (Componente e Lógica - sem mudança) ---
export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMealDetail, setSelectedMealDetail] = useState<MealDetail | null>(null);
  const [loadingSecondary, setLoadingSecondary] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(API_CATEGORIES);
        if (!response.ok) throw new Error('Falha ao buscar categorias');
        const data: CategoryApiResponse = await response.json();
        setCategories(data.categories);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  const fetchMealsByCategory = async (categoryName: string) => {
    try {
      setLoadingSecondary(true);
      setError(null);
      setMeals([]);
      const response = await fetch(`${API_FILTER_BY_CATEGORY}${categoryName}`);
      if (!response.ok) throw new Error('Falha ao buscar receitas');
      const data: MealApiResponse = await response.json();
      setMeals(data.meals || []);
      setCurrentCategory(categoryName);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingSecondary(false);
    }
  };

  const fetchMealDetails = async (mealId: string) => {
    try {
      setLoadingSecondary(true);
      setError(null);
      const response = await fetch(`${API_LOOKUP_BY_ID}${mealId}`);
      if (!response.ok) throw new Error('Falha ao buscar detalhes');
      const data: MealDetailApiResponse = await response.json();
      setSelectedMealDetail(data.meals[0]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingSecondary(false);
    }
  };

  const parseIngredients = (detail: MealDetail): string[] => {
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ing = detail[`strIngredient${i}`];
      const measure = detail[`strMeasure${i}`];
      if (ing && ing.trim() !== '') {
        ingredients.push(`${measure ? measure.trim() : ''} ${ing.trim()}`.trim());
      } else {
        break;
      }
    }
    return ingredients;
  };

  const filteredCategories = useMemo(() => {
    const lowerCaseQuery = query.toLowerCase();
    if (!lowerCaseQuery) return categories;
    return categories.filter((c) =>
      c.strCategory.toLowerCase().includes(lowerCaseQuery)
    );
  }, [categories, query]);

  const goBackToCategories = () => {
    setCurrentCategory(null);
    setMeals([]);
    setError(null);
  };

  const closeModal = () => {
    setSelectedMealDetail(null);
  };

  // --- (Renderização - sem mudança na estrutura, apenas estilos) ---
  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  if (error && !loadingSecondary) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erro: {error}</Text>
        <TouchableOpacity style={styles.button} onPress={goBackToCategories}>
          <Text style={styles.buttonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        {currentCategory && (
          <TouchableOpacity onPress={goBackToCategories} style={styles.backButton}>
            <Text style={styles.backButtonText}>{"< Voltar"}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>
          {currentCategory ? `Receitas de ${currentCategory}` : "Categorias 🍔"}
        </Text>
        {currentCategory && <View style={{ width: 60 }} />}
      </View>

      {/* --- CONTEÚDO (Categorias OU Receitas) --- */}
      {!currentCategory ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Buscar categoria..."
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
          />
          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.idCategory}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => fetchMealsByCategory(item.strCategory)}>
                <View style={styles.card}>
                  <Image 
                    source={{ uri: item.strCategoryThumb?.replace('http://', 'https://') }} 
                    style={styles.image} 
                  />
                  <Text style={styles.cardTitle}>{item.strCategory}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.centerText}>Nenhuma categoria encontrada.</Text>}
          />
        </>
      ) : (
        <>
          {loadingSecondary ? (
            <View style={styles.center}><ActivityIndicator size="large" /></View>
          ) : (
            <FlatList
              data={meals}
              keyExtractor={(item) => item.idMeal}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => fetchMealDetails(item.idMeal)}>
                  <View style={styles.card}>
                    <Image 
                      source={{ uri: item.strMealThumb?.replace('http://', 'https://') }} 
                      style={styles.image} 
                    />
                    <Text style={styles.cardTitle}>{item.strMeal}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.centerText}>Nenhuma receita encontrada.</Text>}
            />
          )}
        </>
      )}

      {/* --- MODAL DE DETALHES DA RECEITA --- */}
      {selectedMealDetail && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={false}
          onRequestClose={closeModal}
        >
          <SafeAreaView style={styles.modalContainer}>
            <ScrollView>
              <Image 
                source={{ uri: selectedMealDetail.strMealThumb?.replace('http://', 'https://') }} 
                style={styles.modalImage} 
              />
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{selectedMealDetail.strMeal}</Text>
                <Text style={styles.modalSubtitle}>Região: {selectedMealDetail.strArea}</Text>
                <Text style={styles.modalSectionTitle}>Ingredientes</Text>
                {parseIngredients(selectedMealDetail).map((ing, index) => (
                  <Text key={index} style={styles.modalText}>• {ing}</Text>
                ))}
                <Text style={styles.modalSectionTitle}>Modo de Preparo</Text>
                <Text style={styles.modalText}>{selectedMealDetail.strInstructions}</Text>
                <TouchableOpacity style={[styles.button, styles.modalButton]} onPress={closeModal}>
                  <Text style={styles.buttonText}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
      {loadingSecondary && !currentCategory && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </SafeAreaView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5ff',
    // Adiciona padding no topo APENAS se for Android
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  centerText: { textAlign: 'center', marginTop: 20, color: '#666' },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center', marginBottom: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    // paddingVertical: 10, // <-- REMOVIDO
    paddingBottom: 10,      // ✅ CORREÇÃO: Apenas padding embaixo
    paddingTop: 5,          // ✅ CORREÇÃO: Um respiro mínimo em cima
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  input: {
    height: 44,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 10,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: '#eee', 
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Estilos do Modal
  modalContainer: {
    flex: 1,
    // Adiciona padding no topo APENAS se for Android
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  modalImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#eee', 
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#444',
    marginBottom: 15,
  },
  modalSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 5,
  },
  modalButton: {
    marginBottom: 30, 
  },
});