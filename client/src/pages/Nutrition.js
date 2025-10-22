import React, { useState } from "react";
import "../styles/App.css";

const Nutrition = () => {
  const [query, setQuery] = useState("");
  const [foodList, setFoodList] = useState([]);
  const [selected, setSelected] = useState(null);

  const searchFoods = async () => {
    try {
      const res = await fetch(`/api/nutritionix?query=${query}`);
      const data = await res.json();
      setFoodList(data.hits || []);
    } catch {
      alert("⚠️ Nutrition data fetch failed");
    }
  };

  const selectFood = (food) => {
    setSelected(food);
  };

  return (
    <div className="nutrition-page">
      <h1>🍏 Nutrition Lookup</h1>
      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for food..."
        />
        <button onClick={searchFoods}>Search</button>
      </div>

      {foodList.length > 0 && (
        <ul className="dropdown">
          {foodList.map((f, i) => (
            <li key={i} onClick={() => selectFood(f.food)}>
              {f.food.label}
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="food-details">
          <h3>{selected.label}</h3>
          <p>Calories: {selected.nutrients.ENERC_KCAL} kcal</p>
          <p>Protein: {selected.nutrients.PROCNT} g</p>
          <p>Carbs: {selected.nutrients.CHOCDF} g</p>
          <p>Fats: {selected.nutrients.FAT} g</p>
        </div>
      )}
    </div>
  );
};

export default Nutrition;
